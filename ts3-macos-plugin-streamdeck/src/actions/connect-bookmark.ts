import { action, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { ClientQueryService } from "../core/ClientQueryService";

/**
 * Connect to Bookmark action for TeamSpeak 3
 * Connects to an existing bookmark already defined in the TeamSpeak 3 client
 */
@action({ UUID: "com.vinidev.ts3-macos-plugin-streamdeck.connect-bookmark" })
export class ConnectBookmark extends SingletonAction<BookmarkSettings> {
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
	override async onWillAppear(ev: WillAppearEvent<BookmarkSettings>): Promise<void> {
		const { settings } = ev.payload;
		const bookmarkName = settings.bookmarkName || "Not Set";
		await ev.action.setTitle(bookmarkName);
	}

	/**
	 * Handle key press
	 */
	override async onKeyUp(ev: KeyUpEvent<BookmarkSettings>): Promise<void> {
		try {
			if (!this.clientQuery.isConnected()) {
				await ev.action.showAlert();
				await ev.action.setTitle("Not\nConnected");
				return;
			}

			const { settings } = ev.payload;
			
			if (!settings.bookmarkUuid) {
				await ev.action.showAlert();
				await ev.action.setTitle("No\nBookmark");
				return;
			}

			await this.clientQuery.connectToBookmark(settings.bookmarkUuid, settings.password);
			await ev.action.showOk();
		} catch (error) {
			console.error("Failed to connect to bookmark:", error);
			await ev.action.showAlert();
		}
	}
}

/**
 * Settings for {@link ConnectBookmark}
 */
type BookmarkSettings = {
	bookmarkUuid?: string;
	bookmarkName?: string;
	password?: string;
};
