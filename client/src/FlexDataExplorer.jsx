import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertCircle, BarChart3, CheckCircle2, Database, FileUp, RefreshCw } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const REQUIRED_COLUMNS = [
  'testId', 'elapsedTimeS', 'dropletDiameterMm', 'fuel',
  'oxygenMoleFraction', 'pressureAtm', 'suppressant',
  'burningRateMm2PerS', 'extinctionOutcome'
];

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(value => value !== '')) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(value => value !== '')) rows.push(row);
  if (rows.length < 2) throw new Error('The CSV must contain a header and at least one data row.');
  const headers = rows[0].map(value => value.replace(/^\uFEFF/, ''));
  const missing = REQUIRED_COLUMNS.filter(column => !headers.includes(column));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}`);
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function numberOrNull(value) {
  if (value === '' || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function EmptyChart({ title, description }) {
  return <div className="flex-empty-chart"><BarChart3 size={23} /><b>{title}</b><span>{description}</span><small>Waiting for verified experimental records</small></div>;
}

function LineChart({ points }) {
  if (!points.length) return <EmptyChart title="Droplet combustion history" description="Import time-series rows to plot droplet diameter against elapsed time." />;
  const sorted = [...points].sort((a, b) => a.elapsedTimeS - b.elapsedTimeS);
  const width = 620, height = 220, pad = 38;
  const maxX = Math.max(...sorted.map(p => p.elapsedTimeS), 1);
  const maxY = Math.max(...sorted.map(p => p.dropletDiameterMm), 1);
  const coords = sorted.map(p => `${pad + (p.elapsedTimeS / maxX) * (width - pad * 2)},${height - pad - (p.dropletDiameterMm / maxY) * (height - pad * 2)}`).join(' ');
  return <div className="flex-chart-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Droplet diameter versus elapsed time"><line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} /><line x1={pad} y1={pad} x2={pad} y2={height-pad} /><polyline points={coords} /><text x={width/2} y={height-7} textAnchor="middle">Elapsed time (s)</text><text x="12" y={height/2} transform={`rotate(-90 12 ${height/2})`} textAnchor="middle">Diameter (mm)</text></svg></div>;
}

function ScatterChart({ points }) {
  const valid = points.filter(p => Number.isFinite(p.oxygenMoleFraction) && Number.isFinite(p.burningRateMm2PerS));
  if (!valid.length) return <EmptyChart title="Oxygen concentration vs. burning rate" description="Import rows containing oxygen mole fraction and burning-rate measurements." />;
  const width = 620, height = 220, pad = 38;
  const minX = Math.min(...valid.map(p => p.oxygenMoleFraction));
  const maxX = Math.max(...valid.map(p => p.oxygenMoleFraction), minX + 0.01);
  const minY = Math.min(...valid.map(p => p.burningRateMm2PerS));
  const maxY = Math.max(...valid.map(p => p.burningRateMm2PerS), minY + 0.01);
  return <div className="flex-chart-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Oxygen mole fraction versus burning rate"><line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} /><line x1={pad} y1={pad} x2={pad} y2={height-pad} />{valid.map((p, i) => <circle key={`${p.testId}-${i}`} cx={pad + ((p.oxygenMoleFraction-minX)/(maxX-minX))*(width-pad*2)} cy={height-pad-((p.burningRateMm2PerS-minY)/(maxY-minY))*(height-pad*2)} r="4" />)}<text x={width/2} y={height-7} textAnchor="middle">Oxygen mole fraction</text><text x="12" y={height/2} transform={`rotate(-90 12 ${height/2})`} textAnchor="middle">Burning rate (mm²/s)</text></svg></div>;
}

export default function FlexDataExplorer({ showPreviewByDefault = false } = {}) {
  const [dataset, setDataset] = useState({ records: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fuel, setFuel] = useState('All fuels');
  const [testId, setTestId] = useState('');
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [previewMode, setPreviewMode] = useState(showPreviewByDefault);
  const [rawView, setRawView] = useState('table');
  const fileRef = useRef(null);

  async function loadDataset() {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API}/api/flex/data`);
      if (!response.ok) throw new Error('Could not load FLEX dataset from the API.');
      setDataset(await response.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadDataset(); }, []);

  const records = dataset.records || [];
  const fuels = useMemo(() => ['All fuels', ...new Set(records.map(row => row.fuel).filter(Boolean))], [records]);
  const filtered = useMemo(() => records.filter(row => fuel === 'All fuels' || row.fuel === fuel), [records, fuel]);
  const tests = useMemo(() => [...new Set(filtered.map(row => row.testId).filter(Boolean))], [filtered]);
  const activeTest = tests.includes(testId) ? testId : (tests[0] || '');
  // Preview points are synthetic UI examples only. They are never stored,
  // imported, sent to the API, or presented as NASA experimental measurements.
  const previewRows = [
    { testId: 'PREVIEW-01', elapsedTimeS: 0, dropletDiameterMm: 2.00, oxygenMoleFraction: 0.15, burningRateMm2PerS: 0.42 },
    { testId: 'PREVIEW-01', elapsedTimeS: 2, dropletDiameterMm: 1.82, oxygenMoleFraction: 0.18, burningRateMm2PerS: 0.51 },
    { testId: 'PREVIEW-01', elapsedTimeS: 4, dropletDiameterMm: 1.58, oxygenMoleFraction: 0.21, burningRateMm2PerS: 0.63 },
    { testId: 'PREVIEW-01', elapsedTimeS: 6, dropletDiameterMm: 1.31, oxygenMoleFraction: 0.24, burningRateMm2PerS: 0.71 },
    { testId: 'PREVIEW-01', elapsedTimeS: 8, dropletDiameterMm: 1.02, oxygenMoleFraction: 0.27, burningRateMm2PerS: 0.82 },
    { testId: 'PREVIEW-01', elapsedTimeS: 10, dropletDiameterMm: 0.72, oxygenMoleFraction: 0.30, burningRateMm2PerS: 0.94 }
  ];
  const showingPreview = previewMode && records.length === 0;
  const chartSource = showingPreview ? previewRows : filtered;
  const chartTest = showingPreview ? 'PREVIEW-01' : activeTest;
  const timeSeries = chartSource.filter(row => row.testId === chartTest && Number.isFinite(row.elapsedTimeS) && Number.isFinite(row.dropletDiameterMm));
  const burningRows = chartSource.filter(row => Number.isFinite(row.oxygenMoleFraction) && Number.isFinite(row.burningRateMm2PerS));
  const testCount = new Set(filtered.map(row => row.testId).filter(Boolean)).size;

  async function importCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true); setError(''); setMessage('');
    try {
      const parsed = parseCsv(await file.text());
      const normalized = parsed.map(row => ({
        testId: String(row.testId || '').trim(),
        elapsedTimeS: numberOrNull(row.elapsedTimeS),
        dropletDiameterMm: numberOrNull(row.dropletDiameterMm),
        fuel: String(row.fuel || '').trim(),
        oxygenMoleFraction: numberOrNull(row.oxygenMoleFraction),
        pressureAtm: numberOrNull(row.pressureAtm),
        suppressant: String(row.suppressant || '').trim(),
        burningRateMm2PerS: numberOrNull(row.burningRateMm2PerS),
        extinctionOutcome: String(row.extinctionOutcome || '').trim(),
        sourceReference: String(row.sourceReference || '').trim()
      }));
      if (normalized.some(row => !row.testId)) throw new Error('Every row must include a testId.');
      const response = await fetch(`${API}/api/flex/import`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceFile: file.name, records: normalized })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Dataset import failed.');
      setMessage(`${result.imported} rows imported. Existing FLEX dataset was replaced.`);
      setFuel('All fuels'); setTestId(''); await loadDataset();
    } catch (err) { setError(err.message); }
    finally { setImporting(false); event.target.value = ''; }
  }

  return (
    <section className="flex-explorer" aria-labelledby="flex-explorer-title">
      <div className="flex-explorer-head">
        <div><small>NASA PSI-69 / EXPERIMENTAL DATA</small><h3 id="flex-explorer-title"><Activity size={18} /> FLEX Data Explorer</h3><p>Explore verified FLEX observations and compare combustion behaviour under documented test conditions.</p></div>
        <button className="flex-icon-button" onClick={loadDataset} title="Refresh dataset"><RefreshCw size={15} /></button>
      </div>

      <div className="flex-source-note"><Database size={16} /><span><b>Data provenance first.</b> The explorer does not generate sample measurements. Only rows imported from documented research files are plotted.</span></div>

      <div className="flex-data-toolbar">
        <div><small>DATASET STATUS</small><b>{loading ? 'Loading…' : `${records.length} observations · ${testCount} tests`}</b></div>
        <div><small>SOURCE FILE</small><b>{dataset.metadata?.sourceFile || 'No file imported'}</b></div>
        <label className="flex-import-button"><FileUp size={15} /> {importing ? 'Importing…' : 'Import NASA CSV'}<input ref={fileRef} type="file" accept=".csv,text/csv" onChange={importCsv} disabled={importing} /></label>
      </div>

      {error && <div className="flex-alert"><AlertCircle size={16} />{error}</div>}
      {message && <div className="flex-success"><CheckCircle2 size={16} />{message}</div>}

      <div className="flex-schema"><b>Expected normalized CSV columns</b><code>{REQUIRED_COLUMNS.join(', ')}, sourceReference (optional)</code><span>One row per time-series observation. Use decimal fractions for oxygen mole fraction, seconds for time, mm for droplet diameter, atm for pressure and mm²/s for burning rate. Leave unavailable measurements blank; do not estimate them. NASA source files may require column mapping before import.</span><a href="/flex-import-template.csv" download>Download CSV template ↓</a></div>

      <div className="flex-filters">
        <label>Fuel<select value={fuel} onChange={event => { setFuel(event.target.value); setTestId(''); }}>{fuels.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Test<select value={activeTest} onChange={event => setTestId(event.target.value)} disabled={!tests.length}><option value="">No test available</option>{tests.map(value => <option key={value}>{value}</option>)}</select></label>
      </div>

      {records.length === 0 && (
        <div className="flex-preview-control">
          <div><b>Want to see how the charts work?</b><span>Open a clearly labelled visual preview. These values are illustrative only, not NASA measurements.</span></div>
          <button type="button" onClick={() => setPreviewMode(value => !value)}>{previewMode ? 'Hide chart preview' : 'Preview charts'}</button>
        </div>
      )}
      {showingPreview && <div className="flex-preview-warning"><AlertCircle size={15} /><span><b>ILLUSTRATIVE PREVIEW</b> — synthetic example values for interface demonstration only. No scientific conclusions should be drawn from these points.</span></div>}
      <div className="flex-chart-grid">
        <article className="flex-chart-card"><div><small>TIME SERIES</small><b>Droplet diameter history</b></div><LineChart points={timeSeries} /><p>{showingPreview ? 'Illustrative preview · ' : `Selected test: ${activeTest || '—'} · `}Observations: {timeSeries.length}</p></article>
        <article className="flex-chart-card"><div><small>CONDITION COMPARISON</small><b>Oxygen vs. burning rate</b></div><ScatterChart points={burningRows} /><p>{showingPreview ? 'Illustrative preview · ' : ''}Records with both variables: {burningRows.length}</p></article>
      </div>

      <div className="flex-records-head">
        <div><b>Raw experimental data</b><span>{filtered.length} imported rows · maximum 100 displayed</span></div>
        <div className="flex-raw-switch" role="group" aria-label="Raw data display format">
          <button type="button" className={rawView === 'table' ? 'active' : ''} onClick={() => setRawView('table')}>Table</button>
          <button type="button" className={rawView === 'json' ? 'active' : ''} onClick={() => setRawView('json')}>JSON</button>
        </div>
      </div>
      {filtered.length ? (
        rawView === 'json' ? (
          <pre className="flex-raw-json">{JSON.stringify(filtered.slice(0, 100), null, 2)}</pre>
        ) : (
          <div className="flex-table-scroll"><table className="flex-table"><thead><tr><th>Test</th><th>Time (s)</th><th>Diameter (mm)</th><th>Fuel</th><th>O₂ mole fraction</th><th>Pressure (atm)</th><th>Burn rate (mm²/s)</th><th>Outcome</th></tr></thead><tbody>{filtered.slice(0, 100).map((row, index) => <tr key={`${row.testId}-${index}`}><td>{row.testId}</td><td>{row.elapsedTimeS ?? '—'}</td><td>{row.dropletDiameterMm ?? '—'}</td><td>{row.fuel || '—'}</td><td>{row.oxygenMoleFraction ?? '—'}</td><td>{row.pressureAtm ?? '—'}</td><td>{row.burningRateMm2PerS ?? '—'}</td><td>{row.extinctionOutcome || '—'}</td></tr>)}</tbody></table>{filtered.length > 100 && <small className="flex-table-note">Showing first 100 rows.</small>}</div>
        )
      ) : <div className="flex-no-data"><Database size={25} /><b>No experimental measurements imported yet</b><p>The raw visualizer is ready, but no NASA FLEX measurements have been imported. Use the CSV template and import a verified source file to populate the plots, table and JSON inspector.</p><a href="https://psi.nasa.gov/physci/repo/data/investigations/PSI-69" target="_blank" rel="noreferrer">Open NASA PSI-69 record ↗</a></div>}

      <div className="flex-citations"><span>NASA source records:</span><a href="https://psi.nasa.gov/physci/repo/data/investigations/PSI-69" target="_blank" rel="noreferrer">PSI-69 · FLEX</a><a href="https://ntrs.nasa.gov/citations/20150023456" target="_blank" rel="noreferrer">NASA Technical Publication 2015-216046</a></div>
    </section>
  );
}
