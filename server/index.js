import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
dotenv.config();
const dir=path.dirname(fileURLToPath(import.meta.url));
const items=JSON.parse(await fs.readFile(path.join(dir,'data/investigations.json'),'utf8'));
const app=express();app.use(cors());app.use(express.json({limit:'1mb'}));
app.get('/api/health',(_,res)=>res.json({ok:true,service:'Fire Marshal Orbital API',records:items.length}));
app.get('/api/investigations',(req,res)=>{
 const q=String(req.query.q||'').toLowerCase(),topic=String(req.query.topic||'');
 const found=items.filter(x=>`${x.acronym} ${x.title} ${x.summary} ${x.topics.join(' ')}`.toLowerCase().includes(q)&&(!topic||x.topics.includes(topic)));
 res.json({total:found.length,items:found});
});
app.get('/api/investigations/:id',(req,res)=>{const x=items.find(i=>i.id===req.params.id);x?res.json(x):res.status(404).json({error:'Not found'});});
app.post('/api/compare',(req,res)=>{const ids=Array.isArray(req.body.ids)?req.body.ids.slice(0,2):[];res.json({items:ids.map(id=>items.find(x=>x.id===id)).filter(Boolean),note:'Compare descriptions only. Quantitative equivalence requires original datasets and methods.'});});
function relevant(q){const words=q.toLowerCase().split(/[^a-z0-9-]+/).filter(w=>w.length>2);return items.map(x=>({x,score:words.filter(w=>`${x.acronym} ${x.title} ${x.summary} ${x.detail} ${x.topics.join(' ')}`.toLowerCase().includes(w)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(x=>x.x);}
app.post('/api/assistant/query',async(req,res)=>{
 const question=String(req.body.question||'').trim();if(!question)return res.status(400).json({error:'Question required'});
 const found=relevant(question),sources=found.map(x=>({id:x.id,acronym:x.acronym,title:x.title,url:x.sourceUrl}));
 const evidence=found.map(x=>`${x.acronym}: ${x.detail}`).join('\n\n');
 if(process.env.OPENAI_API_KEY&&found.length){try{
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',temperature:0.2,messages:[{role:'system',content:'Answer only from supplied NASA catalogue descriptions. Never invent measurements, conditions, causal claims, or operational fire-response advice. State when evidence is insufficient. Distinguish source facts from interpretation.'},{role:'user',content:`Question: ${question}\n\nEvidence:\n${evidence}`} ]})});
  if(!r.ok)throw Error(`LLM status ${r.status}`);const d=await r.json();return res.json({answer:d.choices?.[0]?.message?.content||'No answer returned.',sources,mode:'llm',caveat:'AI summary constrained to catalogue descriptions. Consult original PSI records and data files.'});
 }catch(e){console.error('AI fallback:',e.message);}}
 if(!found.length)return res.json({answer:'I could not find enough information in the current index. Try SAFFIRE, BASS, FLEX, ACME, SAME, SLICE, or SPICE.',sources:[],mode:'curated',caveat:'No matching indexed evidence was found; this does not prove the phenomenon has not been studied.'});
 res.json({answer:found.map(x=>`${x.acronym} — ${x.detail}`).join('\n\n'),sources,mode:'curated',caveat:'Catalogue-level summaries only, not quantitative analysis of raw experimental data. Verify detailed conditions and results in the linked NASA PSI records.'});
});
app.get('/api/scenarios',(_,res)=>res.json([{id:'smoke-detection-01',title:'Unusual aerosol readings',choices:['Assume a fire and choose suppression immediately','Review sensor context and smoke-characterisation evidence','Ignore alert until a visible flame appears'],correctChoice:1,evidence:['SAME','SAME-R'],disclaimer:'Educational only. Not an emergency procedure.'}]));
const port=Number(process.env.PORT||4000);app.listen(port,()=>console.log(`API listening at http://localhost:${port}`));
