# Nostr Event Locator

A simple web application to check multiple Nostr relays to find if a specific event ID is present.

## Features

- Check multiple Nostr relays for a specific event
- Input event IDs in both note1 and hex formats
- Customizable relay list
- Real-time progress updates
- View event details when found
- Runs locally with npm's http-server

## Usage

1. Enter a Nostr event ID (note1 or hex format)
2. Customize the relay list if needed (default list provided)
3. Click "Check Relays" to search for the event
4. View results showing which relays have the event

## Running Locally

To run this application locally:

```bash
# Install http-server if you don't have it
npm install -g http-server

# Navigate to the project directory
cd nostr-event-is-where

# Start the server
http-server

# Open in your browser (usually at http://127.0.0.1:8080)
```

## Libraries Used

- [Nostr Tools](https://github.com/nbd-wtf/nostr-tools) - For Nostr protocol communication
- [buffer](https://github.com/feross/buffer) - For buffer conversion
- [bech32](https://github.com/sipa/bech32) - For bech32 encoding/decoding

## Acknowledgements
Built based on the https://github.com/djinoz/nostr-kind-explorer, you can refer to its acknowledgements.   
Code by Cline and Claude 3.7

## License
   
This utility is released under the MIT License. See [LICENSE file for details.](https://opensource.org/license/mit)
