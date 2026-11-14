# Fire Marshal Orbital — MVP
NASA Space Apps Challenge prototype.

## Run
Requires Node.js 20+.
```bash
npm run install:all
npm run dev
```
Frontend: http://localhost:5173
API health: http://localhost:4000/api/health

Optional AI: copy `server/.env.example` to `server/.env`, then set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. Without a key, the assistant uses a deterministic local evidence mode.

## Integrity and safety
The starter index contains NASA investigation catalogue descriptions and source links, not fabricated measurements. Verify each PSI record and its files before adding numerical results. The simulator is an educational scenario, not a validated fire model or emergency procedure.
