# DeepWiki++

DeepWiki++ is a browser extension that enhances your experience on DeepWiki by allowing you to collect headings and switch URLs seamlessly.

## Quick Start

This guide helps you get DeepWiki++ up and running in just a few minutes.

## 1 · Clone the repository

```bash
git clone https://github.com/WakishiDeer/deepwiki-pp
cd deepwiki-pp
```

## 2 · Install dependencies

```bash
pnpm install
```

## 3 · Run tests (optional)

```bash
pnpm test
```

> All unit and integration tests should pass (see `test/` for details).

## 4 · Build the extension

```bash
pnpm build
```

The production build is output to `.output/chrome-mv3/`.

## 5 · Load into Chrome or Edge (manual installation)

1. Open `chrome://extensions/` or `edge://extensions/` in your browser.
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `.output/chrome-mv3/` directory

## 6 · Use the extension

- Visit any supported DeepWiki or GitHub page.
- Click the **DeepWiki++** icon to open the side panel.
- Collect headings or switch URLs as needed.

## 7. License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 8. Disclaimer

A substantial portion of this extension was created with AI assistance, so code quality may vary.  
Please review and test the software rigorously before using it in production.  
The authors assume no responsibility for any issues or damages arising from its use as the MIT License does not cover liability.
Proceed at your own risk.
