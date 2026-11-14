
import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flame,
  Info,
  RotateCcw,
  ShieldAlert,
  Target,
  Wind
} from 'lucide-react';


const scenarios = [
  {
    id: 1,
    archiveIds: ['same', 'same-r'],
    category: 'SMOKE DETECTION',
    title: 'Unexpected aerosol readings',
    subtitle: 'Unusual readings in the storage module',
    description: 'A smoke detector reports an unexpected aerosol signature. The source and material are unknown. What should the analyst investigate first?',
    environment: 'MICROGRAVITY',
    sensor: 'AEROSOL ANOMALY',
    confidence: 'UNCONFIRMED',
    related: 'SAME / SAME-R',
    reference: 'SAME investigates smoke aerosol characteristics relevant to spacecraft fire detection. Different materials can produce different types of smoke particles.',
    options: [
      {
        label: 'Immediately assume there is a fire.',
        correct: false,
        feedback: 'An aerosol reading does not identify its source by itself. The alert must be investigated, not automatically interpreted as a confirmed fire.',
        lesson: 'Detection and identification are different steps. Smoke characterisation helps researchers understand what a detector is measuring.'
      },
      {
        label: 'Investigate the sensor context and aerosol characteristics.',
        correct: true,
        feedback: 'Correct. You are treating the alert seriously while avoiding an unsupported conclusion.',
        lesson: 'SAME studies smoke aerosols to support better understanding of spacecraft smoke detection.'
      },
      {
        label: 'Ignore the alert until a visible flame appears.',
        correct: false,
        feedback: 'Waiting for a visible flame can mean overlooking important early evidence.',
        lesson: 'Fire-safety analysis should consider sensor information, not only visual observations.'
      }
    ]
  },

  {
    id: 2,
    archiveIds: [],
    category: 'SENSOR CHARACTERISATION',
    title: 'Particle sensor validation',
    subtitle: 'A particle instrument gives inconsistent readings',
    description: 'A modified particle-measurement instrument is being evaluated before a smoke experiment. Its readings appear inconsistent. What should the research team do?',
    environment: 'MICROGRAVITY',
    sensor: 'PARTICLE SENSOR',
    confidence: 'VALIDATION PENDING',
    related: 'DAFT / DAFT-2',
    reference: 'DAFT was designed to evaluate a modified P-Trak instrument intended for the Smoke Aerosol Measurement Experiment in the microgravity environment.',
    options: [
      {
        label: 'Accept the readings without checking the instrument.',
        correct: false,
        feedback: 'Unvalidated measurements can lead to incorrect conclusions. The instrument performance needs to be understood first.',
        lesson: 'DAFT focused on instrument feasibility and performance in the microgravity environment.'
      },
      {
        label: 'Check instrument performance and measurement conditions.',
        correct: true,
        feedback: 'Correct. Before interpreting experimental measurements, the team should understand whether the instrument is performing as expected.',
        lesson: 'Measurement quality is essential. An experiment is only as useful as the reliability and context of its observations.'
      },
      {
        label: 'Replace all measurements with estimates.',
        correct: false,
        feedback: 'Estimates cannot replace instrument validation. They may hide the underlying measurement problem.',
        lesson: 'Distinguish measured observations from estimates and assumptions.'
      }
    ]
  },

  {
    id: 3,
    archiveIds: ['saffire-i', 'saffire-ii', 'saffire-iii'],
    category: 'SPACECRAFT FIRE GROWTH',
    title: 'Fire growth in a spacecraft',
    subtitle: 'A fire-safety team evaluates flame spread',
    description: 'A spacecraft design team wants to understand how a larger fire could grow and spread in a low-gravity environment. Which research is especially relevant?',
    environment: 'LOW GRAVITY',
    sensor: 'FIRE GROWTH REVIEW',
    confidence: 'RESEARCH REQUIRED',
    related: 'SAFFIRE I / II / III',
    reference: 'SAFFIRE investigations studied large-scale fire behaviour and flame spread in uncrewed Cygnus cargo vehicles after departure from the International Space Station.',
    options: [
      {
        label: 'Consult SAFFIRE research on spacecraft fire behaviour.',
        correct: true,
        feedback: 'Correct. SAFFIRE is directly relevant to understanding fire growth and flame spread in spacecraft environments.',
        lesson: 'SAFFIRE investigated larger-scale fire behaviour in a spacecraft environment. Its findings should be interpreted within the conditions of each experiment.'
      },
      {
        label: 'Assume a fire will spread exactly as it does in a building.',
        correct: false,
        feedback: 'Building-fire behaviour cannot automatically be transferred to a spacecraft. The environment, airflow and gravity conditions differ.',
        lesson: 'Spacecraft fire research investigates conditions that conventional ground-based tests may not reproduce.'
      },
      {
        label: 'Use only the visible flame size to estimate every risk.',
        correct: false,
        feedback: 'Visible flame size alone is insufficient to characterise fire growth or its consequences.',
        lesson: 'Fire analysis needs multiple observations and knowledge of the experimental conditions.'
      }
    ]
  },

  {
    id: 4,
    archiveIds: ['bass', 'bass-ii'],
    category: 'SOLID FUEL COMBUSTION',
    title: 'Flame spread across a solid',
    subtitle: 'A material sample continues burning',
    description: 'A solid sample is burning under a controlled low-velocity airflow. Researchers need to understand ignition, flame growth, spread and extinction. Which investigation is relevant?',
    environment: 'MICROGRAVITY',
    sensor: 'SOLID FUEL EVENT',
    confidence: 'OBSERVATION ONLY',
    related: 'BASS / BASS-II',
    reference: 'BASS and BASS-II investigate the burning and suppression characteristics of solid fuels. BASS-II includes research on ignition, flame growth, flame spread and extinction limits.',
    options: [
      {
        label: 'Consult research on solid-fuel burning and extinction.',
        correct: true,
        feedback: 'Correct. BASS and BASS-II investigate the behaviour of solid fuels under reduced-gravity conditions.',
        lesson: 'Solid-fuel behaviour depends on material properties and experimental conditions, including airflow and oxygen concentration.'
      },
      {
        label: 'Assume every solid material burns in the same way.',
        correct: false,
        feedback: 'Different materials can have different combustion characteristics. A general assumption is not scientifically justified.',
        lesson: 'Material selection for spacecraft requires evidence about the specific materials and conditions.'
      },
      {
        label: 'Conclude that no flame spread is possible in microgravity.',
        correct: false,
        feedback: 'Microgravity changes combustion behaviour, but it does not mean that solid materials cannot burn or that flame spread is impossible.',
        lesson: 'BASS-II specifically investigates solid-fuel ignition, growth, spread and extinction in microgravity.'
      }
    ]
  },

  {
    id: 5,
    archiveIds: ['bass-ii'],
    category: 'MATERIAL FLAMMABILITY',
    title: 'Evaluating a ground-based test',
    subtitle: 'Can an Earth test predict spacecraft flammability?',
    description: 'An engineer wants to use a normal-gravity material flammability test to make a conclusion about spacecraft safety. What is the best scientific approach?',
    environment: 'GROUND / SPACE COMPARISON',
    sensor: 'TEST METHOD REVIEW',
    confidence: 'TRANSFER NOT PROVEN',
    related: 'ACME BRE / BASS-II',
    reference: 'ACME Burning Rate Emulator investigates material flammability and the relevance of existing test methods in low and partial gravity. BASS-II also examines relationships between normal-gravity tests and microgravity behaviour.',
    options: [
      {
        label: 'Assume that a ground test guarantees spacecraft safety.',
        correct: false,
        feedback: 'A normal-gravity test does not automatically establish how a material will behave in microgravity.',
        lesson: 'The relevance and limitations of a test method must be evaluated for the environment in which it will be applied.'
      },
      {
        label: 'Compare test conditions and consult microgravity evidence.',
        correct: true,
        feedback: 'Correct. A comparison should account for gravity, airflow, oxygen concentration, temperature and material properties.',
        lesson: 'ACME BRE and BASS-II address questions about material flammability and the applicability of existing test methods.'
      },
      {
        label: 'Discard all normal-gravity research.',
        correct: false,
        feedback: 'Ground-based research can still be useful. The important point is to understand its limits and validate its relevance.',
        lesson: 'Scientific comparison is more useful than accepting or rejecting evidence without examining its conditions.'
      }
    ]
  },

  {
    id: 6,
    archiveIds: ['flex'],
    category: 'FLAME EXTINGUISHMENT',
    title: 'Evaluating a gaseous suppressant',
    subtitle: 'A team reviews a fire-suppression concept',
    description: 'A mission-design team wants to understand how gaseous suppressants affect liquid-fuel flames in microgravity. Which investigation should they consult?',
    environment: 'MICROGRAVITY',
    sensor: 'SUPPRESSION REVIEW',
    confidence: 'NOT EVALUATED',
    related: 'FLEX',
    reference: 'FLEX investigates flame extinguishment, liquid-fuel flammability limits and the effectiveness of gaseous fire suppressants in microgravity.',
    options: [
      {
        label: 'Consult FLEX and examine the actual test conditions.',
        correct: true,
        feedback: 'Correct. FLEX is relevant to the study of flame extinguishment and gaseous suppressant effectiveness.',
        lesson: 'A research result must be interpreted in relation to the fuel, suppressant and conditions actually tested.'
      },
      {
        label: 'Assume all suppressants work equally well.',
        correct: false,
        feedback: 'Suppressant effectiveness can depend on the combustion conditions and the suppressant itself.',
        lesson: 'Do not generalise a result beyond the conditions in which it was obtained.'
      },
      {
        label: 'Choose a suppressant using only Earth-based observations.',
        correct: false,
        feedback: 'Earth-based observations alone may not answer a microgravity research question.',
        lesson: 'FLEX provides relevant evidence from microgravity experiments, but it does not replace mission-specific validation.'
      }
    ]
  },

  {
    id: 7,
    archiveIds: ['flex-2'],
    category: 'DROPLET COMBUSTION',
    title: 'Liquid droplet behaviour',
    subtitle: 'A burning droplet behaves unexpectedly',
    description: 'Researchers observe a liquid-fuel droplet and want to understand its burning rate, evaporation and soot formation. Which research is most relevant?',
    environment: 'MICROGRAVITY',
    sensor: 'DROPLET OBSERVATION',
    confidence: 'ANALYSIS REQUIRED',
    related: 'FLEX-2',
    reference: 'FLEX-2 investigated liquid-fuel droplet combustion, including burning rates, soot formation conditions and fuel-mixture evaporation.',
    options: [
      {
        label: 'Consult FLEX-2 droplet combustion research.',
        correct: true,
        feedback: 'Correct. FLEX-2 is relevant to the behaviour of liquid-fuel droplets and the processes that occur before and during combustion.',
        lesson: 'Droplet combustion research helps scientists understand evaporation, burning and soot formation under microgravity conditions.'
      },
      {
        label: 'Treat the droplet as if it were a solid fuel.',
        correct: false,
        feedback: 'Liquid droplets and solid fuels have different physical and combustion characteristics.',
        lesson: 'Choose research that matches the physical form of the fuel being studied.'
      },
      {
        label: 'Assume soot formation is identical for every fuel.',
        correct: false,
        feedback: 'Soot formation depends on fuel properties and combustion conditions.',
        lesson: 'FLEX-2 investigates how fuel and experimental conditions affect droplet combustion and soot formation.'
      }
    ]
  },

  {
    id: 8,
    archiveIds: ['flex'],
    category: 'COOL FLAME PHENOMENA',
    title: 'Combustion without visible flame',
    subtitle: 'A visible flame disappears, but reactions continue',
    description: 'During an experiment, the visible flame disappears. However, the research team wants to determine whether chemical reactions may continue. What should they consider?',
    environment: 'MICROGRAVITY',
    sensor: 'FLAME VISIBILITY CHANGE',
    confidence: 'CHEMICAL STATE UNKNOWN',
    related: 'FLEX / CFI',
    reference: 'NASA reports that FLEX research contributed to the discovery of cool flames, in which fuel can continue reacting under certain conditions after the visible flame disappears. CFI investigates cool-flame phenomena.',
    options: [
      {
        label: 'Conclude that all combustion has stopped.',
        correct: false,
        feedback: 'The disappearance of a visible flame does not necessarily prove that all chemical reactions have stopped.',
        lesson: 'Visible flame and chemical reaction are not always equivalent. Cool-flame phenomena demonstrate why further analysis may be necessary.'
      },
      {
        label: 'Consider cool-flame phenomena and investigate further.',
        correct: true,
        feedback: 'Correct. The team should distinguish the disappearance of visible flame from the possibility of continued chemical reactions.',
        lesson: 'NASA describes cool flames associated with FLEX research and investigates cool-flame behaviour through CFI.'
      },
      {
        label: 'Assume the sensor must be malfunctioning.',
        correct: false,
        feedback: 'A sensor issue is one possibility, but it should not be assumed without evidence.',
        lesson: 'Scientific interpretation requires checking observations and considering alternative explanations.'
      }
    ]
  },

  {
    id: 9,
    archiveIds: ['acme-s-flames', 'slice', 'spice'],
    category: 'GASEOUS FLAME SCIENCE',
    title: 'Understanding flame stability',
    subtitle: 'A gaseous flame changes its structure',
    description: 'A research team observes changes in the structure and stability of a gaseous diffusion flame. Which research areas could help explain the phenomenon?',
    environment: 'MICROGRAVITY',
    sensor: 'FLAME STRUCTURE',
    confidence: 'ANALYSIS REQUIRED',
    related: 'ACME / SLICE',
    reference: 'ACME includes investigations of gaseous non-premixed flames, including flame stability, extinction limits and soot-related processes. SLICE studied coflow laminar diffusion flames.',
    options: [
      {
        label: 'Consult gaseous flame structure and stability research.',
        correct: true,
        feedback: 'Correct. ACME and SLICE provide relevant research contexts for understanding gaseous diffusion flames.',
        lesson: 'Flame structure, stability and extinction are important combustion topics. Their behaviour depends on the conditions of the experiment.'
      },
      {
        label: 'Assume gaseous flames behave like solid-fuel flames.',
        correct: false,
        feedback: 'Gaseous and solid fuels involve different combustion processes. Their findings should not be treated as interchangeable.',
        lesson: 'Identify the fuel type and combustion configuration before selecting relevant research.'
      },
      {
        label: 'Ignore changes in flame structure.',
        correct: false,
        feedback: 'Changes in flame structure may contain important information about stability and combustion conditions.',
        lesson: 'Careful observation and appropriate measurements are essential to understanding combustion phenomena.'
      }
    ]
  }
];


