#!/usr/bin/env node

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { Command } from "commander";

/* -----------------------------
 * Paths
 * ---------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -----------------------------
 * CLI (commander)
 * ---------------------------- */
const program = new Command();

program
  .name("stream_viewer")
  .description("Web-based viewer for streaming process output")
  .option("-p, --port <number>", "Web server port", "3000")
  .option("--cwd <path>", "Working directory for command", process.cwd())
  .option("--no-tunnel", "Disable Cloudflare tunnel")
  .allowUnknownOption(true)
  .passThroughOptions();

program.parse(process.argv);

const opts = program.opts();
const command = program.args[0];
const commandArgs = program.args.slice(1);

const PORT = Number(opts.port);
const CWD = path.resolve(opts.cwd);
const USE_CLOUDFLARE = opts.tunnel;

/* -----------------------------
 * Validation
 * ---------------------------- */
if (!fs.existsSync(CWD)) {
  console.error(`[Stream Viewer] Invalid cwd: ${CWD}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(__dirname, "stream_viewer.html"))) {
  console.error("[Stream Viewer] Missing stream_viewer.html");
  process.exit(1);
}

/* -----------------------------
 * App + Server
 * ---------------------------- */
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

/* -----------------------------
 * History buffer
 * ---------------------------- */
const outputHistory = [];
const MAX_HISTORY = 2000;

/* -----------------------------
 * State
 * ---------------------------- */
let childProcess = null;
let processExited = false;

/* -----------------------------
 * HTML
 * ---------------------------- */
const html = readFileSync(path.join(__dirname, "stream_viewer.html"), "utf8");

app.get("/", (req, res) => res.send(html));

/* -----------------------------
 * WebSocket
 * ---------------------------- */
io.on("connection", (socket) => {
  socket.emit("history", outputHistory);
  socket.emit("state", {
    running: !!childProcess && !processExited,
    exited: processExited,
  });

  socket.on("shutdown", shutdown);
});

/* -----------------------------
 * Spawn command (optional)
 * ---------------------------- */
function startCommand() {
  if (!command) return;

  console.log(
    `[Stream Viewer] Running command: ${command} ${commandArgs.join(" ")}`,
  );
  console.log(`[Stream Viewer] Working directory: ${CWD}`);

  childProcess = spawn(command, commandArgs, {
    cwd: CWD,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  const handleOutput = (chunk) => {
    const text = chunk.toString();
    outputHistory.push(text);
    if (outputHistory.length > MAX_HISTORY) outputHistory.shift();
    io.emit("data", text);
  };

  childProcess.stdout.on("data", handleOutput);
  childProcess.stderr.on("data", handleOutput);

  childProcess.on("close", (code, signal) => {
    processExited = true;

    const msg = `\n\n[Process exited] code=${code} signal=${signal}\n`;

    handleOutput(msg);

    console.log("[Stream Viewer] Child process exited");
  });

  childProcess.on("error", (err) => {
    console.error("[Stream Viewer] Failed to start command:", err);
  });
}

/* -----------------------------
 * Cloudflared (unchanged)
 * ---------------------------- */
let cloudflared = null;

function startCloudflaredTunnel() {
  cloudflared = spawn(
    "cloudflared",
    ["tunnel", "run", "isaksweb-stream-viewer"],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  cloudflared.stdout.on("data", (d) => {
    if (d.toString().includes("Registered tunnel connection")) {
      console.log("[Stream Viewer] 🌐 Tunnel online");
    }
  });
}

/* -----------------------------
 * Shutdown
 * ---------------------------- */
function shutdown() {
  console.log("\n[Stream Viewer] Shutting down...");

  if (childProcess && !processExited) {
    childProcess.kill("SIGTERM");
  }

  if (cloudflared) {
    cloudflared.kill("SIGTERM");
  }

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/* -----------------------------
 * Start server
 * ---------------------------- */
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Stream Viewer] UI: http://localhost:${PORT}`);
  if (USE_CLOUDFLARE) startCloudflaredTunnel();
  startCommand();
});
