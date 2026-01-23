# Markdown Editor

A polished, minimalist Markdown editor that focuses on writing flow: real-time preview, PDF export, and a clean, classic interface. Crafted with a Claude-inspired tone—warm, precise, and purposeful.

## Live Demo

- GitHub Pages: https://formyvibecoding.github.io/markdowneditor/

## Features

- **Distraction-free editor** with a centered, single-pane layout
- **Preview in a new tab** with GitHub-flavored Markdown styling
- **Copy preview content** as rich text (style + content) with one click
- **PDF export** in both paged and single-page modes
- **Markdown download** with timestamped filenames
- **Security-first rendering** via DOMPurify sanitization
- **Graceful CDN fallbacks** for external libraries

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. Write Markdown in the editor.
2. Click **预览** to open the rendered output in a new tab.
3. In the preview tab:
   - Click **复制预览** to copy the rendered content with styles.
   - Export with **下载 PDF（分页）** or **下载 PDF（单页）**.
4. Click **下载** to export the raw Markdown file.

## Tech Stack

- **Vite** — build tooling and dev server
- **TypeScript** — type safety
- **Marked** — Markdown parsing
- **DOMPurify** — HTML sanitization
- **Vitest** — unit tests
- **Playwright** — end-to-end testing
- **ESLint + Prettier** — linting and formatting

## Project Structure

```
markdowneditor/
├── src/
│   ├── config.ts
│   ├── main.ts
│   ├── pdf.ts
│   ├── sanitize.ts
│   ├── styles.css
│   ├── templates/
│   │   └── preview.ts
│   └── utils.ts
├── tests/
│   ├── unit/
│   └── e2e/
├── index.html
├── package.json
└── CHANGELOG.md
```

## Scripts

```bash
npm run dev          # start dev server
npm run build        # build for production
npm run preview      # preview production build
npm run lint         # lint source files
npm run format       # format code
npm run test         # unit tests
npm run test:e2e     # end-to-end tests
npm run typecheck    # TypeScript checks
```

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Commit your changes: `git commit -m "feat: add your feature"`.
4. Push to your fork and open a Pull Request.

## License

No license file is specified yet. If you plan to open-source this project formally, add a `LICENSE` file and update this section accordingly.
