import { action, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import ClientQueryManager from "../core/ClientQueryManager";

/**
 * Switch Channel action for TeamSpeak 3
 * Moves to a configured channel
 */
@action({ UUID: "com.vinidev.ts3-macos-plugin-streamdeck.switch-channel" })
export class SwitchChannel extends SingletonAction<ChannelSettings> {
	/**
	 * Handle action appearing on Stream Deck
	 */
	override async onWillAppear(ev: WillAppearEvent<ChannelSettings>): Promise<void> {
		const { settings } = ev.payload;
		const channelName = settings.channelName || "Not Set";
		await ev.action.setTitle(channelName);
	}

	/**
	 * Handle key press
	 */
	override async onKeyUp(ev: KeyUpEvent<ChannelSettings>): Promise<void> {
		try {
			const clientQuery = ClientQueryManager.getInstance();
			
			if (!clientQuery.isConnected()) {
				await ev.action.showAlert();
				await ev.action.setTitle("Not\nConnected");
				return;
			}

			const { settings } = ev.payload;
			
			if (!settings.channelId) {
				await ev.action.showAlert();
				await ev.action.setTitle("No\nChannel");
				return;
			}

			await clientQuery.switchChannel(settings.channelId, settings.password);
			await ev.action.showOk();
		} catch (error) {
			console.error("Failed to switch channel:", error);
			await ev.action.showAlert();
		}
	}
}

/**
 * Settings for {@link SwitchChannel}
 */
type ChannelSettings = {
	channelId?: string;
	channelName?: string;
	password?: string;
};
