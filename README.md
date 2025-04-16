# Nostr Event Locator

I was trying to understand the nostr concept of "no global state" and particularly because I was lazy about selecting relays. So this utility lets a user check where an event/note is located.

Its a simple web application you can run locally to check multiple Nostr relays to find if a specific event ID is present. If there is a relay that you want to publish to, then you get a button to submit the event again to that relay - you can do this multiple times.

## Features

- Check multiple Nostr relays for a specific event
- Input event IDs in both note1 and hex formats
- Customizable relay list
- Real-time progress updates
- View event details when found
- Runs locally with npm's http-server
- Publish the event to a specific relay if it isn't already "Found"

## Usage

1. Enter a Nostr event ID (note1 or hex format)
2. Customize the relay list if needed (default list provided)
3. Click "Check Relays" to search for the event
4. View results showing which relays have the event
5. Publish to a relay with one-click

## Running Locally

To run this application locally:

```bash

git clone https://github.com/djinoz/nostr-event-is-where.git

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
