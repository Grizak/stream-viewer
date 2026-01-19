# Stream Viewer

A beautiful web-based terminal viewer for streaming command output in real-time. Perfect for monitoring long-running processes, builds, deployments, or any command-line tool.

![Stream Viewer](https://img.shields.io/npm/v/stream-viewer?style=flat-square)
![License](https://img.shields.io/npm/l/stream-viewer?style=flat-square)

## Features

- 🖥️ **Beautiful terminal UI** - VSCode-inspired design with xterm.js
- 🔄 **Real-time streaming** - See output as it happens via WebSocket
- 📜 **History buffer** - Maintains last 2000 output chunks
- 💾 **Download logs** - Export full session logs as text files
- 🌐 **Cloudflare tunnel support** - Optional remote access
- 🎨 **Syntax highlighting** - ANSI color support
- 📱 **Responsive** - Works on desktop and mobile
- 🔒 **Process control** - Clean shutdown via web UI

## Installation

### Global install (recommended)

```bash
pnpm install -g stream-viewer
```

### Local install

```bash
pnpm install stream-viewer
```

## Usage

### Basic usage

Stream any command's output to a web interface:

```bash
stream-viewer pnpm run build
```

Then open http://localhost:3000 in your browser.

### Advanced usage

```bash
# Custom port
stream-viewer --port 8080 pnpm test

# Different working directory
stream-viewer --cwd /path/to/project pnpm start

# With Cloudflare tunnel (requires cloudflared)
stream-viewer --tunnel-name my-tunnel pnpm run dev

# Viewer-only mode (no command)
stream-viewer
```

## CLI Options

| Option                 | Description                   | Default         |
| ---------------------- | ----------------------------- | --------------- |
| `-p, --port <number>`  | Web server port               | `3000`          |
| `--cwd <path>`         | Working directory for command | `process.cwd()` |
| `--no-tunnel`          | Disable Cloudflare tunnel     | tunnel enabled  |
| `--tunnel-name <name>` | Cloudflare tunnel name        | `stream-viewer` |

## Use Cases

### Monitor builds

```bash
stream-viewer pnpm run build
```

### Watch tests

```bash
stream-viewer pnpm test -- --watch
```

### Development server

```bash
stream-viewer pnpm run dev
```

### Long-running deployments

```bash
stream-viewer --tunnel-name my-deploy ./deploy.sh
```

### System monitoring

```bash
stream-viewer tail -f /var/log/system.log
```

## Cloudflare Tunnel Setup

To use the tunnel feature, you need to:

1. Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Create and configure a tunnel
3. Pass the tunnel name via `--tunnel-name`

## UI Features

- **Clear** - Clear the terminal view (doesn't affect process)
- **Download** - Download full session log as `.txt` file
- **Shutdown** - Terminate the process and exit
- **Autoscroll** - Toggle automatic scrolling (enabled by default)

## Requirements

- Node.js 16+ (ESM support)
- Modern browser with WebSocket support

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/stream-viewer.git

# Install dependencies
pnpm install

# Run locally
node stream_viewer.js <command>
```

## How It Works

Stream Viewer spawns your command as a child process, captures stdout and stderr, and streams the output to a web interface using Socket.IO. The terminal uses xterm.js for rendering, providing a native terminal experience in the browser.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please file an issue on GitHub.
