# AutoClick

AutoClick is a Chrome extension that lets you select a button on a website and automatically click it whenever that button appears.

## Features

- Select a button directly on the page.
- Save a separate button rule for each website.
- Automatically detect dynamically added or replaced buttons.
- Click a matching button once per appearance.
- Enable or disable AutoClick globally.
- Remove a saved rule whenever you want.
- Skip disabled buttons and actions that appear to involve payments, purchases, or deletion.

AutoClick only acts when the saved selector matches exactly one visible, enabled element.

## Installation

AutoClick is currently distributed as an unpacked Chrome extension.

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `autoclick-chrome` directory in this repository.

## Usage

1. Open the website where you want to automate a button.
2. Click the AutoClick extension icon.
3. Select **Choose button on this page** and grant the requested site permission.
4. Hover over the target button. When it is highlighted, click it to save the rule.
5. AutoClick will click that button when it appears on that website.

Use the extension popup to disable AutoClick or remove the saved button rule.

## Permissions

- **Storage**: saves your enabled state and selected button rules locally.
- **Scripting**: injects the button picker and monitoring script.
- **Optional site access**: lets you choose which websites AutoClick can interact with.

## Limitations

- AutoClick works on regular HTTP and HTTPS pages, not browser-internal pages such as `chrome://` URLs.
- A rule is stored per website origin and uses a CSS selector. Websites that frequently change their page structure may require selecting the button again.
- Only one visible matching element is clicked at a time. If multiple matching elements are visible, AutoClick does nothing.
- Some potentially high-impact actions are skipped based on their visible text or accessible label. This is a basic safeguard, not a guarantee that every consequential action will be detected.

## Development

The extension source is in `autoclick-chrome/`. Load that directory as an unpacked extension to test local changes.

## License

No license has been added yet. All rights reserved unless the repository owner specifies otherwise.
