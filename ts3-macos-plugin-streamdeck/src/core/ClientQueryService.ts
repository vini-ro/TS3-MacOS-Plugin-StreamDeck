import { Socket } from "net";
import { EventEmitter } from "events";

/**
 * TeamSpeak 3 ClientQuery Service
 * Manages TCP connection to TeamSpeak 3 ClientQuery interface (telnet at 127.0.0.1:25639)
 * Handles authentication, command execution, and response parsing
 */
export class ClientQueryService extends EventEmitter {
	private socket: Socket | null = null;
	private host = "127.0.0.1";
	private port = 25639;
	private connected = false;
	private authenticated = false;
	private reconnectTimer: NodeJS.Timeout | null = null;
	private reconnectDelay = 5000; // 5 seconds
	private responseBuffer = "";
	private apiKey: string | null = null;
	private pendingCommand: { resolve: (value: string) => void; reject: (error: Error) => void } | null = null;

	/**
	 * Connect to TeamSpeak 3 ClientQuery interface
	 */
	async connect(apiKey?: string): Promise<void> {
		if (this.connected) {
			return;
		}

		this.apiKey = apiKey || null;
		
		return new Promise((resolve, reject) => {
			this.socket = new Socket();

			this.socket.on("data", (data) => this.handleData(data));
			this.socket.on("error", (error) => this.handleError(error));
			this.socket.on("close", () => this.handleClose());

			this.socket.connect(this.port, this.host, async () => {
				this.connected = true;
				this.emit("connected");
				
				// Wait for welcome messages
				await this.waitForWelcome();
				
				// Authenticate if API key is provided
				if (this.apiKey) {
					await this.authenticate();
				}
				
				resolve();
			});

			// Timeout for connection
			setTimeout(() => {
				if (!this.connected) {
					reject(new Error("Connection timeout"));
				}
			}, 10000);
		});
	}

	/**
	 * Wait for TeamSpeak welcome messages
	 */
	private async waitForWelcome(): Promise<void> {
		return new Promise((resolve) => {
			const checkWelcome = () => {
				// TeamSpeak sends welcome messages, wait for them
				setTimeout(() => {
					this.responseBuffer = "";
					resolve();
				}, 500);
			};
			checkWelcome();
		});
	}

	/**
	 * Authenticate with API key
	 */
	private async authenticate(): Promise<void> {
		if (!this.apiKey) {
			return;
		}

		try {
			await this.sendCommand(`auth apikey=${this.escapeValue(this.apiKey)}`);
			this.authenticated = true;
			this.emit("authenticated");
		} catch (error) {
			console.error("Authentication failed:", error);
			this.authenticated = false;
		}
	}

	/**
	 * Handle incoming data from TeamSpeak
	 */
	private handleData(data: Buffer): void {
		this.responseBuffer += data.toString("utf8");

		// Check if we have a complete response (ends with newline)
		if (this.responseBuffer.includes("\n\r")) {
			const response = this.responseBuffer.trim();
			this.responseBuffer = "";

			// Resolve pending command if any
			if (this.pendingCommand) {
				const { resolve } = this.pendingCommand;
				this.pendingCommand = null;
				resolve(response);
			}
		}
	}

	/**
	 * Handle socket errors
	 */
	private handleError(error: Error): void {
		console.error("ClientQuery error:", error);
		this.emit("error", error);
	}

	/**
	 * Handle socket close
	 */
	private handleClose(): void {
		this.connected = false;
		this.authenticated = false;
		this.socket = null;
		this.emit("disconnected");

		// Auto-reconnect
		this.scheduleReconnect();
	}

