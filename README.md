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

Optional AI: copy `server/.env.example` to `server/.env`, then set `GROQ_API_KEY` and optionally `GROQ_MODEL`. Without a key, the assistant uses a deterministic local evidence mode.

## Integrity and safety
The starter index contains NASA investigation catalogue descriptions and source links, not fabricated measurements. Verify each PSI record and its files before adding numerical results. The simulator is an educational scenario, not a validated fire model or emergency procedure.

## FLEX Data Explorer
The FLEX investigation detail includes a data explorer backed by:
- `GET /api/flex/data` — current FLEX dataset and provenance metadata.
- `POST /api/flex/import` — validates and stores normalized CSV rows as `server/data/flex/measurements.json`.

The import expects the headers in `client/public/flex-import-template.csv`. Each row represents one time-series observation. NASA PSI files are not assumed to match this normalized schema; inspect their data organization document and map their actual columns before import. The explorer starts empty by design and does not fabricate experimental measurements.

Primary source records:
- NASA PSI-69: https://psi.nasa.gov/physci/repo/data/investigations/PSI-69
- NASA NTRS report 2015-216046 (first 284 FLEX tests): https://ntrs.nasa.gov/citations/20150023456
- NASA PSI Researcher's Guide (describes FLEX data files and download workflow): https://www.nasa.gov/wp-content/uploads/2020/05/psi_researchers_guide-tagged.pdf
