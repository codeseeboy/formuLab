# FormuLab — Company Handoff Guide

## What this product is

FormuLab is an **R&D decision-support** web app for agrochemical formulation teams. It is **not** a regulatory submission system or a certified specification engine.

## Production readiness checklist

Before go-live, run:

```bash
cd formulab
node src/scripts/init-db.js
npm run build
node scripts/test-all-backend-apis.mjs
```

Rotate `APPWRITE_API_KEY` if it was ever shared. Never commit `.env.local`.

## Feature matrix: Real vs built-in

| Feature | Type | Notes |
|---------|------|--------|
| Login / signup | **Real** | Appwrite Auth |
| Ingredients & formulations CRUD | **Real** | Appwrite DB |
| AI wizard | **Real** when LLM up | Render backend; shows **Live AI** or **Handbook mode** banner |
| Troubleshoot | **Real** + **saved history** | Sessions in `troubleshooting_sessions` |
| Lab stability tests | **Real** | Per formulation on detail → Stability tab |
| Knowledge RAG | **Real** | Uploads, URLs, Wikipedia corpus, PubChem |
| Handbook dropdowns | **Built-in** | ~17 curated AIs + surfactants/types in code |
| Settings profile/org | **Real** | Appwrite account + org update |
| Change password | **Real** | Appwrite account API |
| Team invite | **Real** | By email; pending until user signs up |
| Audit log | **Real** | Settings → Audit Log |
| PDF reports | **Real** | Client jsPDF + Appwrite storage |

## Legal disclaimer (show to end users)

> FormuLab assists R&D. All AI outputs and handbook data require validation by a qualified scientist before lab or production use. Not for regulatory filing without independent review.

A dismissible banner appears in the app.

## AI accuracy

- **Knowledge Ask**: citation-only from indexed sources; refuses when trust score is low.
- **Wizard / Troubleshoot**: generative AI with RAG context; may use offline handbook if cloud LLM is down (clearly labeled).

No software can guarantee 100% chemical accuracy. Your organization owns final decisions.

## Security notes

- Collections use `Role.users()` (authenticated only). Data is filtered by `org_id` in queries.
- RAG ingest/team APIs use server `APPWRITE_API_KEY` — keep on server only.
- For stricter enterprise isolation, consider Appwrite Teams per organization (future).

## Support contacts

Document your own: DevOps (Appwrite project), LLM backend URL health, and internal SOP owner for uploaded documents.
