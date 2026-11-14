import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import Groq from "groq-sdk";
import { fileURLToPath } from 'node:url';
dotenv.config();
const dir=path.dirname(fileURLToPath(import.meta.url));
const items=JSON.parse(await fs.readFile(path.join(dir,'data/investigations.json'),'utf8'));
const app=express();app.use(cors());app.use(express.json({limit:'10mb'}));
app.get('/api/health',(_,res)=>res.json({ok:true,service:'Fire Marshal Orbital API',records:items.length}));
app.get('/api/investigations',(req,res)=>{
 const q=String(req.query.q||'').toLowerCase(),topic=String(req.query.topic||'');
 const found=items.filter(x=>`${x.acronym} ${x.title} ${x.summary} ${x.topics.join(' ')}`.toLowerCase().includes(q)&&(!topic||x.topics.includes(topic)));
 res.json({total:found.length,items:found});
});
app.get('/api/investigations/:id',(req,res)=>{const x=items.find(i=>i.id===req.params.id);x?res.json(x):res.status(404).json({error:'Not found'});});

const flexDataPath = path.join(dir, 'data', 'flex', 'measurements.json');
let flexDataset = JSON.parse(await fs.readFile(flexDataPath, 'utf8').catch(() => '{\"metadata\":{},\"records\":[]}'));
const FLEX_NUMERIC_FIELDS = ['elapsedTimeS', 'dropletDiameterMm', 'oxygenMoleFraction', 'pressureAtm', 'burningRateMm2PerS'];

app.get('/api/flex/data', (_req, res) => {
  res.json(flexDataset);
});