	/**
	 * Schedule reconnection attempt
	 */
	private scheduleReconnect(): void {
		if (this.reconnectTimer) {
			return;
		}

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.connect(this.apiKey || undefined).catch((error) => {
				console.error("Reconnection failed:", error);
			});
		}, this.reconnectDelay);
	}

	/**
	 * Send command to TeamSpeak
	 */
	async sendCommand(command: string): Promise<string> {
		if (!this.connected || !this.socket) {
			throw new Error("Not connected to TeamSpeak");
		}

		return new Promise((resolve, reject) => {
			this.pendingCommand = { resolve, reject };

			this.socket!.write(command + "\n", (error) => {
				if (error) {
					this.pendingCommand = null;
					reject(error);
				}
			});

			// Timeout for command
			setTimeout(() => {
				if (this.pendingCommand) {
					this.pendingCommand = null;
					reject(new Error("Command timeout"));
				}
			}, 5000);
		});
	}

	/**
	 * Parse TeamSpeak response
	 * Format: key1=value1 key2=value2 ... error id=0 msg=ok
	 */
	parseResponse(response: string): { data: Record<string, string>; error: { id: number; msg: string } } {
		const lines = response.split("\n");
		const dataLine = lines[0] || "";
		const errorLine = lines.find((line) => line.startsWith("error ")) || "error id=1 msg=unknown";

		// Parse error
		const errorMatch = errorLine.match(/error id=(\d+) msg=(.+)/);
		const error = {
			id: errorMatch ? parseInt(errorMatch[1], 10) : 1,
			msg: errorMatch ? this.unescapeValue(errorMatch[2]) : "unknown"
		};

		// Parse data
		const data: Record<string, string> = {};
		const pairs = dataLine.split(" ");
		
		for (const pair of pairs) {
			const [key, ...valueParts] = pair.split("=");
			if (key && valueParts.length > 0) {
				data[key] = this.unescapeValue(valueParts.join("="));
			}
		}

		return { data, error };
	}

	/**
	 * Escape value for TeamSpeak
	 */
	private escapeValue(value: string): string {
		return value
			.replace(/\\/g, "\\\\")
			.replace(/\//g, "\\/")
			.replace(/\|/g, "\\p")
			.replace(/\n/g, "\\n")
			.replace(/\r/g, "\\r")
			.replace(/\t/g, "\\t")
			.replace(/\v/g, "\\v")
			.replace(/\f/g, "\\f")
			.replace(/ /g, "\\s");
	}

	/**
	 * Unescape value from TeamSpeak
	 */
	private unescapeValue(value: string): string {
		return value
			.replace(/\\s/g, " ")
			.replace(/\\p/g, "|")
			.replace(/\\n/g, "\n")
			.replace(/\\r/g, "\r")
			.replace(/\\t/g, "\t")
			.replace(/\\v/g, "\v")
			.replace(/\\f/g, "\f")
			.replace(/\\\//g, "/")
			.replace(/\\\\/g, "\\");
	}

	/**
	 * Get current client info (whoami)
	 */
	async whoami(): Promise<Record<string, string>> {
		const response = await this.sendCommand("whoami");
		const parsed = this.parseResponse(response);
		
		if (parsed.error.id !== 0) {
			throw new Error(`TeamSpeak error: ${parsed.error.msg}`);
		}
		
		return parsed.data;
	}

	/**
	 * Get channel list
	 */
	async getChannelList(): Promise<Array<Record<string, string>>> {
		const response = await this.sendCommand("channellist");
		const parsed = this.parseResponse(response);
		
		if (parsed.error.id !== 0) {
			throw new Error(`TeamSpeak error: ${parsed.error.msg}`);
		}
		
		// Parse multiple entries separated by |
		const entries: Array<Record<string, string>> = [];
		const dataStr = response.split("\n")[0] || "";
		const items = dataStr.split("|");
		
		for (const item of items) {
			const entry: Record<string, string> = {};
			const pairs = item.split(" ");
			
			for (const pair of pairs) {
				const [key, ...valueParts] = pair.split("=");
				if (key && valueParts.length > 0) {
					entry[key] = this.unescapeValue(valueParts.join("="));
				}
			}
			
			if (Object.keys(entry).length > 0) {
				entries.push(entry);
			}
		}
		
		return entries;
	}

	/**
	 * Get bookmark list
	 */
	async getBookmarkList(): Promise<Array<Record<string, string>>> {
		const response = await this.sendCommand("bookmarklist");
		const parsed = this.parseResponse(response);
		
		if (parsed.error.id !== 0) {
			throw new Error(`TeamSpeak error: ${parsed.error.msg}`);
		}
		
		// Parse multiple entries
		const entries: Array<Record<string, string>> = [];
		const dataStr = response.split("\n")[0] || "";
		const items = dataStr.split("|");
		
		for (const item of items) {
			const entry: Record<string, string> = {};
			const pairs = item.split(" ");
			
			for (const pair of pairs) {
				const [key, ...valueParts] = pair.split("=");
				if (key && valueParts.length > 0) {
					entry[key] = this.unescapeValue(valueParts.join("="));
				}
			}
			
			if (Object.keys(entry).length > 0) {
				entries.push(entry);
			}
		}
		
		return entries;
	}

	/**
	 * Toggle microphone mute
	 */
	async toggleMicMute(): Promise<boolean> {
		const info = await this.whoami();
		const currentMute = info.client_input_muted === "1";
		const newMute = !currentMute;
		
		await this.sendCommand(`clientupdate client_input_muted=${newMute ? "1" : "0"}`);
		
		return newMute;
	}

	/**
	 * Toggle speakers mute
	 */
	async toggleSpeakersMute(): Promise<boolean> {
		const info = await this.whoami();
		const currentMute = info.client_output_muted === "1";
		const newMute = !currentMute;
		
		await this.sendCommand(`clientupdate client_output_muted=${newMute ? "1" : "0"}`);
		
		return newMute;
	}

	/**
	 * Toggle AFK (Away) mode
	 */
	async toggleAFK(awayMessage?: string): Promise<boolean> {
		const info = await this.whoami();
		const currentAway = info.client_away === "1";
		const newAway = !currentAway;
		
		const message = awayMessage || "Away";
		const escapedMessage = this.escapeValue(message);
		
		await this.sendCommand(`clientupdate client_away=${newAway ? "1" : "0"} client_away_message=${escapedMessage}`);
		
		return newAway;
	}

	/**
	 * Connect to bookmark
	 */
	async connectToBookmark(bookmarkUuid: string, password?: string): Promise<void> {
		let command = `bookmarkconnect buid=${this.escapeValue(bookmarkUuid)}`;
		
		if (password) {
			command += ` password=${this.escapeValue(password)}`;
		}
		
		const response = await this.sendCommand(command);
		const parsed = this.parseResponse(response);
		
		if (parsed.error.id !== 0) {
			throw new Error(`Failed to connect to bookmark: ${parsed.error.msg}`);
		}
	}

	/**
	 * Switch to channel
	 */
	async switchChannel(channelId: string, password?: string): Promise<void> {
		let command = `clientmove cid=${channelId}`;
		
		if (password) {
			command += ` cpw=${this.escapeValue(password)}`;
		}
		
		const response = await this.sendCommand(command);
		const parsed = this.parseResponse(response);
		
		if (parsed.error.id !== 0) {
			throw new Error(`Failed to switch channel: ${parsed.error.msg}`);
		}
	}

	/**
	 * Get current mic mute state
	 */
	async getMicMuteState(): Promise<boolean> {
		const info = await this.whoami();
		return info.client_input_muted === "1";
	}

	/**
	 * Get current speakers mute state
	 */
	async getSpeakersMuteState(): Promise<boolean> {
		const info = await this.whoami();
		return info.client_output_muted === "1";
	}

	/**
	 * Get current AFK state
	 */
	async getAFKState(): Promise<boolean> {
		const info = await this.whoami();
		return info.client_away === "1";
	}

	/**
	 * Disconnect from TeamSpeak
	 */
	disconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		if (this.socket) {
			this.socket.destroy();
			this.socket = null;
		}

		this.connected = false;
		this.authenticated = false;
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.connected;
	}
}
