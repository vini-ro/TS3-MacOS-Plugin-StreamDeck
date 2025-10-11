# TS3-MacOS-Plugin-StreamDeck

Native Stream Deck plugin for macOS that integrates with TeamSpeak 3 via ClientQuery. Control mic and speakers mute, toggle AFK mode, connect to bookmarks, and switch channels directly from your Stream Deck — no BarRaider, fully compatible and lightweight.

## Features

This plugin provides five TeamSpeak 3 actions for your Stream Deck:

1. **Toggle Microphone** - Mute/unmute your microphone with visual feedback
2. **Toggle Speakers** - Mute/unmute your speakers with visual feedback
3. **Toggle AFK** - Set or clear Away mode with a custom message
4. **Connect Bookmark** - Quickly connect to saved TeamSpeak 3 bookmarks
5. **Switch Channel** - Move to a specific channel with one button press

## Requirements

- macOS 11 or later
- Stream Deck software 6.5 or later
- TeamSpeak 3 client with **ClientQuery enabled**
- Node.js 20 (bundled with Stream Deck)

## TeamSpeak 3 ClientQuery Setup

Before using this plugin, you must enable ClientQuery in TeamSpeak 3:

1. Open TeamSpeak 3
2. Go to **Tools** → **Options** → **Addons**
3. Enable **ClientQuery** plugin
4. Set the port to **25639** (default)
5. Click **OK** and restart TeamSpeak 3

The ClientQuery interface allows the plugin to communicate with TeamSpeak via a local telnet connection at `127.0.0.1:25639`.

### API Key Configuration (Optional but Recommended)

For enhanced security, you can configure an API key for authentication:

1. In TeamSpeak 3, go to **Tools** → **Options** → **Addons** → **ClientQuery**
2. Generate or note your API key
3. In Stream Deck, open the plugin settings (click the plugin icon in the Stream Deck software)
4. Enter your API key in the "API Key" field
5. The plugin will automatically reconnect using the API key

**Note:** The API key is optional. The plugin will work without it, but using an API key provides better security for your TeamSpeak connection.

## Installation

### From Release

1. Download the latest `.streamDeckPlugin` file from the [Releases](https://github.com/vini-ro/TS3-MacOS-Plugin-StreamDeck/releases) page
2. Double-click the file to install it in Stream Deck

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/vini-ro/TS3-MacOS-Plugin-StreamDeck.git
   cd TS3-MacOS-Plugin-StreamDeck/ts3-macos-plugin-streamdeck
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin using the Stream Deck CLI:
   ```bash
   npm run build
   ```
   
   **Note:** This plugin is built using the official [Elgato Stream Deck CLI](https://docs.elgato.com/sdk/plugins/getting-started). The CLI handles the build process through Rollup and TypeScript compilation.

4. Link the plugin to Stream Deck:
   ```bash
   ln -s "$(pwd)/com.vinidev.ts3-macos-plugin-streamdeck.sdPlugin" \
     "$HOME/Library/Application Support/com.elgato.StreamDeck/Plugins/com.vinidev.ts3-macos-plugin-streamdeck.sdPlugin"
   ```

5. Restart Stream Deck software

## Usage

### Toggle Microphone / Toggle Speakers

1. Drag the action to your Stream Deck
2. Press the button to toggle mute state
3. The button shows the current state automatically

No configuration needed!

### Toggle AFK

1. Drag the action to your Stream Deck
2. (Optional) Configure your away message in the Property Inspector
3. Press the button to toggle AFK mode
4. Default message is "Away" if not configured

### Connect Bookmark

1. Drag the action to your Stream Deck
2. Open the Property Inspector
3. Enter the **Bookmark UUID** (found in TeamSpeak settings)
4. Enter a display name
5. (Optional) Enter server password
6. Press the button to connect

### Switch Channel

1. Drag the action to your Stream Deck
2. Open the Property Inspector
3. Enter the **Channel ID** (you can find this in TeamSpeak client)
4. Enter a display name
5. (Optional) Enter channel password
6. Press the button to switch channels

## Development

This plugin is built using the official [Elgato Stream Deck CLI](https://docs.elgato.com/sdk/plugins/getting-started) and SDK.

### Project Structure

```
ts3-macos-plugin-streamdeck/
├── src/
│   ├── core/
│   │   ├── ClientQueryService.ts    # TeamSpeak ClientQuery communication
│   │   └── ClientQueryManager.ts    # Singleton manager for ClientQuery
│   ├── actions/
│   │   ├── toggle-mic-mute.ts       # Microphone mute action
│   │   ├── toggle-speakers-mute.ts  # Speakers mute action
│   │   ├── toggle-afk.ts            # AFK toggle action
│   │   ├── connect-bookmark.ts      # Bookmark connection action
│   │   └── switch-channel.ts        # Channel switching action
│   └── plugin.ts                     # Main plugin entry point
├── com.vinidev.ts3-macos-plugin-streamdeck.sdPlugin/
│   ├── manifest.json                 # Plugin manifest
│   ├── ui/                           # Property Inspector HTML files
│   └── imgs/                         # Action icons
└── package.json
```

### Building

Build the plugin using npm (which uses the Stream Deck CLI build tools):

```bash
npm run build
```

This command runs Rollup to compile TypeScript and bundle the plugin.

### Development Mode (with auto-reload)

Enable watch mode for automatic rebuilding and plugin restart:

```bash
npm run watch
```

This will automatically rebuild the plugin using the Stream Deck CLI and restart it when files change.

## Technical Details

- **Communication**: TCP socket to TeamSpeak ClientQuery at `127.0.0.1:25639`
- **Protocol**: TeamSpeak 3 ClientQuery protocol with escaped key=value pairs
- **State Polling**: ~1 second interval for mute/AFK state updates
- **Auto-reconnect**: Automatically reconnects if TeamSpeak restarts
- **Stream Deck API**: Official `@elgato/streamdeck` SDK (no third-party dependencies)

## Troubleshooting

### Plugin shows "Not Connected"

1. Ensure TeamSpeak 3 is running
2. Verify ClientQuery is enabled in TeamSpeak settings
3. Check that port 25639 is not blocked by firewall
4. Restart both TeamSpeak and Stream Deck

### Actions don't work

1. Verify you're connected to a TeamSpeak server
2. Check the Stream Deck logs for error messages
3. Ensure you have the necessary permissions on the server

### Can't find Bookmark UUID or Channel ID

1. For bookmarks: Check TeamSpeak settings → Bookmarks
2. For channels: Right-click channel → Copy Channel ID (if available)
3. Alternatively, use TeamSpeak ClientQuery directly to query these values

## License

MIT License - see [LICENSE](../LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

- Built with [Elgato Stream Deck SDK](https://docs.elgato.com/sdk)
- TeamSpeak 3 ClientQuery documentation
- Icon placeholders from original Stream Deck CLI scaffold

## Support

For issues, questions, or feature requests, please open an issue on [GitHub](https://github.com/vini-ro/TS3-MacOS-Plugin-StreamDeck/issues).