app.post('/api/flex/import', async (req, res) => {
  try {
    const records = Array.isArray(req.body.records) ? req.body.records : [];
    const sourceFile = typeof req.body.sourceFile === 'string' ? req.body.sourceFile.slice(0, 180) : 'uploaded.csv';
    if (!records.length) return res.status(400).json({ error: 'The imported dataset contains no records.' });
    if (records.length > 50000) return res.status(413).json({ error: 'The dataset exceeds the 50,000-row import limit.' });

    const cleanRecords = records.map((record, index) => {
      if (!record || typeof record.testId !== 'string' || !record.testId.trim()) {
        throw new Error(`Row ${index + 1}: testId is required.`);
      }
      const clean = {
        testId: record.testId.trim().slice(0, 100),
        fuel: typeof record.fuel === 'string' ? record.fuel.trim().slice(0, 100) : '',
        suppressant: typeof record.suppressant === 'string' ? record.suppressant.trim().slice(0, 100) : '',
        extinctionOutcome: typeof record.extinctionOutcome === 'string' ? record.extinctionOutcome.trim().slice(0, 100) : '',
        sourceReference: typeof record.sourceReference === 'string' ? record.sourceReference.trim().slice(0, 500) : ''
      };
      for (const field of FLEX_NUMERIC_FIELDS) {
        const value = record[field];
        clean[field] = value === null || value === '' || value === undefined ? null : Number(value);
        if (clean[field] !== null && !Number.isFinite(clean[field])) {
          throw new Error(`Row ${index + 1}: ${field} must be a finite number or blank.`);
        }
      }
      if (clean.oxygenMoleFraction !== null && (clean.oxygenMoleFraction < 0 || clean.oxygenMoleFraction > 1)) {
        throw new Error(`Row ${index + 1}: oxygenMoleFraction must be between 0 and 1.`);
      }
      return clean;
    });

    const nextDataset = {
      metadata: {
        investigationId: 'flex', sourceFile, sourceUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-69',
        importedAt: new Date().toISOString(), recordCount: cleanRecords.length,
        status: 'imported_user_supplied_csv', schemaVersion: 1
      },
      records: cleanRecords
    };
    await fs.mkdir(path.dirname(flexDataPath), { recursive: true });
    const tempPath = `${flexDataPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(nextDataset, null, 2));
    await fs.rename(tempPath, flexDataPath);
    flexDataset = nextDataset;
    res.json({ ok: true, imported: cleanRecords.length, metadata: flexDataset.metadata });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Could not import FLEX data.' });
  }
});
app.post('/api/compare',(req,res)=>{const ids=Array.isArray(req.body.ids)?req.body.ids.slice(0,2):[];res.json({items:ids.map(id=>items.find(x=>x.id===id)).filter(Boolean),note:'Compare descriptions only. Quantitative equivalence requires original datasets and methods.'});});

const SCIENTIFIC_TERMS = {
  combustao: ['combustion'],
  chama: ['flame'],
  chamas: ['flames'],
  fogo: ['fire'],
  fumo: ['smoke'],
  fumaca: ['smoke'],
  microgravidade: ['microgravity'],
  gravidade: ['gravity'],
  oxigenio: ['oxygen'],
  difusao: ['diffusion'],
  conveccao: ['convection'],
  temperatura: ['temperature'],
  calor: ['heat'],
  combustivel: ['fuel'],
  combustiveis: ['fuels'],
  gota: ['droplet'],
  gotas: ['droplets'],
  solido: ['solid'],
  liquido: ['liquid'],
  dados: ['data', 'measurements', 'results'],
  resultados: ['results', 'findings'],
  experiencia: ['experiment', 'investigation'],
  experiencias: ['experiments', 'investigations'],
  pesquisa: ['research'],
  particulas: ['particles'],
  emissao: ['emission'],
  propagacao: ['spread', 'propagation']
};

function relevant(q) {
  const normalized = q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const originalWords = normalized
    .split(/[^a-z0-9-]+/)
    .filter(w => w.length > 2);

  const words = new Set(originalWords);

  for (const word of originalWords) {
    (SCIENTIFIC_TERMS[word] || []).forEach(term => words.add(term));
  }

  return items.map(x => {
    const searchable = [
      x.acronym,
      x.title,
      x.summary,
      x.detail,
      x.objective,
      x.researchArea,
      x.phenomenon,
      x.environment,
      x.experimentalApproach,
      x.materials,
      x.relevance,
      x.dataAvailabilityNote,
      ...(x.topics || [])
    ].filter(Boolean).join(' ').toLowerCase();

    const score = [...words].reduce((total, word) => {
      return total + (searchable.includes(word) ? 1 : 0);
    }, 0);

    return { x, score };
  })
  .filter(result => result.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 6)
  .map(result => result.x);
}

//===================

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post('/api/assistant/query', async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages)
      ? req.body.messages
      : req.body.question
        ? [{ role: 'user', content: req.body.question }]
        : [];

    if (!messages.length) {
      return res.status(400).json({
        error: 'A message is required.'
      });
    }

    // Accept only valid conversation messages.
    const validMessages = messages
      .filter(m =>
        ['user', 'assistant'].includes(m.role) &&
        typeof m.content === 'string' &&
        m.content.trim()
      )
      .slice(-12)
      .map(m => ({
        role: m.role,
        content: m.content.slice(0, 4000)
      }));

    const lastUserMessage = [...validMessages]
      .reverse()
      .find(m => m.role === 'user');

    if (!lastUserMessage) {
      return res.status(400).json({
        error: 'A user message is required.'
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: 'Groq API key is not configured.'
      });
    }

    // Search the NASA investigation catalogue.
    const found = relevant(lastUserMessage.content);

    const sources = found.map(x => ({
      id: x.id,
      acronym: x.acronym,
      title: x.title,
      url: x.sourceUrl
    }));


    const evidence = found.map(x => `
    INVESTIGATION: ${x.acronym}
    TITLE: ${x.title}

    SUMMARY:
    ${x.summary || 'Not documented'}

    SCIENTIFIC DETAILS:
    ${x.detail || 'Not documented'}

    RESEARCH AREA:
    ${x.researchArea || 'Not documented'}

    SCIENTIFIC OBJECTIVE:
    ${x.objective || 'Not documented'}

    PHENOMENON:
    ${x.phenomenon || 'Not documented'}

    EXPERIMENTAL ENVIRONMENT:
    ${x.environment || 'Not documented'}

    EXPERIMENTAL APPROACH:
    ${x.experimentalApproach || 'Not documented'}

    MATERIALS AND FUELS:
    ${x.materials || 'Not documented'}

    SCIENTIFIC RELEVANCE:
    ${x.relevance || 'Not documented'}

    DATA AVAILABILITY:
    ${x.dataAvailabilityNote || 'Not documented'}

    TOPICS:
    ${(x.topics || []).join(', ')}

    SOURCE:
    ${x.sourceUrl || 'Not available'}
    `).join('\n\n-------------------------\n\n');

    const groqMessages = [
      {
        role: 'system',
        
        content: `
        You are FIRE MARSHAL AI, an advanced scientific research
        assistant specialized in NASA combustion science and
        microgravity research.

        LANGUAGE:
        Always answer in the same language as the user.

        YOUR SCIENTIFIC EXPERTISE:
        - Combustion physics
        - Flame propagation and extinction
        - Microgravity combustion
        - Heat and mass transfer
        - Diffusion and convection
        - Smoke and aerosol formation
        - Solid and liquid fuel combustion
        - Experimental research methods
        - Scientific data interpretation

        HOW TO ANSWER:

        1. Give detailed and educational scientific explanations.
        2. Explain the physical mechanisms behind phenomena.
        3. Use equations when scientifically appropriate.
        4. Explain relevant experimental variables.
        5. Compare investigations when requested.
        6. Explain the significance of research for spacecraft safety.

        EVIDENCE RULES:

        Separate your answers into:

        A. NASA RESEARCH EVIDENCE
        Use only the supplied investigation records for
        claims about specific NASA experiments.

        B. GENERAL SCIENTIFIC EXPLANATION
        You may explain established scientific principles
        using general scientific knowledge.

        C. DATA LIMITATIONS
        Clearly identify missing measurements, unavailable
        datasets and uncertainties.

        IMPORTANT:
        - Never invent experimental measurements.
        - Never invent NASA results.
        - Never present theoretical explanations as measured results.
        - Never claim to have accessed raw experimental files
          when they were not supplied.
        - Explain when evidence is insufficient.
        - Do not provide operational emergency-response instructions.

        Answer with scientific depth, clarity and structure.

        NASA INVESTIGATION RECORDS:

        ${evidence || 'No matching NASA investigation records were retrieved.'}
        `
      },
      ...validMessages
    ];

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: groqMessages,
      temperature: 0.3,
      max_tokens: 1200
    });

    const answer =
      response.choices?.[0]?.message?.content ||
      'The assistant could not generate an answer.';

    res.json({
      answer,
      sources,
      mode: 'groq',
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      caveat: 'AI-generated scientific summary based on indexed NASA catalogue descriptions. Consult original NASA PSI records for experimental details.'
    });

  } catch (error) {
    console.error('Groq Assistant Error:', error);

    res.status(500).json({
      error: 'The AI Assistant could not process your request.'
    });
  }
});

app.get('/api/scenarios',(_,res)=>res.json([{id:'smoke-detection-01',title:'Unusual aerosol readings',choices:['Assume a fire and choose suppression immediately','Review sensor context and smoke-characterisation evidence','Ignore alert until a visible flame appears'],correctChoice:1,evidence:['SAME','SAME-R'],disclaimer:'Educational only. Not an emergency procedure.'}]));
const port=Number(process.env.PORT||4000);app.listen(port,()=>console.log(`API listening at http://localhost:${port}`));
