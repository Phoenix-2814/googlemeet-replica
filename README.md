# Google Meet Replica

A minimal video‑calling web app built with **Next.js**, **Socket.io**, and **Simple‑Peer**. It supports:

- Turn camera on/off
- Turn microphone on/off
- Screen sharing
- End call (cutting the call)
- Generated meeting links that can be shared
- End‑to‑end encrypted media streams (WebRTC provides encryption by default)

The app can be deployed to **Render** using a simple `render.yaml` configuration.

## Tech Stack

- **Next.js 13** – React framework with server‑side rendering.
- **React 18** – UI library.
- **Material‑UI (MUI)** – Beautiful components.
- **Socket.io** – Signalling server for WebRTC.
- **Simple‑Peer** – Wrapper around WebRTC for easy peer‑to‑peer connections.
- **uuid** – Generate unique meeting IDs.

## Project Structure

```
google-meet-replica/
├─ pages/
│  ├─ _app.js          # Global styles & theme
│  ├─ index.js         # Home page with "Start Meeting" button
│  └─ meeting/[id].js  # Meeting room page (dynamic route)
├─ public/
│  └─ ...
├─ server.js            # Custom Express + Socket.io server
├─ next.config.js       # Next config (socket.io fallback fixes)
├─ package.json
├─ render.yaml          # Render deployment config
└─ README.md
```

## Getting Started (local)

```bash
# Clone repo (or create the folder you are in)
npm install
npm run dev   # Starts Next dev server at http://localhost:3000
```

The signalling server runs on the same process (custom server) – no extra steps.

## Deploy to Render

1. Push the repository to a Git provider (GitHub, GitLab, etc.).
2. In Render, create a **Web Service** and connect the repo.
3. Set the **Build Command** to `npm install` and the **Start Command** to `npm start`.
4. Add a **render.yaml** (already provided) so Render auto‑detects the service.
5. Deploy – Render will expose the app on `https://<service>.onrender.com`.

## Security Notes

- Media streams are encrypted end‑to‑end by WebRTC (DTLS/SRTP).
- Signalling messages travel over HTTPS (Render provides TLS).
- No media is stored on the server; only signalling data passes through.
- The meeting ID is a UUID making it hard to guess.

---

Feel free to customize the UI or add authentication as needed.

