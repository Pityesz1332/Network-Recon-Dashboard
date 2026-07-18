# Network Recon Dashboard

A cross-platform desktop application for gathering reconnaissance information about an IPv4 address or hostname from a single interface. Built with Electron, React, and TypeScript around a plugin-based recon engine, so new scan capabilities can be added without touching existing code.

> **Status: early prototype.** The architecture (IPC contract, plugin engine, module abstraction) is in place and functional, with three recon modules implemented end-to-end. See [Roadmap](#roadmap) for what's not built yet.

---

## Features

**Implemented**

- Enter an IPv4 address or hostname and run a scan against it
- Three recon modules running in parallel, each as an independent plugin:
  - **Ping** — reachability, packet loss, round-trip time
  - **DNS Lookup** — A/AAAA/CNAME resolution, reverse PTR lookups
  - **Port Scan** — TCP connect scan over a common port list, behind a swappable provider abstraction
- Results stream in per-module as each one finishes — fast modules display immediately, no waiting on the slowest one
- Cancel a scan in progress (kills the ping process, destroys open sockets, aborts in-flight lookups)
- Client- and server-side input validation (rejects malformed IPs/hostnames before any module runs)
- Dark-themed dashboard UI (shadcn/ui + Tailwind CSS)

**Not yet implemented** — see [Roadmap](#roadmap).

---

## Architecture

```
React UI  →  Electron IPC  →  Recon Engine  →  Modules  →  Results  →  React Dashboard
```

- **Renderer never touches Node APIs directly.** All access to the network stack happens in the Electron main process; the renderer only calls a narrow, typed bridge exposed via `contextBridge`.
- **Plugin-based recon modules.** Every scan capability implements a common `ReconModule` interface (`id`, `name`, `execute(ctx)`), registered into a `ModuleRegistry` and orchestrated by a `ReconEngine` that runs all modules concurrently and streams each result back independently.
- **Provider abstraction for port scanning.** The port scan module delegates to a `PortScanProvider` interface; the current implementation (`NodeSocketProvider`) does a TCP connect scan with `node:net`, but the module and UI have no knowledge of that — a future `NmapProvider` could be swapped in without changing either.
- **Event-push IPC, not polling.** Starting a scan returns an immediate acknowledgement; the main process then pushes a `recon:module:update` event per module as it completes and a `recon:scan:complete` event once everything settles.
- **Input validated on both sides.** A shared Zod schema validates the target in the renderer (for instant UX feedback) and again in the main process (since the renderer is untrusted input from main's perspective) before it ever reaches a module.
- **No shell interpolation.** The ping module uses `child_process.spawn` with an argv array — never a shell string — to eliminate command injection risk.

---

## Tech stack

| Layer      | Technologies                                                          |
| ---------- | ---------------------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Zustand, Zod    |
| Desktop    | Electron, Electron Builder                                             |
| Main process | Node.js (`node:dns`, `node:net`, `child_process`), TypeScript        |
| Icons      | Lucide React                                                           |
| Tooling    | ESLint, Prettier, electron-vite                                        |

---

## Getting started

### Prerequisites

- Node.js ^20.19.0 or >=22.12.0 (per Vite 7's requirement)
- pnpm

### Install

```bash
pnpm install
```

### Run in development

```bash
pnpm dev
```

### Build

```bash
pnpm build:win     # Windows
pnpm build:mac     # macOS
pnpm build:linux   # Linux
```

### Other scripts

| Command           | Description                                  |
| ------------------ | --------------------------------------------- |
| `pnpm typecheck`   | Type-check main, preload, and renderer projects |
| `pnpm lint`        | Lint the codebase                             |
| `pnpm format`      | Format with Prettier                          |
| `pnpm start`       | Preview a production build                    |

---

## Roadmap

Planned, not yet built:

- Additional recon modules: WHOIS, Traceroute, Geolocation, ASN
- PDF report export
- Animations and skeleton loading states (Framer Motion)
- Multi-page navigation (React Router)
- Full shadcn/ui component set
- Automated test suite (Vitest)
- Scan history and saved targets
- `NmapProvider` as an alternative port scan backend

---

## Security

- All network access is confined to the Electron main process.
- `contextIsolation` is enabled; the renderer only sees a typed, minimal API surface.
- User-supplied targets are validated (IPv4/hostname format) before any scan runs, on both the renderer and main-process sides.
- Process invocation always uses argument arrays, never shell string concatenation.

## License

No license has been chosen yet.
