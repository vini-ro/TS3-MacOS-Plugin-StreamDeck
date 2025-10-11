import { action, KeyUpEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { ClientQueryService } from "../core/ClientQueryService";

/**
 * Toggle AFK (Away) mode action for TeamSpeak 3
 * Sets or clears client_away with custom message
 */
@action({ UUID: "com.vinidev.ts3-macos-plugin-streamdeck.toggle-afk" })
export class ToggleAFK extends SingletonAction<AFKSettings> {
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
	override async onWillAppear(ev: WillAppearEvent<AFKSettings>): Promise<void> {
		this.activeContexts.add(ev.action.id);
		await this.updateState(ev.action);
		this.startPolling();
	}

	/**
	 * Handle action disappearing from Stream Deck
	 */
	override async onWillDisappear(ev: WillDisappearEvent<AFKSettings>): Promise<void> {
		this.activeContexts.delete(ev.action.id);
		
		if (this.activeContexts.size === 0) {
			this.stopPolling();
		}
	}

	/**
	 * Handle key press
	 */
	override async onKeyUp(ev: KeyUpEvent<AFKSettings>): Promise<void> {
		try {
			if (!this.clientQuery.isConnected()) {
				await ev.action.showAlert();
				await ev.action.setTitle("Not\nConnected");
				return;
			}

			const { settings } = ev.payload;
			const awayMessage = settings.awayMessage || "Away";
			
			const isAway = await this.clientQuery.toggleAFK(awayMessage);
			await this.updateStateValue(ev.action, isAway);
			await ev.action.showOk();
		} catch (error) {
			console.error("Failed to toggle AFK:", error);
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

			const isAway = await this.clientQuery.getAFKState();
			await this.updateStateValue(action, isAway);
		} catch (error) {
			console.error("Failed to update AFK state:", error);
			await action.setTitle("Error");
		}
	}

	/**
	 * Update state value
	 */
	private async updateStateValue(action: any, isAway: boolean): Promise<void> {
		await action.setState(isAway ? 1 : 0);
		await action.setTitle(isAway ? "AFK" : "Active");
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
 * Settings for {@link ToggleAFK}
 */
type AFKSettings = {
	awayMessage?: string;
};
