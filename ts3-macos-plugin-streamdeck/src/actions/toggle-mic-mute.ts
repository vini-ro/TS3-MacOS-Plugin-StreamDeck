import { action, KeyUpEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { ClientQueryService } from "../core/ClientQueryService";

/**
 * Toggle Microphone Mute action for TeamSpeak 3
 * Toggles client_input_muted and reflects the ON/OFF state
 */
@action({ UUID: "com.vinidev.ts3-macos-plugin-streamdeck.toggle-mic-mute" })
export class ToggleMicMute extends SingletonAction<MicMuteSettings> {
	private clientQuery: ClientQueryService;
	private pollingInterval: NodeJS.Timeout | null = null;
	private activeContexts = new Set<string>();

	constructor() {
		super();
		this.clientQuery = new ClientQueryService();
		this.initializeClientQuery();
	}

	/**
	 * Initialize ClientQuery connection
	 */
	private async initializeClientQuery(): Promise<void> {
		try {
			await this.clientQuery.connect();
			console.log("Connected to TeamSpeak ClientQuery");
		} catch (error) {
			console.error("Failed to connect to TeamSpeak ClientQuery:", error);
		}
	}

	/**
	 * Handle action appearing on Stream Deck
	 */
	override async onWillAppear(ev: WillAppearEvent<MicMuteSettings>): Promise<void> {
		this.activeContexts.add(ev.action.id);
		await this.updateState(ev.action);
		this.startPolling();
	}

	/**
	 * Handle action disappearing from Stream Deck
	 */
	override async onWillDisappear(ev: WillDisappearEvent<MicMuteSettings>): Promise<void> {
		this.activeContexts.delete(ev.action.id);
		
		if (this.activeContexts.size === 0) {
			this.stopPolling();
		}
	}

	/**
	 * Handle key press
	 */
	override async onKeyUp(ev: KeyUpEvent<MicMuteSettings>): Promise<void> {
		try {
			if (!this.clientQuery.isConnected()) {
				await ev.action.showAlert();
				await ev.action.setTitle("Not\nConnected");
				return;
			}

			const isMuted = await this.clientQuery.toggleMicMute();
			await this.updateStateValue(ev.action, isMuted);
			await ev.action.showOk();
		} catch (error) {
			console.error("Failed to toggle mic mute:", error);
			await ev.action.showAlert();
		}
	}

	/**
	 * Update the visual state of the action
	 */
	private async updateState(action: any): Promise<void> {
		try {
			if (!this.clientQuery.isConnected()) {
				await action.setTitle("Not\nConnected");
				await action.setState(0);
				return;
			}

			const isMuted = await this.clientQuery.getMicMuteState();
			await this.updateStateValue(action, isMuted);
		} catch (error) {
			console.error("Failed to update mic mute state:", error);
			await action.setTitle("Error");
		}
	}

	/**
	 * Update state value
	 */
	private async updateStateValue(action: any, isMuted: boolean): Promise<void> {
		await action.setState(isMuted ? 1 : 0);
		await action.setTitle(isMuted ? "Mic\nMuted" : "Mic\nActive");
	}

	/**
	 * Start polling for state updates
	 */
	private startPolling(): void {
		if (this.pollingInterval) {
			return;
		}

		this.pollingInterval = setInterval(async () => {
			for (const contextId of this.activeContexts) {
				// Update all active contexts
				// Note: In a real implementation, we'd need to get the action instance by context ID
				// For now, we'll rely on the onWillAppear to set the initial state
			}
		}, 1000);
	}

	/**
	 * Stop polling
	 */
	private stopPolling(): void {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = null;
		}
	}
}

/**
 * Settings for {@link ToggleMicMute}
 */
type MicMuteSettings = {
	// No settings needed for this action
};
