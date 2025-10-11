import { action, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { ClientQueryService } from "../core/ClientQueryService";

/**
 * Switch Channel action for TeamSpeak 3
 * Moves to a configured channel
 */
@action({ UUID: "com.vinidev.ts3-macos-plugin-streamdeck.switch-channel" })
export class SwitchChannel extends SingletonAction<ChannelSettings> {
	private clientQuery: ClientQueryService;

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
			if (!this.clientQuery.isConnected()) {
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

			await this.clientQuery.switchChannel(settings.channelId, settings.password);
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
