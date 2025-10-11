import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { ToggleMicMute } from "./actions/toggle-mic-mute";
import { ToggleSpeakersMute } from "./actions/toggle-speakers-mute";
import { ToggleAFK } from "./actions/toggle-afk";
import { ConnectBookmark } from "./actions/connect-bookmark";
import { SwitchChannel } from "./actions/switch-channel";
import ClientQueryManager from "./core/ClientQueryManager";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.TRACE);

// Register TeamSpeak 3 actions
streamDeck.actions.registerAction(new ToggleMicMute());
streamDeck.actions.registerAction(new ToggleSpeakersMute());
streamDeck.actions.registerAction(new ToggleAFK());
streamDeck.actions.registerAction(new ConnectBookmark());
streamDeck.actions.registerAction(new SwitchChannel());

// Listen for global settings changes to update API key
streamDeck.settings.onDidReceiveGlobalSettings((ev) => {
	const { apiKey } = ev.settings as { apiKey?: string };
	
	if (apiKey) {
		// Reconnect with the new API key
		ClientQueryManager.reset();
		const clientQuery = ClientQueryManager.getInstance();
		clientQuery.connect(apiKey).catch((error) => {
			console.error("Failed to connect with API key:", error);
		});
	}
});

// Initialize connection on startup
streamDeck.settings.getGlobalSettings().then((settings) => {
	const { apiKey } = settings as { apiKey?: string };
	const clientQuery = ClientQueryManager.getInstance();
	
	// Connect with API key if available
	clientQuery.connect(apiKey).catch((error) => {
		console.error("Failed to connect to TeamSpeak ClientQuery:", error);
	});
});

// Finally, connect to the Stream Deck.
streamDeck.connect();