function FireVisual() {
  return (
    <div className="sim2-visual">
      <div className="sim2-orbit" />
      <div className="sim2-core">
        <Flame size={48} />
      </div>
      <small>MICROGRAVITY · CONCEPTUAL VISUAL</small>
    </div>
  );
}

const STORAGE_KEY = 'fire-marshal-orbital-results-v1';

function loadResults() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function Simulator({
  initialScenarioId = null,
  linkedInvestigation = null,
  onOpenInvestigation = null
}) {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [choice, setChoice] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState(loadResults);
  const [showReport, setShowReport] = useState(false);

  const scenario = scenarios[scenarioIndex];
  const selectedOption =
    choice === null ? null : scenario.options[choice];

  // Open a scenario selected from the Research Archive.
  useEffect(() => {
    if (initialScenarioId === null || initialScenarioId === undefined) return;

    const targetIndex = scenarios.findIndex(
      item => item.id === Number(initialScenarioId)
    );

    if (targetIndex !== -1) {
      setScenarioIndex(targetIndex);
      setShowReport(false);
    }
  }, [initialScenarioId]);

  const linkedRecordMatchesScenario =
    linkedInvestigation &&
    (scenario.archiveIds || []).includes(linkedInvestigation.id);

  // Save progress automatically in the browser
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch (error) {
      console.error('Could not save simulator results:', error);
    }
  }, [answers]);

  // Restore an existing answer when revisiting a scenario
  useEffect(() => {
    const savedAnswer = answers[scenario.id];

    if (savedAnswer) {
      setChoice(savedAnswer.choice);
      setSubmitted(true);
    } else {
      setChoice(null);
      setSubmitted(false);
    }
  }, [scenarioIndex, answers, scenario.id]);

  // Performance calculations
  const answeredScenarios = scenarios.filter(
    item => answers[item.id] !== undefined
  );

  const correctCount = answeredScenarios.filter(
    item => answers[item.id].correct
  ).length;

  const incorrectCount = answeredScenarios.length - correctCount;

  const unansweredCount = scenarios.length - answeredScenarios.length;

  const accuracy = answeredScenarios.length > 0
    ? Math.round((correctCount / answeredScenarios.length) * 100)
    : 0;

  const completion = Math.round(
    (answeredScenarios.length / scenarios.length) * 100
  );

  // Navigate between scenarios
  function changeScenario(index) {
    setShowReport(false);

    const safeIndex = Math.max(
      0,
      Math.min(index, scenarios.length - 1)
    );

    setScenarioIndex(safeIndex);
  }

  function submitDecision() {
    if (choice === null || submitted) return;

    const isCorrect = scenario.options[choice].correct;

    setAnswers(current => ({
      ...current,
      [scenario.id]: {
        choice,
        correct: isCorrect,
        completedAt: new Date().toISOString()
      }
    }));

    setSubmitted(true);
  }

  function nextScenario() {
    if (scenarioIndex < scenarios.length - 1) {
      changeScenario(scenarioIndex + 1);
    } else {
      setShowReport(true);
    }
  }

  function previousScenario() {
    if (showReport) {
      setShowReport(false);
      return;
    }

    if (scenarioIndex > 0) {
      changeScenario(scenarioIndex - 1);
    }
  }

  function retryScenario(index = scenarioIndex) {
    const scenarioToRetry = scenarios[index];

    setAnswers(current => {
      const updated = { ...current };
      delete updated[scenarioToRetry.id];
      return updated;
    });

    setChoice(null);
    setSubmitted(false);
    setShowReport(false);
    setScenarioIndex(index);
  }

  function startNewMission() {
    setAnswers({});
    setChoice(null);
    setSubmitted(false);
    setScenarioIndex(0);
    setShowReport(false);
  }

  function getPerformance() {
    if (answeredScenarios.length === 0) {
      return {
        title: 'No results yet',
        description: 'Complete the scenarios to receive your learning assessment.',
        level: 'neutral'
      };
    }

    if (accuracy >= 80) {
      return {
        title: 'Excellent performance',
        description: 'You demonstrated strong evidence-based reasoning across the scenarios you answered.',
        level: 'excellent'
      };
    }

    if (accuracy >= 60) {
      return {
        title: 'Good progress',
        description: 'You understand several important concepts. Review the scenarios you missed to strengthen your scientific reasoning.',
        level: 'good'
      };
    }

    return {
      title: 'Further study recommended',
      description: 'Your results suggest that some combustion concepts need more attention. Review the explanations and try the mission again.',
      level: 'review'
    };
  }

  // ========================================
  // FINAL LEARNING REPORT
  // ========================================

  if (showReport) {
    const performance = getPerformance();

    const missedScenarios = scenarios.filter(item => {
      const result = answers[item.id];
      return result && !result.correct;
    });

    const unansweredScenarios = scenarios.filter(
      item => !answers[item.id]
    );

    return (
      <div className="layout sim2-layout">
        <section className="panel sim2-panel sim2-report">

          <div className="sim2-report-header">
            <div>
              <small>MISSION DEBRIEF / LEARNING ASSESSMENT</small>
              <h2>
                <Target /> Mission Performance Report
              </h2>
              <p>
                Your results and learning progress from the
                combustion science training simulation.
              </p>
            </div>

            <span className="sim2-counter">
              FINAL REPORT
            </span>
          </div>

          <div className={`sim2-performance ${performance.level}`}>
            <div className="sim2-performance-icon">
              {accuracy >= 80 ? (
                <CheckCircle2 size={32} />
              ) : (
                <Target size={32} />
              )}
            </div>

            <div>
              <small>OVERALL PERFORMANCE</small>
              <h3>{performance.title}</h3>
              <p>{performance.description}</p>
            </div>
          </div>

          <div className="sim2-score">
            <div>
              <small>ACCURACY</small>
              <strong>{accuracy}%</strong>
              <span>Of answered scenarios</span>
            </div>

            <div>
              <small>CORRECT</small>
              <strong className="positive">{correctCount}</strong>
              <span>Correct decisions</span>
            </div>

            <div>
              <small>INCORRECT</small>
              <strong className="negative">{incorrectCount}</strong>
              <span>Decisions to review</span>
            </div>

            <div>
              <small>COMPLETION</small>
              <strong>{completion}%</strong>
              <span>{answeredScenarios.length} of {scenarios.length} answered</span>
            </div>
          </div>

          <div className="sim2-report-section">
            <div className="sim2-report-section-heading">
              <h3>Scenario performance</h3>
              <span>{scenarios.length} scenarios</span>
            </div>

            <div className="sim2-results-list">
              {scenarios.map((item, index) => {
                const result = answers[item.id];

                return (
                  <div className="sim2-result-row" key={item.id}>
                    <div className="sim2-result-number">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div className="sim2-result-info">
                      <b>{item.title}</b>
                      <small>{item.category}</small>
                    </div>

                    <div className="sim2-result-status">
                      {!result ? (
                        <span className="pending">
                          Not answered
                        </span>
                      ) : result.correct ? (
                        <span className="passed">
                          <CheckCircle2 size={14} />
                          Correct
                        </span>
                      ) : (
                        <span className="failed">
                          <AlertTriangle size={14} />
                          Review
                        </span>
                      )}
                    </div>

                    <button
                      className="sim2-review-button"
                      onClick={() => changeScenario(index)}
                    >
                      Review
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {missedScenarios.length > 0 && (
            <div className="sim2-report-section">
              <h3>
                <AlertTriangle size={17} />
                Concepts to reinforce
              </h3>

              <p className="sim2-report-intro">
                Review the explanations from these scenarios
                to improve your understanding.
              </p>

              {missedScenarios.map(item => (
                <div className="sim2-recommendation" key={item.id}>
                  <b>{item.title}</b>
                  <p>{answers[item.id].correct
                    ? ''
                    : item.options.find(option => option.correct)?.lesson}
                  </p>
                  <button
                    onClick={() => retryScenario(
                      scenarios.findIndex(s => s.id === item.id)
                    )}
                  >
                    Retry this scenario →
                  </button>
                </div>
              ))}
            </div>
          )}

          {unansweredScenarios.length > 0 && (
            <div className="sim2-incomplete">
              <Info size={17} />
              <p>
                You have {unansweredCount} unanswered scenario(s).
                Complete them to obtain a full mission assessment.
              </p>
            </div>
          )}

          {answeredScenarios.length === scenarios.length && (
            <div className="sim2-complete">
              <CheckCircle2 size={18} />
              All scenarios completed. Your mission assessment is complete.
            </div>
          )}

          <div className="sim2-report-actions">
            <button onClick={() => changeScenario(0)}>
              <ArrowLeft size={15} />
              Back to simulator
            </button>

            <button
              className="primary"
              onClick={startNewMission}
            >
              <RotateCcw size={15} />
              Start new mission
            </button>
          </div>

          <div className="warning">
            <Info size={16} />
            This assessment measures performance in an educational
            simulation. It is not a professional certification or
            a measure of real emergency-response competence.
          </div>

        </section>

        <aside className="panel sim2-sidebar">
          <small>LEARNING SUMMARY</small>

          <div className="sim2-sidebar-section">
            <small>YOUR ACCURACY</small>
            <div className="sim2-report-big">
              {accuracy}%
            </div>

            <div className="sim2-mini-progress">
              <span style={{ width: `${accuracy}%` }} />
            </div>
          </div>

          <div className="sim2-sidebar-section">
            <small>RESEARCH AREAS PRACTISED</small>
            {[
              'Smoke and aerosols',
              'Sensor validation',
              'Fire growth',
              'Solid fuel combustion',
              'Material flammability',
              'Flame suppression',
              'Droplet combustion',
              'Cool flames',
              'Gaseous flame science'
            ].map((item, index) => (
              <div className="sim2-learning-item" key={index}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {item}
              </div>
            ))}
          </div>
        </aside>
      </div>
    );
  }

  // ========================================
  // ACTIVE SIMULATOR
  // ========================================

  return (
    <div className="layout sim2-layout">

      <section className="panel simulator sim2-panel">

        <div className="sim2-topline">
          <div>
            <small>TRAINING MODULE / 03</small>
            <h2>
              <Target /> Emergency Simulator
            </h2>
          </div>

          <span className="sim2-counter">
            {String(scenarioIndex + 1).padStart(2, '0')} / {String(scenarios.length).padStart(2, '0')}
          </span>
        </div>

        <div className="sim2-progress">
          {scenarios.map((item, index) => {
            const result = answers[item.id];

            return (
              <button
                key={item.id}
                className={[
                  index === scenarioIndex ? 'current' : '',
                  result ? (result.correct ? 'completed' : 'missed') : ''
                ].join(' ')}
                onClick={() => changeScenario(index)}
                title={`Scenario ${index + 1}`}
                aria-label={`Open scenario ${index + 1}`}
              />
            );
          })}
        </div>

        {linkedRecordMatchesScenario && (
          <div className="sim2-related sim2-archive-context">
            <span>OPENED FROM RESEARCH ARCHIVE</span>
            <b>{linkedInvestigation.acronym} · {linkedInvestigation.title}</b>
            <p>
              This training scenario is connected to the investigation
              selected in the scientific archive.
            </p>
            {onOpenInvestigation && (
              <button
                type="button"
                className="sim2-report-link"
                onClick={() => onOpenInvestigation(linkedInvestigation.id)}
              >
                Return to investigation <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}

        <FireVisual />

        <div className="sim2-scenario-label">
          SCENARIO {String(scenario.id).padStart(2, '0')} · {scenario.category}
        </div>

        <h3 className="sim2-title">
          {scenario.subtitle}
        </h3>

        <p className="sim2-description">
          {scenario.description}
        </p>

        <div className="sim2-options">
          {scenario.options.map((option, index) => {
            let stateClass = '';

            if (choice === index) {
              stateClass = 'selected';
            }

            if (submitted && option.correct) {
              stateClass = 'correct';
            } else if (
              submitted &&
              choice === index &&
              !option.correct
            ) {
              stateClass = 'incorrect';
            }

            return (
              <button
                key={index}
                className={`choice sim2-choice ${stateClass}`}
                onClick={() => {
                  if (!submitted) setChoice(index);
                }}
                disabled={submitted}
              >
                <b>{String.fromCharCode(65 + index)}</b>
                <span>{option.label}</span>

                {submitted && option.correct && (
                  <CheckCircle2
                    className="sim2-option-icon"
                    size={17}
                  />
                )}

                {submitted && choice === index && !option.correct && (
                  <AlertTriangle
                    className="sim2-option-icon"
                    size={17}
                  />
                )}
              </button>
            );
          })}
        </div>

        {!submitted ? (
          <button
            className="primary sim2-submit"
            disabled={choice === null}
            onClick={submitDecision}
          >
            Submit decision <ArrowRight size={15} />
          </button>
        ) : (
          <div className={`sim2-debrief ${selectedOption.correct ? 'success' : 'review'}`}>
            <div className="sim2-result-heading">
              {selectedOption.correct ? (
                <CheckCircle2 size={20} />
              ) : (
                <AlertTriangle size={20} />
              )}

              <b>
                {selectedOption.correct
                  ? 'Good evidence-based decision'
                  : 'Decision needs review'}
              </b>
            </div>

            <p>{selectedOption.feedback}</p>

            <div className="sim2-lesson">
              <b>
                <Info size={15} /> SCIENTIFIC TAKEAWAY
              </b>
              <p>{selectedOption.lesson}</p>
            </div>

            <div className="sim2-related">
              <span>RELATED NASA RESEARCH</span>
              <b>{scenario.related}</b>
              <p>{scenario.reference}</p>
              {(scenario.archiveIds || []).length > 0 && onOpenInvestigation && (
                <button
                  type="button"
                  className="sim2-report-link"
                  onClick={() => onOpenInvestigation(scenario.archiveIds[0])}
                >
                  Explore related archive record <ArrowRight size={14} />
                </button>
              )}
              {(scenario.archiveIds || []).length === 0 && (
                <small>
                  The related DAFT investigations are not currently included
                  in this project's research archive.
                </small>
              )}
            </div>
          </div>
        )}

        <div className="sim2-navigation">
          <button
            onClick={previousScenario}
            disabled={scenarioIndex === 0}
          >
            <ArrowLeft size={14} /> Previous
          </button>

          <button onClick={() => retryScenario()}>
            <RotateCcw size={14} /> Retry scenario
          </button>

          <button onClick={nextScenario}>
            {scenarioIndex === scenarios.length - 1
              ? 'View mission report'
              : 'Next scenario'}
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="sim2-session-progress">
          <div>
            <small>MISSION COMPLETION</small>
            <b>{answeredScenarios.length} / {scenarios.length}</b>
          </div>

          <div className="sim2-mini-progress">
            <span style={{ width: `${completion}%` }} />
          </div>
        </div>

        <div className="warning">
          <Info size={16} />
          Educational simulation only. This is not a validated fire
          model, spacecraft procedure or real emergency-response system.
        </div>

      </section>

      <aside className="panel sim2-sidebar">

        <small>MISSION TELEMETRY</small>

        <div className="sim2-status">
          <span className="sim2-status-dot" />
          TRAINING SIMULATION ACTIVE
        </div>

        <div className="telemetry">
          <Wind />
          ENVIRONMENT
          <b>{scenario.environment}</b>
        </div>

        <div className="telemetry">
          <Activity />
          SENSOR / EVENT
          <b>{scenario.sensor}</b>
        </div>

        <div className="telemetry">
          <ShieldAlert />
          CONFIDENCE
          <b>{scenario.confidence}</b>
        </div>

        <div className="sim2-sidebar-section">
          <small>YOUR PERFORMANCE</small>

          <div className="sim2-progress-text">
            <b>{correctCount}</b>
            <span>correct decisions</span>
          </div>

          <div className="sim2-mini-progress">
            <span
              style={{
                width: `${answeredScenarios.length
                  ? (correctCount / answeredScenarios.length) * 100
                  : 0}%`
              }}
            />
          </div>

          <div className="sim2-stats-row">
            <span>Correct: {correctCount}</span>
            <span>Incorrect: {incorrectCount}</span>
          </div>
        </div>

        <div className="sim2-sidebar-section">
          <small>RESEARCH CONNECTION</small>

          <h3>{scenario.related}</h3>

          <p>
            This scenario is linked to the NASA research named above.
            Archive records available in this project can be opened from
            the scenario debrief. Consult the original NASA record before
            making scientific or operational claims.
          </p>
        </div>

        <div className="sim2-sidebar-note">
          <Info size={15} />
          <span>
            Telemetry values are illustrative labels, not live
            spacecraft sensor readings.
          </span>
        </div>

        <button
          className="sim2-report-link"
          onClick={() => setShowReport(true)}
        >
          Open learning report <ArrowRight size={14} />
        </button>

      </aside>
    </div>
  );
}

export default Simulator;
