import { action, KeyUpEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import ClientQueryManager from "../core/ClientQueryManager";

/**
 * Toggle Speakers Mute action for TeamSpeak 3
 * Toggles client_output_muted and reflects the ON/OFF state
 */
@action({ UUID: "com.vinidev.ts3-macos-plugin-streamdeck.toggle-speakers-mute" })
export class ToggleSpeakersMute extends SingletonAction<SpeakersMuteSettings> {
	private pollingInterval: NodeJS.Timeout | null = null;
	private activeContexts = new Set<string>();

	/**
	 * Handle action appearing on Stream Deck
	 */
	override async onWillAppear(ev: WillAppearEvent<SpeakersMuteSettings>): Promise<void> {
		this.activeContexts.add(ev.action.id);
		await this.updateState(ev.action);
		this.startPolling();
	}

	/**
	 * Handle action disappearing from Stream Deck
	 */
	override async onWillDisappear(ev: WillDisappearEvent<SpeakersMuteSettings>): Promise<void> {
		this.activeContexts.delete(ev.action.id);
		
		if (this.activeContexts.size === 0) {
			this.stopPolling();
		}
	}

	/**
	 * Handle key press
	 */
	override async onKeyUp(ev: KeyUpEvent<SpeakersMuteSettings>): Promise<void> {
		try {
			const clientQuery = ClientQueryManager.getInstance();
			
			if (!clientQuery.isConnected()) {
				await ev.action.showAlert();
				await ev.action.setTitle("Not\nConnected");
				return;
			}

			const isMuted = await clientQuery.toggleSpeakersMute();
			await this.updateStateValue(ev.action, isMuted);
			await ev.action.showOk();
		} catch (error) {
			console.error("Failed to toggle speakers mute:", error);
			await ev.action.showAlert();
		}
	}

	/**
	 * Update the visual state of the action
	 */
	private async updateState(action: any): Promise<void> {
		try {
			const clientQuery = ClientQueryManager.getInstance();
			
			if (!clientQuery.isConnected()) {
				await action.setTitle("Not\nConnected");
				await action.setState(0);
				return;
			}

			const isMuted = await clientQuery.getSpeakersMuteState();
			await this.updateStateValue(action, isMuted);
		} catch (error) {
			console.error("Failed to update speakers mute state:", error);
			await action.setTitle("Error");
		}
	}

	/**
	 * Update state value
	 */
	private async updateStateValue(action: any, isMuted: boolean): Promise<void> {
		await action.setState(isMuted ? 1 : 0);
		await action.setTitle(isMuted ? "Speakers\nMuted" : "Speakers\nActive");
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
 * Settings for {@link ToggleSpeakersMute}
 */
type SpeakersMuteSettings = {
	// No settings needed for this action
};
