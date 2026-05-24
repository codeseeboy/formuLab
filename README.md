# FormuLab

Web app for agrochemical formulation R&D: active ingredients, AI-assisted formulation wizard, troubleshooting, document search (RAG), and PDF reports.

Backend runs on [Appwrite](https://appwrite.io). Frontend is Next.js 16.

## Requirements

- Node.js 20+
- Appwrite Cloud project (Auth, Databases, Storage)
- LLM proxy at `https://llm-backend-635x.onrender.com` (used for wizard and troubleshoot)

## Setup

```bash
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
APPWRITE_API_KEY=your_server_api_key
```

Bootstrap collections and buckets (run once per Appwrite database):

```bash
node src/scripts/init-db.js
```

In Appwrite Console → Auth → Platforms, add:

- `http://localhost:3000` (development)
- your production URL after deploy

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Host the Next.js app on [Vercel](https://vercel.com) (or similar). Keep the same four environment variables in the host dashboard. Appwrite stays on Cloud; point Auth platforms at your live URL.

Do not commit `.env.local`. See `HANDOFF.md` for a fuller feature list and pilot notes.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `node src/scripts/init-db.js` | Create/update Appwrite schema |
| `node scripts/test-all-backend-apis.mjs` | Smoke-test APIs |

## Note

FormuLab is a lab support tool. AI and handbook suggestions still need review by a qualified scientist before use in production or regulatory work.
