import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { IncrementCounter } from "./actions/increment-counter";
import { ToggleMicMute } from "./actions/toggle-mic-mute";
import { ToggleSpeakersMute } from "./actions/toggle-speakers-mute";
import { ToggleAFK } from "./actions/toggle-afk";
import { ConnectBookmark } from "./actions/connect-bookmark";
import { SwitchChannel } from "./actions/switch-channel";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.TRACE);

// Register the increment action.
streamDeck.actions.registerAction(new IncrementCounter());

// Register TeamSpeak 3 actions
streamDeck.actions.registerAction(new ToggleMicMute());
streamDeck.actions.registerAction(new ToggleSpeakersMute());
streamDeck.actions.registerAction(new ToggleAFK());
streamDeck.actions.registerAction(new ConnectBookmark());
streamDeck.actions.registerAction(new SwitchChannel());

// Finally, connect to the Stream Deck.
streamDeck.connect();
