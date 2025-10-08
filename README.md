# DeepSearchAgent

Lightweight Express-based demo: a multi-pass assistant that queries the DeepSeek API and serves a small static frontend.

Important: this repository does NOT use Vite or a frontend build step. The server (`src/index.js`) serves `index.html` and static assets from the project root.

## What is here
- `src/index.js` - Express server that exposes three POST endpoints and serves `index.html`.
- `src/deepseek.js` - wrapper that calls the DeepSeek API using Axios.
- `index.html` + `src/chat/index.js` - small frontend that posts to the backend endpoints. The frontend expects `axios` to be available in the browser (via CDN script included in `index.html`).

## Prerequisites
- Node.js (tested on Node 18+). Install dependencies:

```powershell
yarn install
```

## Environment
Create a `.env` in the project root with your DeepSeek API key.

Required variable:

- `DEEPSEEK_API_KEY` — API key used by `src/deepseek.js` when calling the external API.

Example `.env` (do NOT commit your real key):

```text
DEEPSEEK_API_KEY=sk-...your-key-here...
```

## Run (development)

Start the server (it will watch `src/index.js` and restart on changes):

```powershell
yarn dev
```

This runs `node --watch src/index.js`. The server listens on `http://localhost:3000` by default.

Open `http://localhost:3000` in your browser to use the UI.

## Endpoints (server)

- `POST /search`
  - Payload: either `{ "message": "your question" }` or a raw string body (the server accepts JSON primitives).
  - Returns: string (links / search results) from DeepSeek.

- `POST /analyze`
  - Payload: `[message, searchResults]` or `{ message, sources }`
  - Returns: string (analysis) from DeepSeek.

- `POST /final`
  - Payload: `[message, analyzeResult]` or `{ message, analyze }`
  - Returns: string (final HTML-formatted answer).

All endpoints return a plain string (or an error string starting with `❌ Error:`) — the frontend expects that.

## Frontend notes
- The frontend script `src/chat/index.js` uses `window.axios` (Axios loaded from the CDN). `index.html` in this repo already includes the CDN `<script src="https://unpkg.com/axios/dist/axios.min.js"></script>` tag.
- If the browser console shows `axios is not available`, check that `index.html` contains the CDN script and that the file is being served by the Express server.

## Troubleshooting

- CORS errors (browser console says blocked by CORS): the server sets `Access-Control-Allow-Origin: *` for development. If you still see CORS, ensure you're actually talking to the Express server on port 3000 and not a different host. Use the browser Network tab to inspect response headers.

- 404 on POST `/search` etc.: make sure the server is running (see logs from `yarn dev`) and that you are posting to `http://localhost:3000/search`. The repo serves static files from the project root and `index.html` at `/`.

- JSON parse errors: backend uses `express.json({ strict: false })` and accepts primitive JSON bodies, but the frontend sends JSON objects (or arrays). When testing with PowerShell use `curl.exe` or `Invoke-RestMethod` with proper headers. Example PowerShell test:

```powershell
# using PowerShell Invoke-RestMethod
Invoke-RestMethod -Uri http://localhost:3000/search -Method Post -ContentType 'application/json' -Body '{"message":"hello"}'

# using curl.exe (native curl bundled in Windows)
curl.exe -X POST http://localhost:3000/search -H "Content-Type: application/json" -d '{"message":"hello"}'
```

- If you see `Request failed with status code 404` in the browser, open the server console to see incoming requests and responses. The server logs method and URL (via request logging middleware).

## Security notes
- The project previously had API keys checked into source. Do NOT commit secrets. Use `.env` and `.gitignore` to keep keys out of Git.

## Files to check if things break
- `src/index.js` — server & routes
- `src/deepseek.js` — external API wrapper (reads `process.env.DEEPSEEK_API_KEY`)
- `index.html` — static page; contains CDN script tag for axios and loads `src/chat/index.js` as a module

## Adding changes / development flow
- Edit server code in `src/index.js` and frontend in `src/chat/index.js`.
- `yarn dev` will restart the server on changes. The browser module loader may cache ES modules – use a hard refresh (Ctrl+F5) or disable cache while devtools is open.

---

If you want, I can also add a short smoke-test script that posts a sample payload to `/search` and prints the result.
