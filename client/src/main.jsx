
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  Archive,
  Bot,
  ChevronRight,
  Flame,
  Info,
  Search,
  ShieldAlert,
  Wind,
  X
} from 'lucide-react';

import Simulator from './Simulator';
import './style.css';

// ==========================================
// CONFIGURATION
// ==========================================

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const tabs = [
  'Overview',
  'Research Archive',
  'AI Assistant',
  'Simulator',
  'Mission Briefing'
];

const MATERIAL_FILTERS = [
  'All material types',
  'Solid fuels',
  'Liquid fuels / droplets',
  'Gaseous fuels',
  'Smoke aerosols'
];

// Maps archive investigation IDs to the simulator scenarios that use them.
// Scenario IDs correspond to the scenario definitions in Simulator.jsx.
const INVESTIGATION_SCENARIO_MAP = {
  'same': [1],
  'same-r': [1],
  'saffire-i': [3],
  'saffire-ii': [3],
  'saffire-iii': [3],
  'bass': [4],
  'bass-ii': [4, 5],
  'flex': [6, 8],
  'flex-2': [7],
  'acme-s-flames': [9],
  'slice': [9],
  'spice': [9]
};

const SCENARIO_LABELS = {
  1: 'Unexpected aerosol readings',
  2: 'Particle sensor validation',
  3: 'Fire growth in a spacecraft',
  4: 'Flame spread across a solid',
  5: 'Evaluating a ground-based test',
  6: 'Evaluating a gaseous suppressant',
  7: 'Liquid droplet behaviour',
  8: 'Combustion without visible flame',
  9: 'Understanding flame stability'
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getUniqueValues(items, field) {
  return [
    ...new Set(
      items
        .map(item => item[field])
        .filter(value => typeof value === 'string' && value.trim())
    )
  ].sort((a, b) => a.localeCompare(b));
}

function getMaterialCategory(item) {
  const topics = (item.topics || []).join(' ').toLowerCase();
  const materials = (item.materials || '').toLowerCase();
  const phenomenon = (item.phenomenon || '').toLowerCase();
  const combined = `${topics} ${materials} ${phenomenon}`;

  if (
    combined.includes('smoke aerosol') ||
    combined.includes('smoke detection') ||
    combined.includes('polymer fragment')
  ) {
    return 'Smoke aerosols';
  }

  if (
    combined.includes('solid fuel') ||
    combined.includes('solid material')
  ) {
    return 'Solid fuels';
  }

  if (
    combined.includes('droplet') ||
    combined.includes('liquid fuel')
  ) {
    return 'Liquid fuels / droplets';
  }

  if (
    combined.includes('gaseous fuel') ||
    combined.includes('gas flame') ||
    combined.includes('diffusion flame')
  ) {
    return 'Gaseous fuels';
  }

  return 'Other';
}

function getComparisonValue(item, field) {
  return item?.[field] || 'Not specified in the current catalogue description.';
}

// This comparison is deliberately limited to the text in the current
// catalogue. It does not infer experimental equivalence or compare raw data.
function compareCatalogueField(first, second, field) {
  const firstValue = typeof first?.[field] === 'string' ? first[field].trim() : '';
  const secondValue = typeof second?.[field] === 'string' ? second[field].trim() : '';

  if (!firstValue || !secondValue) {
    return {
      status: 'insufficient',
      label: 'Insufficient catalogue information'
    };
  }

  const normalize = value => value.toLocaleLowerCase().replace(/\s+/g, ' ').trim();

  if (normalize(firstValue) === normalize(secondValue)) {
    return {
      status: 'matching',
      label: 'Same catalogue description'
    };
  }

  return {
    status: 'different',
    label: 'Different catalogue descriptions'
  };
}

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

function Fire() {
  return (
    <div className="fire">
      <div className="ring" />

      <div className="orb">
        <Flame size={55} />
      </div>

      <small>MICROGRAVITY · CONCEPTUAL VISUAL</small>
    </div>
  );
}

// ==========================================
// MAIN APPLICATION
// ==========================================

function App() {
  // Navigation
  const [tab, setTab] = useState('Research Archive');

  // Research Archive
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('All topics');
  const [researchArea, setResearchArea] = useState('All research areas');
  const [phenomenon, setPhenomenon] = useState('All phenomena');
  const [materialType, setMaterialType] = useState('All material types');

  const [selected, setSelected] = useState(null);
  const [compare, setCompare] = useState([]);

  // Context passed from the Research Archive into the Simulator.
  const [simulatorInitialScenarioId, setSimulatorInitialScenarioId] = useState(null);
  const [simulatorLinkedInvestigation, setSimulatorLinkedInvestigation] = useState(null);

  const [loadingResearch, setLoadingResearch] = useState(true);
  const [researchError, setResearchError] = useState('');

  // AI Assistant
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
  {
  role: 'assistant',
  content: 'Hello! I am FIRE MARSHAL AI. I can help you explore NASA combustion research, understand microgravity phenomena and analyze scientific evidence.',
  sources: []
  }
  ]);
  const [busy, setBusy] = useState(false);
  // ========================================
  // LOAD RESEARCH DATA
  // ========================================

  useEffect(() => {
    async function loadInvestigations() {
      setLoadingResearch(true);
      setResearchError('');

      try {
        const response = await fetch(`${API}/api/investigations`);

        if (!response.ok) {
          throw new Error('Could not load NASA investigation records.');
        }

        const data = await response.json();

        if (!Array.isArray(data.items)) {
          throw new Error('Unexpected research data format.');
        }

        setItems(data.items);
      } catch (error) {
        setResearchError(
          error.message || 'Unable to connect to the research API.'
        );
        setItems([]);
      } finally {
        setLoadingResearch(false);
      }
    }

    loadInvestigations();
  }, []);

  // ========================================
  // DYNAMIC FILTER OPTIONS
  // ========================================

  const availableTopics = useMemo(() => {
    return [
      ...new Set(
        items.flatMap(item => item.topics || [])
      )
    ].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const availableResearchAreas = useMemo(() => {
    return getUniqueValues(items, 'researchArea');
  }, [items]);

  const availablePhenomena = useMemo(() => {
    return getUniqueValues(items, 'phenomenon');
  }, [items]);

  // ========================================
  // FILTER RESEARCH INVESTIGATIONS
  // ========================================

  const filtered = useMemo(() => {
    return items.filter(item => {
      const searchableText = [
        item.acronym,
        item.title,
        item.summary,
        item.detail,
        item.researchArea,
        item.phenomenon,
        item.objective,
        item.environment,
        item.experimentalApproach,
        item.materials,
        item.relevance,
        item.dataAvailabilityNote,
        ...(item.topics || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        query.trim().toLowerCase()
      );

      const matchesTopic =
        topic === 'All topics' ||
        (item.topics || []).includes(topic);

      const matchesResearchArea =
        researchArea === 'All research areas' ||
        item.researchArea === researchArea;

      const matchesPhenomenon =
        phenomenon === 'All phenomena' ||
        item.phenomenon === phenomenon;

      const matchesMaterial =
        materialType === 'All material types' ||
        getMaterialCategory(item) === materialType;

      return (
        matchesSearch &&
        matchesTopic &&
        matchesResearchArea &&
        matchesPhenomenon &&
        matchesMaterial
      );
    });
  }, [
    items,
    query,
    topic,
    researchArea,
    phenomenon,
    materialType
  ]);

  // ========================================
  // RESET ARCHIVE FILTERS
  // ========================================

  function resetFilters() {
    setQuery('');
    setTopic('All topics');
    setResearchArea('All research areas');
    setPhenomenon('All phenomena');
    setMaterialType('All material types');
  }

  // ========================================
  // AI ASSISTANT
  // ========================================

  async function ask(event) {
    event.preventDefault();

    const text = question.trim();

    if (!text || busy) return;

    const updatedMessages = [
      ...messages,
      {
        role: 'user',
        content: text
      }
    ];

    setMessages(updatedMessages);
    setQuestion('');
    setBusy(true);

    try {
      const response = await fetch(`${API}/api/assistant/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updatedMessages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
              role: m.role,
              content: m.content
            }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Assistant request failed.');
      }

      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
          mode: data.mode,
          caveat: data.caveat
        }
      ]);

    } catch (error) {
      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: error.message || 'Unable to connect to Groq AI.',
          sources: [],
          mode: 'error'
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // RESEARCH DETAILS
  // ========================================

  async function detail(id) {
    try {
      const response = await fetch(
        `${API}/api/investigations/${id}`
      );

      if (!response.ok) {
        throw new Error('Could not load investigation details.');
      }

      const data = await response.json();

      setSelected(data);
    } catch {
      // If the detail endpoint fails, use the record
      // already loaded in the archive.
      const fallback = items.find(item => item.id === id);

      setSelected(fallback || null);
    }
  }

  // ========================================
  // INVESTIGATION COMPARISON
  // ========================================

  function compareToggle(id) {
    setCompare(current => {
      if (current.includes(id)) {
        return current.filter(item => item !== id);
      }

      if (current.length < 2) {
        return [...current, id];
      }

      return [current[1], id];
    });
  }

  const comparisonItems = useMemo(() => {
    return compare
      .map(id => items.find(item => item.id === id))
      .filter(Boolean);
  }, [compare, items]);

  const comparisonFields = [
    ['Research area', 'researchArea'],
    ['Phenomenon', 'phenomenon'],
    ['Objective', 'objective'],
    ['Experimental environment', 'environment'],
    ['Experimental approach', 'experimentalApproach'],
    ['Materials and fuels', 'materials'],
    ['Scientific relevance', 'relevance'],
    ['Data availability', 'dataAvailabilityNote']
  ];

  const comparisonAnalysis = useMemo(() => {
    if (comparisonItems.length !== 2) return [];

    return comparisonFields.map(([label, field]) => ({
      label,
      field,
      ...compareCatalogueField(comparisonItems[0], comparisonItems[1], field)
    }));
  }, [comparisonItems]);

  // ========================================
  // ARCHIVE ↔ SIMULATOR INTEGRATION
  // ========================================

  function openSimulatorScenario(scenarioId, investigation) {
    setSimulatorInitialScenarioId(scenarioId);
    setSimulatorLinkedInvestigation(investigation);
    setSelected(null);
    setTab('Simulator');
  }

  function openInvestigationFromSimulator(investigationId) {
    const investigation = items.find(item => item.id === investigationId);

    if (!investigation) return;

    setSelected(investigation);
    setTab('Research Archive');
  }

  // ========================================
  // NAVIGATION
  // ========================================

  function navigate(destination) {
    setTab(destination);
    setSelected(null);

    // A normal navigation to the Simulator starts without an archive context.
    // Archive launch buttons use openSimulatorScenario() instead.
    if (destination === 'Simulator') {
      setSimulatorInitialScenarioId(null);
      setSimulatorLinkedInvestigation(null);
    }
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="shell">

      {/* HEADER */}

      <header>
        <div className="brand">
          <span>
            <Flame />
          </span>

          <div>
            <b>
              FIRE MARSHAL <i>ORBITAL</i>
            </b>

            <small>
              RESEARCH · UNDERSTAND · STAY SAFE
            </small>
          </div>
        </div>

        <nav>
          {tabs.map(item => (
            <button
              key={item}
              className={tab === item ? 'active' : ''}
              onClick={() => navigate(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <label className="online">
          ● SYSTEM ONLINE
        </label>
      </header>

      <main>

        {/* HERO */}

        <div className="hero">
          <div>
            <small>
              NASA SPACE APPS CHALLENGE · COMBUSTION SCIENCE
            </small>

            <h1>
              Understand fire.
              <br />
              <i>Protect the mission.</i>
            </h1>

            <p>
              Explore microgravity combustion research and turn
              scientific evidence into clearer fire-safety insights
              for human space exploration.
            </p>
          </div>

          <div className="hero-stat">
            <ShieldAlert />

            <b>
              {items.length.toString().padStart(2, '0')}
              <small>INDEXED INVESTIGATIONS</small>
            </b>

            <b>
              NASA PSI
              <small>PRIMARY SOURCE</small>
            </b>
          </div>
        </div>

        {/* MOBILE NAVIGATION */}

        <div className="mobile-nav">
          {tabs.map(item => (
            <button
              key={item}
              className={tab === item ? 'active' : ''}
              onClick={() => navigate(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {/* ==================================
            RESEARCH ARCHIVE
        ================================== */}

        {tab === 'Research Archive' && (
          <div className="layout">

            <section className="panel">

              <div className="section-head">
                <div>
                  <small>KNOWLEDGE BASE / 01</small>

                  <h2>
                    <Archive /> Research Archive
                  </h2>

                  <p>
                    NASA investigations in reduced-gravity
                    combustion science.
                  </p>
                </div>

                <label className="tag">
                  NASA SOURCE INDEX
                </label>
              </div>

              {/* SEARCH AND FILTERS */}

              <div className="tools">
                <label className="search">
                  <Search />

                  <input
                    placeholder="Search investigations, objectives, materials..."
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                  />
                </label>

                <select
                  value={topic}
                  onChange={event => setTopic(event.target.value)}
                >
                  <option>All topics</option>

                  {availableTopics.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={researchArea}
                  onChange={event => setResearchArea(event.target.value)}
                >
                  <option>All research areas</option>

                  {availableResearchAreas.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={phenomenon}
                  onChange={event => setPhenomenon(event.target.value)}
                >
                  <option>All phenomena</option>

                  {availablePhenomena.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={materialType}
                  onChange={event => setMaterialType(event.target.value)}
                >
                  {MATERIAL_FILTERS.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-summary">
                <span>
                  {filtered.length} matching investigations
                </span>

                <button
                  type="button"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              </div>

              {/* LOADING AND ERROR STATES */}

              {loadingResearch && (
                <p className="empty">
                  Loading NASA research records...
                </p>
              )}

              {!loadingResearch && researchError && (
                <div className="warning">
                  <Info />
                  {researchError}
                </div>
              )}

              {/* INVESTIGATION RECORDS */}

              {!loadingResearch && !researchError && (
                <div className="records">

                  {filtered.map(item => (
                    <article className="record" key={item.id}>

                      <div className="record-icon">
                        <Flame />
                      </div>

                      <div className="record-info">
                        <b>
                          {item.acronym}
                          <span>● {item.status}</span>
                        </b>

                        <h3>{item.title}</h3>

                        <p>{item.summary}</p>

                        {item.researchArea && (
                          <small className="research-area">
                            {item.researchArea}
                          </small>
                        )}

                        {item.phenomenon && (
                          <p className="record-phenomenon">
                            <strong>Phenomenon:</strong>{' '}
                            {item.phenomenon}
                          </p>
                        )}

                        <div className="chips">
                          {(item.topics || []).map(itemTopic => (
                            <small key={itemTopic}>
                              {itemTopic}
                            </small>
                          ))}
                        </div>
                      </div>

                      <div className="actions">
                        <button
                          onClick={() => compareToggle(item.id)}
                          className={
                            compare.includes(item.id) ? 'chosen' : ''
                          }
                        >
                          {compare.includes(item.id)
                            ? 'Selected'
                            : 'Compare +'}
                        </button>

                        <button
                          className="arrow"
                          onClick={() => detail(item.id)}
                          aria-label={`View ${item.acronym} details`}
                        >
                          <ChevronRight />
                        </button>
                      </div>

                    </article>
                  ))}

                  {filtered.length === 0 && (
                    <p className="empty">
                      No investigations match your search or filters.
                    </p>
                  )}
                </div>
              )}

              <div className="foot">
                Showing {filtered.length} of {items.length}
                {' '}indexed investigations · NASA PSI
              </div>

            </section>

            {/* RESEARCH SIDEBAR */}

            <aside>

              <section className="panel">
                <small>INTELLIGENCE BRIEF</small>

                <h3>Why microgravity matters</h3>

                <p>
                  NASA studies combustion in reduced gravity to
                  understand processes that buoyancy-driven flows
                  can mask on Earth.
                </p>

                <div className="fact">
                  <b>01</b>

                  <p>
                    <strong>Different flow physics</strong>
                    <small>
                      Buoyancy-driven convection is greatly reduced
                      in microgravity.
                    </small>
                  </p>
                </div>

                <div className="fact">
                  <b>02</b>

                  <p>
                    <strong>Evidence before assumptions</strong>
                    <small>
                      Flame and smoke behavior depends on material
                      and test conditions.
                    </small>
                  </p>
                </div>

                <a
                  href="https://www.nasa.gov/physical-sciences-informatics-psi/psi-investigations-by-research-area/"
                  target="_blank"
                  rel="noreferrer"
                >
                  NASA research catalogue ↗
                </a>
              </section>

              <section className="panel">
                <small>SIDE-BY-SIDE ANALYSIS</small>

                <h3>Compare investigations</h3>

                <p>Select up to two records.</p>

                {comparisonItems.length > 0 ? (
                  comparisonItems.map(item => (
                    <p className="compare-item" key={item.id}>
                      {item.acronym}
                    </p>
                  ))
                ) : (
                  <p className="empty">
                    No investigations selected
                  </p>
                )}

                {compare.length === 2 && (
                  <button
                    className="primary"
                    onClick={() => navigate('Mission Briefing')}
                  >
                    Open comparison →
                  </button>
                )}

                {compare.length > 0 && (
                  <button
                    onClick={() => setCompare([])}
                  >
                    Clear selection
                  </button>
                )}
              </section>

            </aside>
          </div>
        )}

        {/* ==================================
            OVERVIEW
        ================================== */}

        {tab === 'Overview' && (
          <div className="layout">

            <section className="panel overview">
              <small>MISSION CONTROL / OVERVIEW</small>

              <h2>
                From laboratory evidence
                <br />
                to mission readiness.
              </h2>

              <p>
                One workspace to discover NASA research,
                understand findings, and practice evidence-based
                reasoning.
              </p>

              <button
                className="primary"
                onClick={() => navigate('Research Archive')}
              >
                Explore research →
              </button>

              <button
                onClick={() => navigate('Simulator')}
              >
                Enter simulator
              </button>

              <Fire />
            </section>

            <section className="panel">
              <small>PLATFORM MODULES</small>

              {[
                ['01', 'Research Archive', 'Search real NASA investigations'],
                ['02', 'AI Research Assistant', 'Ask questions with cited sources'],
                ['03', 'Emergency Simulator', 'Practice scientific reasoning'],
                ['04', 'Mission Briefing', 'Review evidence and limits']
              ].map(item => (
                <div className="module" key={item[0]}>
                  <b>{item[0]}</b>

                  <p>
                    <strong>{item[1]}</strong>
                    <small>{item[2]}</small>
                  </p>
                </div>
              ))}
            </section>

          </div>
        )}

        {/* ==================================
            AI ASSISTANT
        ================================== */}

                
        {tab === 'AI Assistant' && (
          <div className="layout">

            <section className="panel assistant">

              <div className="assistant-header">
                <div>
                  <small>RESEARCH INTELLIGENCE / 02</small>
                  <h2>
                    <Bot /> FIRE MARSHAL AI
                  </h2>
                  <p>
                    Your intelligent NASA combustion research assistant.
                  </p>
                </div>

                <span className="tag">GROQ AI ONLINE</span>
              </div>

              <div className="chat-messages">

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`chat-message ${message.role}`}
                  >
                    <div className="chat-avatar">
                      {message.role === 'assistant'
                        ? <Bot />
                        : 'YOU'}
                    </div>

                    <div className="chat-content">

                      <small>
                        {message.role === 'assistant'
                          ? 'FIRE MARSHAL AI'
                          : 'YOU'}
                      </small>

                      <div className="chat-bubble">
                        {message.content}
                      </div>

                      {message.sources?.length > 0 && (
                        <div className="chat-sources">
                          <b>REFERENCES</b>

                          {message.sources.map(source => (
                            <a
                              key={source.id}
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {source.acronym} · {source.title} ↗
                            </a>
                          ))}
                        </div>
                      )}

                      {message.caveat && (
                        <div className="caveat">
                          {message.caveat}
                        </div>
                      )}

                    </div>
                  </div>
                ))}

                {busy && (
                  <div className="chat-message assistant">
                    <div className="chat-avatar">
                      <Bot />
                    </div>

                    <div className="chat-content">
                      <small>FIRE MARSHAL AI</small>
                      <div className="chat-bubble typing">
                        Analysing NASA research...
                      </div>
                    </div>
                  </div>
                )}

              </div>

              <form className="chat-form" onSubmit={ask}>

                <textarea
                  value={question}
                  onChange={event => setQuestion(event.target.value)}
                  placeholder="Ask FIRE MARSHAL AI anything..."
                  rows={2}
                  disabled={busy}
                />

                <button
                  className="primary"
                  type="submit"
                  disabled={busy || !question.trim()}
                >
                  {busy ? 'Thinking...' : 'Send message →'}
                </button>

              </form>

              <button
                type="button"
                onClick={() => {
                  setMessages([{
                    role: 'assistant',
                    content: 'Hello! I am FIRE MARSHAL AI. How can I help with your NASA research today?',
                    sources: []
                  }]);
                }}
              >
                Clear conversation
              </button>

            </section>

            <section className="panel">
              <small>SUGGESTED QUESTIONS</small>

              {[
                'What did SAFFIRE investigate?',
                'What is the purpose of FLEX?',
                'Which investigations study smoke?',
                'Why is microgravity combustion different?',
                'Compare SAFFIRE and BASS.'
              ].map(item => (
                <button
                  className="suggest"
                  key={item}
                  disabled={busy}
                  onClick={() => setQuestion(item)}
                >
                  {item} →
                </button>
              ))}
            </section>

          </div>
        )}

        {/* ==================================
            SIMULATOR
        ================================== */}

        {tab === 'Simulator' && (
          <Simulator
            initialScenarioId={simulatorInitialScenarioId}
            linkedInvestigation={simulatorLinkedInvestigation}
            onOpenInvestigation={openInvestigationFromSimulator}
          />
        )}

        {/* ==================================
            MISSION BRIEFING / COMPARISON
        ================================== */}

        {tab === 'Mission Briefing' && (
          <section className="panel briefing">

            <small>MISSION INTELLIGENCE / 04</small>

            <h2>Evidence briefing</h2>

            {comparisonItems.length === 2 ? (
              <>
                <div className="brief-grid">
                  {comparisonItems.map(item => (
                    <div className="brief" key={item.id}>
                      <b>{item.acronym}</b>

                      <h3>{item.title}</h3>

                      <p>{item.summary}</p>

                      <div className="comparison-actions">
                        <button onClick={() => {
                          setSelected(item);
                          setTab('Research Archive');
                        }}>
                          Open archive record
                        </button>

                        {item.sourceUrl && (
                          <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                            Open NASA source ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="comparison-table">
                  <h3>Scientific comparison</h3>
                  <p className="comparison-intro">
                    The status below compares the wording available in the catalogue.
                    It is not a measurement-based comparison and does not establish
                    that two experiments used equivalent conditions.
                  </p>

                  <div className="comparison-row comparison-heading-row">
                    <div className="comparison-label">Dimension</div>
                    {comparisonItems.map(item => (
                      <div className="comparison-value" key={item.id}>
                        <b>{item.acronym}</b>
                      </div>
                    ))}
                    <div className="comparison-status">Catalogue reading</div>
                  </div>

                  {comparisonFields.map(([label, field]) => {
                    const result = compareCatalogueField(
                      comparisonItems[0],
                      comparisonItems[1],
                      field
                    );

                    return (
                      <div className="comparison-row" key={field}>
                        <div className="comparison-label">{label}</div>

                        {comparisonItems.map(item => (
                          <div className="comparison-value" key={item.id}>
                            {getComparisonValue(item, field)}
                          </div>
                        ))}

                        <div className={`comparison-status ${result.status}`}>
                          {result.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="comparison-insights">
                  <h3>What this comparison can tell us</h3>
                  <p>
                    <b>Matching catalogue descriptions:</b>{' '}
                    {comparisonAnalysis.filter(item => item.status === 'matching').length
                      ? comparisonAnalysis.filter(item => item.status === 'matching').map(item => item.label).join(', ')
                      : 'No fields have identical descriptions in both records.'}
                  </p>
                  <p>
                    <b>Different catalogue descriptions:</b>{' '}
                    {comparisonAnalysis.filter(item => item.status === 'different').length
                      ? comparisonAnalysis.filter(item => item.status === 'different').map(item => item.label).join(', ')
                      : 'No differences can be identified from the available text.'}
                  </p>
                  <p>
                    <b>Information gaps:</b>{' '}
                    {comparisonAnalysis.filter(item => item.status === 'insufficient').length
                      ? comparisonAnalysis.filter(item => item.status === 'insufficient').map(item => item.label).join(', ')
                      : 'All listed dimensions have catalogue descriptions for both records.'}
                  </p>
                  <p className="comparison-caution">
                    An objective describes what an investigation set out to study;
                    it is not, by itself, a result. Differences in catalogue wording
                    also do not prove that the underlying experimental methods or
                    outcomes were different. Consult the NASA records and available
                    datasets before drawing scientific or quantitative conclusions.
                  </p>
                </div>

                <div className="comparison-simulator-links">
                  <h3>Continue into scenario training</h3>
                  {comparisonItems.map(item => {
                    const scenarioIds = INVESTIGATION_SCENARIO_MAP[item.id] || [];
                    return (
                      <div className="comparison-scenario-item" key={item.id}>
                        <b>{item.acronym}</b>
                        {scenarioIds.length ? (
                          scenarioIds.map(scenarioId => (
                            <button
                              key={scenarioId}
                              onClick={() => openSimulatorScenario(scenarioId, item)}
                            >
                              {SCENARIO_LABELS[scenarioId] || `Scenario ${scenarioId}`}
                            </button>
                          ))
                        ) : (
                          <span>No linked simulator scenario is currently available.</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="empty">
                Select two investigations in the Research Archive
                to compare them here.
              </p>
            )}

            <div className="warning">
              <Info />

              Similar research topics do not prove equivalent
              experimental conditions or methods. Consult original
              datasets before making quantitative comparisons.
            </div>

          </section>
        )}

      </main>

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer>
        <b>FIRE MARSHAL ORBITAL</b>

        <span>
          Educational research interface · Not for real emergency response
        </span>

        <a
          href="https://psi.nasa.gov/physci/repo"
          target="_blank"
          rel="noreferrer"
        >
          NASA PSI ↗
        </a>
      </footer>

      {/* ======================================
          INVESTIGATION DETAIL MODAL
      ====================================== */}

      {selected && (
        <div
          className="backdrop"
          onClick={() => setSelected(null)}
        >
          <div
            className="modal"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setSelected(null)}
              aria-label="Close investigation details"
            >
              <X />
            </button>

            <small>INVESTIGATION DETAIL / NASA PSI</small>

            <h2>{selected.acronym}</h2>

            <h3>{selected.title}</h3>

            <div className="meta">
              <div>
                <small>RESEARCH AREA</small>
                <b>{selected.researchArea || 'Combustion Science'}</b>
              </div>

              <div>
                <small>STATUS</small>
                <b>{selected.status}</b>
              </div>

              <div>
                <small>MEASUREMENTS</small>
                <b>Not imported</b>
              </div>
            </div>

            <div className="detail-section">
              <small>OVERVIEW</small>
              <p>{selected.summary}</p>
              <p>{selected.detail}</p>
            </div>

            <div className="detail-section">
              <small>SCIENTIFIC OBJECTIVE</small>
              <p>
                {selected.objective || 'Not specified in the current catalogue description.'}
              </p>
            </div>

            <div className="detail-section">
              <small>PHENOMENON STUDIED</small>
              <p>
                {selected.phenomenon || 'Not specified in the current catalogue description.'}
              </p>
            </div>

            <div className="detail-section">
              <small>EXPERIMENTAL ENVIRONMENT</small>
              <p>
                <Wind size={16} />
                {' '}
                {selected.environment || 'Not specified in the current catalogue description.'}
              </p>
            </div>

            <div className="detail-section">
              <small>EXPERIMENTAL APPROACH</small>
              <p>
                {selected.experimentalApproach || 'Not specified in the current catalogue description.'}
              </p>
            </div>

            <div className="detail-section">
              <small>MATERIALS AND FUELS</small>
              <p>
                {selected.materials || 'Not specified in the current catalogue description.'}
              </p>
            </div>

            <div className="detail-section">
              <small>SCIENTIFIC RELEVANCE</small>
              <p>
                {selected.relevance || 'Not specified in the current catalogue description.'}
              </p>
            </div>

            <div className="detail-section">
              <small>DATA AVAILABILITY</small>
              <p>
                {selected.dataAvailabilityNote || 'Consult the individual NASA PSI record for available research files.'}
              </p>
            </div>

            <div className="chips">
              {(selected.topics || []).map(itemTopic => (
                <small key={itemTopic}>
                  {itemTopic}
                </small>
              ))}
            </div>

            {(() => {
              const relatedScenarioIds =
                INVESTIGATION_SCENARIO_MAP[selected.id] || [];

              if (relatedScenarioIds.length === 0) return null;

              return (
                <div className="detail-section archive-simulator-links">
                  <small>RELATED TRAINING SCENARIOS</small>
                  <p>
                    Explore simulator scenarios connected to this NASA
                    investigation. The scenarios are educational exercises,
                    not reproductions of the original experiments.
                  </p>

                  <div className="archive-scenario-actions">
                    {relatedScenarioIds.map(scenarioId => (
                      <button
                        key={scenarioId}
                        type="button"
                        className="primary"
                        onClick={() => openSimulatorScenario(scenarioId, selected)}
                      >
                        Scenario {String(scenarioId).padStart(2, '0')}: {' '}
                        {SCENARIO_LABELS[scenarioId]}
                        {' '}→
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="warning">
              <Info />

              Catalogue descriptions are not a substitute for
              experimental datasets. Numerical measurements,
              specific conditions and detailed results must be
              verified in the original NASA research files.
            </div>

            {selected.sourceUrl && (
              <a
                className="primary link"
                href={selected.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open NASA source →
              </a>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// APPLICATION ENTRY POINT
// ==========================================

createRoot(document.getElementById('root')).render(
  <App />
);
