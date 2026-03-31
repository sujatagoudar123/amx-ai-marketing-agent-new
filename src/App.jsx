import { useState, useCallback, useRef, useEffect } from 'react';
import { downloadPDFReport } from './utils/pdfReport.js';
import { AGENT_ORDER, scoreColor, scoreBg, GRADE_COLOR, CATEGORY_COLOR } from './utils/constants.js';

/* ─── API ────────────────────────────────────────────────────── */
async function runAudit(url) {
  const res = await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Server error ${res.status}`);
  }
  return res.json();
}

/* ─── ScoreArc ────────────────────────────────────────────────── */
function ScoreArc({ score, size = 130 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const dur = 1400;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(ease * score));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [score]);

  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const stroke = size * 0.065;
  const pct = val / 100;
  const offset = circ - pct * circ;
  const col = scoreColor(score);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={col} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${col}55)`, transition: 'stroke-dashoffset 0.02s' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{
          fontFamily: 'var(--serif)', fontWeight: 900,
          fontSize: size * 0.24, color: col, lineHeight: 1,
          textShadow: `0 0 24px ${col}44`
        }}>{val}</span>
        <span style={{ fontSize: size * 0.09, color: 'var(--paper-4)', fontFamily: 'var(--mono)', marginTop: 2 }}>/100</span>
      </div>
    </div>
  );
}

/* ─── MiniBar ─────────────────────────────────────────────────── */
function MiniBar({ score, animated = true }) {
  const col = scoreColor(score);
  return (
    <div style={{ height: 3, background: 'var(--ink-5)', borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
      <div style={{
        height: '100%', borderRadius: 2, background: col,
        width: animated ? `${score}%` : '0%',
        transition: animated ? 'width 1.2s cubic-bezier(0.4,0,0.2,1)' : 'none',
        boxShadow: `0 0 6px ${col}60`,
      }} />
    </div>
  );
}

/* ─── Tag ─────────────────────────────────────────────────────── */
function Tag({ children, color = 'var(--gold)', size = 'sm' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: size === 'sm' ? '2px 8px' : '4px 12px',
      borderRadius: 4,
      background: `${color}18`,
      border: `1px solid ${color}35`,
      color,
      fontFamily: 'var(--mono)',
      fontSize: size === 'sm' ? 11 : 13,
      fontWeight: 600,
      letterSpacing: '0.04em',
    }}>{children}</span>
  );
}

/* ─── ListBlock ───────────────────────────────────────────────── */
function ListBlock({ title, items = [], accent, icon }) {
  if (!items.length) return null;
  return (
    <div>
      <div style={{
        fontSize: 10, fontFamily: 'var(--mono)', color: accent,
        letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10,
      }}>{icon} {title}</div>
      <ul style={{ listStyle: 'none' }}>
        {items.map((item, i) => (
          <li key={i} style={{
            display: 'flex', gap: 8, padding: '6px 0',
            borderBottom: '1px solid var(--border)',
            fontSize: 13, color: 'var(--paper-2)', lineHeight: 1.5,
          }}>
            <span style={{ color: accent, flexShrink: 0, marginTop: 1 }}>→</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── AgentCard ───────────────────────────────────────────────── */
function AgentCard({ agentKey, data, index }) {
  const [open, setOpen] = useState(false);
  const col = scoreColor(data.score);
  const cat = data.category || '';
  const catColor = CATEGORY_COLOR[cat] || 'var(--paper-4)';

  const extraInsight = data.pr_angle || data.top_story_angle || data.competitive_gap ||
    data.authority_gap || data.funnel_gap || data.growth_lever ||
    data.positioning_opportunity || data.revenue_impact ||
    data.top_keyword_opportunity || data.brand_archetype || data.key_insight || '';

  return (
    <div
      className={`fade-up fade-up-${Math.min(index + 1, 5)}`}
      style={{
        background: 'var(--ink-2)',
        border: `1px solid var(--border)`,
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hi)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Header row */}
      <div
        onClick={() => setOpen(x => !x)}
        style={{
          padding: '20px 24px', display: 'flex',
          alignItems: 'center', gap: 16, cursor: 'pointer',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: scoreBg(data.score),
          border: `1px solid ${col}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>{data.icon || '📊'}</div>

        {/* Middle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 15, color: 'var(--paper)' }}>
              {data.agent}
            </span>
            {cat && <Tag color={catColor} size="sm">{cat}</Tag>}
            <Tag color={GRADE_COLOR[data.grade] || 'var(--paper-4)'} size="sm">{data.grade}</Tag>
          </div>
          <p style={{
            fontSize: 12.5, color: 'var(--paper-3)', lineHeight: 1.45,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          }}>{data.summary}</p>
          <MiniBar score={data.score} />
        </div>

        {/* Score */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'var(--serif)', fontWeight: 900,
            fontSize: 32, color: col, lineHeight: 1,
            textShadow: `0 0 20px ${col}40`,
          }}>{data.score}</div>
          <div style={{ fontSize: 10, color: 'var(--paper-4)', fontFamily: 'var(--mono)' }}>/100</div>
        </div>

        {/* Chevron */}
        <div style={{
          color: 'var(--paper-4)', fontSize: 18,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.3s ease', marginLeft: 8, flexShrink: 0,
        }}>▾</div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', animation: 'fadeIn 0.2s ease' }}>
          {/* Summary paragraph */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13.5, color: 'var(--paper-2)', lineHeight: 1.7, fontStyle: 'italic' }}>
              {data.summary}
            </p>
          </div>

          {/* 3-col lists */}
          <div style={{
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 24,
          }}>
            <ListBlock title="STRENGTHS" icon="✓" items={data.strengths} accent="var(--green)" />
            <ListBlock title="IMPROVEMENTS" icon="↑" items={data.improvements} accent="var(--amber)" />
            <ListBlock title="QUICK WINS" icon="⚡" items={data.quick_wins} accent="var(--gold)" />
          </div>

          {/* Key insight */}
          {extraInsight && (
            <div style={{
              margin: '0 24px 20px',
              background: `${col}08`,
              border: `1px solid ${col}25`,
              borderRadius: 'var(--r-lg)',
              padding: '14px 18px',
            }}>
              <div style={{
                fontSize: 10, fontFamily: 'var(--mono)',
                color: col, letterSpacing: '0.1em',
                fontWeight: 600, marginBottom: 6,
              }}>◈ KEY INSIGHT</div>
              <p style={{ fontSize: 13, color: 'var(--paper)', lineHeight: 1.65 }}>{extraInsight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── SummaryPanel ────────────────────────────────────────────── */
function SummaryPanel({ result, onDownload, downloading }) {
  const sorted = AGENT_ORDER
    .filter(k => result.agents[k])
    .map(k => ({ key: k, ...result.agents[k] }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="fade-up" style={{
      background: 'var(--ink-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      {/* Gold top bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, var(--gold), var(--gold-2), transparent)' }} />

      <div style={{ padding: '28px 32px' }}>
        {/* Top section */}
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 28 }}>
          <ScoreArc score={result.overall_score} size={140} />

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{
              fontSize: 10, fontFamily: 'var(--mono)',
              color: 'var(--paper-4)', letterSpacing: '0.12em', marginBottom: 6,
            }}>OVERALL MARKETING HEALTH SCORE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 10 }}>
              <span style={{
                fontFamily: 'var(--serif)', fontWeight: 900,
                fontSize: 52, color: 'var(--paper)', lineHeight: 1,
                letterSpacing: '-0.02em',
              }}>{result.overall_grade}</span>
              <div>
                <div style={{ fontSize: 14, color: 'var(--paper-2)', fontWeight: 500 }}>
                  {result.url.replace(/^https?:\/\//, '')}
                </div>
                <div style={{
                  fontSize: 11, color: 'var(--paper-4)',
                  fontFamily: 'var(--mono)', marginTop: 2,
                }}>
                  {result.agent_count} agents · {result.duration_seconds}s ·{' '}
                  {result.cached ? '⚡ cached' : '🔄 live analysis'}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--paper-3)', lineHeight: 1.6, maxWidth: 400 }}>
              Analysed across 10 specialist dimensions by Claude Opus.
              Overall performance is{' '}
              <strong style={{ color: scoreColor(result.overall_score) }}>
                {result.overall_score >= 75 ? 'strong' : result.overall_score >= 60 ? 'moderate' : 'needs work'}
              </strong>{' '}
              relative to industry baseline.
            </p>
          </div>

          {/* Download button */}
          <button
            onClick={onDownload}
            disabled={downloading}
            style={{
              alignSelf: 'flex-start',
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 22px',
              background: downloading ? 'var(--ink-4)' : 'var(--gold)',
              color: downloading ? 'var(--paper-4)' : 'var(--ink)',
              border: 'none', borderRadius: 'var(--r-lg)',
              fontFamily: 'var(--serif)', fontWeight: 700,
              fontSize: 14, cursor: downloading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
              boxShadow: downloading ? 'none' : '0 4px 20px rgba(201,168,76,0.3)',
            }}
          >
            {downloading ? (
              <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Generating…</>
            ) : (
              <><span>↓</span> Download PDF Report</>
            )}
          </button>
        </div>

        {/* Mini score grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8, marginBottom: 24,
        }}>
          {AGENT_ORDER.filter(k => result.agents[k]).map(k => {
            const ag = result.agents[k];
            const col = scoreColor(ag.score);
            return (
              <div key={k} style={{
                background: scoreBg(ag.score),
                border: `1px solid ${col}25`,
                borderRadius: 'var(--r-lg)',
                padding: '10px 8px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, marginBottom: 3 }}>{ag.icon}</div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 16, color: col }}>{ag.score}</div>
                <div style={{ fontSize: 9, color: 'var(--paper-4)', marginTop: 2 }}>{ag.grade}</div>
              </div>
            );
          })}
        </div>

        {/* Top/bottom split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{
            background: 'var(--green-dim)', border: '1px solid rgba(86,201,138,0.15)',
            borderRadius: 'var(--r-lg)', padding: '14px 16px',
          }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--green)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>
              ▲ STRONGEST DIMENSIONS
            </div>
            {sorted.slice(0, 3).map(a => (
              <div key={a.key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '5px 0', borderBottom: '1px solid rgba(86,201,138,0.08)',
                fontSize: 12.5,
              }}>
                <span style={{ color: 'var(--paper-3)' }}>{a.icon} {a.agent}</span>
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--green)', fontWeight: 700 }}>{a.score}</span>
              </div>
            ))}
          </div>
          <div style={{
            background: 'var(--amber-dim)', border: '1px solid rgba(232,168,58,0.15)',
            borderRadius: 'var(--r-lg)', padding: '14px 16px',
          }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--amber)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>
              ↓ PRIORITY FOCUS AREAS
            </div>
            {sorted.slice(-3).reverse().map(a => (
              <div key={a.key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '5px 0', borderBottom: '1px solid rgba(232,168,58,0.08)',
                fontSize: 12.5,
              }}>
                <span style={{ color: 'var(--paper-3)' }}>{a.icon} {a.agent}</span>
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--amber)', fontWeight: 700 }}>{a.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Loading ─────────────────────────────────────────────────── */
function LoadingScreen({ url }) {
  const steps = [
    { icon: '✍️', label: 'Content & Messaging' },
    { icon: '🎯', label: 'Conversion & UX' },
    { icon: '🔍', label: 'SEO & Discoverability' },
    { icon: '⚔️', label: 'Competitive Positioning' },
    { icon: '🏆', label: 'Brand & Trust' },
    { icon: '📰', label: 'PR & Media Readiness' },
    { icon: '⭐', label: 'Social Proof & Authority' },
    { icon: '📈', label: 'Demand Generation' },
    { icon: '💡', label: 'Thought Leadership' },
    { icon: '🚀', label: 'Growth & Partnerships' },
  ];
  const [done, setDone] = useState([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cur = 0;
    const iv = setInterval(() => {
      if (cur < steps.length - 1) {
        setDone(d => [...d, cur]);
        cur++;
        setActive(cur);
      }
    }, 2400);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '64px 20px', maxWidth: 600, margin: '0 auto' }}>
      {/* Spinning ring */}
      <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 32px' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid var(--ink-5)',
          borderTop: '2px solid var(--gold)',
          animation: 'spin 0.9s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 8, borderRadius: '50%',
          border: '1px solid var(--ink-4)',
          borderTop: '1px solid var(--gold-2)',
          animation: 'spin 1.4s linear infinite reverse',
        }} />
      </div>

      <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--paper-4)', letterSpacing: '0.14em', marginBottom: 8 }}>
        DEPLOYING 10 SPECIALIST AGENTS
      </div>
      <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 22, color: 'var(--paper)', marginBottom: 6 }}>
        Auditing {url.replace(/^https?:\/\//, '')}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--paper-4)', marginBottom: 40 }}>
        Parallel AI analysis — typically 25–45 seconds
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'left' }}>
        {steps.map((s, i) => {
          const isDone = done.includes(i);
          const isActive = active === i;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              background: isDone ? 'rgba(86,201,138,0.07)' : isActive ? 'var(--gold-dim)' : 'var(--ink-2)',
              border: `1px solid ${isDone ? 'rgba(86,201,138,0.2)' : isActive ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--r-lg)',
              transition: 'all 0.4s ease',
            }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <span style={{
                fontSize: 12,
                color: isDone ? 'var(--green)' : isActive ? 'var(--gold)' : 'var(--paper-4)',
                fontWeight: isActive ? 500 : 400, flex: 1,
              }}>{s.label}</span>
              {isDone && <span style={{ color: 'var(--green)', fontSize: 13 }}>✓</span>}
              {isActive && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--gold)', display: 'inline-block',
                  boxShadow: '0 0 10px var(--gold)',
                  animation: 'blink 1s ease infinite',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Hero ────────────────────────────────────────────────────── */
function Hero({ onSubmit, loading }) {
  const [url, setUrl] = useState('');
  const [err, setErr] = useState('');
  const inputRef = useRef();
  const examples = ['stripe.com', 'notion.so', 'linear.app', 'webflow.com'];

  const handle = e => {
    e.preventDefault();
    const v = url.trim();
    if (!v) { setErr('Please enter a website URL'); return; }
    setErr('');
    onSubmit(v);
  };

  return (
    <div style={{ textAlign: 'center', padding: '88px 20px 64px', maxWidth: 700, margin: '0 auto' }}>
      {/* Badge */}
      <div className="fade-up" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '5px 14px', borderRadius: 999,
        background: 'var(--gold-dim)', border: '1px solid rgba(201,168,76,0.3)',
        marginBottom: 28, fontSize: 11,
        fontFamily: 'var(--mono)', color: 'var(--gold)',
        letterSpacing: '0.07em',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--gold)', display: 'inline-block',
          boxShadow: '0 0 8px var(--gold)',
          animation: 'blink 2s ease infinite',
        }} />
        10 SPECIALIST AGENTS · CLAUDE OPUS · PR AGENCY EDITION
      </div>

      {/* Headline */}
      <h1 className="fade-up fade-up-1" style={{
        fontFamily: 'var(--serif)', fontWeight: 900,
        fontSize: 'clamp(34px, 5.5vw, 60px)',
        lineHeight: 1.08, letterSpacing: '-0.02em',
        marginBottom: 20,
      }}>
        <span style={{ color: 'var(--paper)' }}>The Marketing Audit</span><br />
        <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Every PR Agency Needs.</em>
      </h1>

      <p className="fade-up fade-up-2" style={{
        fontSize: 16, color: 'var(--paper-3)', lineHeight: 1.75,
        maxWidth: 520, margin: '0 auto 40px',
      }}>
        Drop any client website. Get a boardroom-ready audit across content, SEO,
        PR readiness, brand authority, competitive positioning, and 5 more specialist
        dimensions — in under a minute.
      </p>

      {/* Input form */}
      <form className="fade-up fade-up-3" onSubmit={handle} style={{ marginBottom: 18 }}>
        <div style={{
          display: 'flex', gap: 0,
          background: 'var(--ink-2)',
          border: `1px solid ${err ? 'var(--red)' : 'var(--border-hi)'}`,
          borderRadius: 'var(--r-xl)', padding: 6,
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          transition: 'border-color 0.2s',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={e => { setUrl(e.target.value); setErr(''); }}
            placeholder="Enter website URL — e.g. clientbrand.com"
            disabled={loading}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              padding: '13px 18px', fontSize: 15,
              color: 'var(--paper)', fontFamily: 'var(--sans)',
            }}
          />
          <button type="submit" disabled={loading} style={{
            padding: '13px 28px',
            background: loading ? 'var(--ink-5)' : 'var(--gold)',
            color: loading ? 'var(--paper-4)' : 'var(--ink)',
            border: 'none', borderRadius: 12,
            fontFamily: 'var(--serif)', fontWeight: 700,
            fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(201,168,76,0.35)',
          }}>
            {loading ? 'Analysing…' : 'Run Audit →'}
          </button>
        </div>
        {err && <div style={{ marginTop: 7, fontSize: 12.5, color: 'var(--red)', textAlign: 'left', paddingLeft: 4 }}>{err}</div>}
      </form>

      {/* Examples */}
      <div className="fade-up fade-up-4" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--paper-4)' }}>Try:</span>
        {examples.map(ex => (
          <button key={ex} onClick={() => { setUrl(ex); inputRef.current?.focus(); }} style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 999, padding: '3px 12px',
            fontSize: 12, color: 'var(--paper-3)',
            cursor: 'pointer', fontFamily: 'var(--mono)',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.color = 'var(--gold)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--paper-3)'; }}
          >{ex}</button>
        ))}
      </div>
    </div>
  );
}

/* ─── AgentGrid (capabilities showcase) ─────────────────────── */
function AgentGrid() {
  const agents = [
    { icon: '✍️', title: 'Content & Messaging', desc: 'Headline clarity, value prop, narrative arc, CTA hierarchy', cat: 'Foundation' },
    { icon: '🎯', title: 'Conversion & UX', desc: 'Form friction, trust signals, user journey, mobile UX', cat: 'Foundation' },
    { icon: '🔍', title: 'SEO & Discoverability', desc: 'Technical SEO, E-E-A-T, keyword gaps, schema', cat: 'Foundation' },
    { icon: '⚔️', title: 'Competitive Positioning', desc: 'Differentiators, white-space, category framing', cat: 'Strategy' },
    { icon: '🏆', title: 'Brand & Trust', desc: 'Identity, voice, testimonials, premium positioning', cat: 'Foundation' },
    { icon: '📰', title: 'PR & Media Readiness', desc: 'Press assets, story angles, journalist readiness', cat: 'PR' },
    { icon: '⭐', title: 'Social Proof & Authority', desc: 'Case studies, endorsements, third-party validation', cat: 'PR' },
    { icon: '📈', title: 'Demand Generation', desc: 'Lead magnets, nurture paths, funnel architecture', cat: 'Growth' },
    { icon: '💡', title: 'Thought Leadership', desc: 'POV content, founder brand, category authority', cat: 'PR' },
    { icon: '🚀', title: 'Growth & Partnerships', desc: 'Channel mix, PLG signals, partnership potential', cat: 'Growth' },
  ];

  return (
    <div style={{ padding: '0 0 80px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--paper-4)', letterSpacing: '0.12em', marginBottom: 10 }}>
          AUDIT DIMENSIONS
        </div>
        <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 26, color: 'var(--paper)' }}>
          10 specialist agents. One complete picture.
        </h2>
        <p style={{ fontSize: 14, color: 'var(--paper-3)', marginTop: 8 }}>
          Each agent delivers scored analysis, actionable improvements, and a unique strategic insight.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 12 }}>
        {agents.map((a, i) => {
          const catColor = CATEGORY_COLOR[a.cat] || 'var(--paper-4)';
          return (
            <div key={i}
              className={`fade-up fade-up-${Math.min(i + 1, 5)}`}
              style={{
                background: 'var(--ink-2)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-xl)', padding: '20px 18px',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>{a.icon}</div>
              <div style={{ marginBottom: 6 }}>
                <Tag color={catColor} size="sm">{a.cat}</Tag>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 13.5, color: 'var(--paper)', marginBottom: 6 }}>
                {a.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--paper-4)', lineHeight: 1.55 }}>{a.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Nav ─────────────────────────────────────────────────────── */
function Nav({ hasResults, onReset }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(12,12,14,0.88)', backdropFilter: 'blur(18px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: 1000, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 58,
      }}>
        <button onClick={onReset} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--gold)', color: 'var(--ink)',
            fontFamily: 'var(--serif)', fontWeight: 900,
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>P</div>
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 16, color: 'var(--paper)' }}>
            PRaudit <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>AI</span>
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--paper-4)', fontFamily: 'var(--mono)' }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--green)', display: 'inline-block',
              boxShadow: '0 0 6px var(--green)',
            }} />
            10 AGENTS LIVE
          </div>
          {hasResults && (
            <button onClick={onReset} style={{
              padding: '7px 16px',
              background: 'var(--ink-3)', border: '1px solid var(--border-hi)',
              borderRadius: 'var(--r-lg)', color: 'var(--paper-2)',
              fontSize: 12.5, cursor: 'pointer',
              fontFamily: 'var(--sans)', fontWeight: 500,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => e.target.style.background = 'var(--ink-4)'}
              onMouseLeave={e => e.target.style.background = 'var(--ink-3)'}
            >+ New Audit</button>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ─── App ─────────────────────────────────────────────────────── */
export default function App() {
  const [phase, setPhase] = useState('idle'); // idle | loading | results | error
  const [result, setResult] = useState(null);
  const [auditUrl, setAuditUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [downloading, setDownloading] = useState(false);
  const resultTop = useRef();

  const handleSubmit = useCallback(async (url) => {
    setAuditUrl(url);
    setPhase('loading');
    setErrorMsg('');
    setResult(null);
    try {
      const data = await runAudit(url);
      setResult(data);
      setPhase('results');
      setTimeout(() => resultTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (err) {
      setErrorMsg(err.message || 'Audit failed. Please try again.');
      setPhase('error');
    }
  }, []);

  const handleReset = useCallback(() => {
    setPhase('idle');
    setResult(null);
    setErrorMsg('');
    setAuditUrl('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDownload = useCallback(async () => {
    if (!result) return;
    setDownloading(true);
    try {
      await new Promise(r => setTimeout(r, 100)); // let button update
      downloadPDFReport(result);
    } catch (e) {
      console.error('PDF generation failed:', e);
      alert('PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [result]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav hasResults={phase === 'results'} onReset={handleReset} />

      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
        `,
        backgroundSize: '52px 52px',
        maskImage: 'radial-gradient(ellipse 80% 55% at 50% 0%, black, transparent 85%)',
      }} />
      <div style={{
        position: 'fixed', top: -180, left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 450, zIndex: -1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 68%)',
      }} />

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
        {/* Always show hero when not in results */}
        {phase !== 'results' && (
          <Hero onSubmit={handleSubmit} loading={phase === 'loading'} />
        )}

        {/* Loading */}
        {phase === 'loading' && <LoadingScreen url={auditUrl} />}

        {/* Error */}
        {phase === 'error' && (
          <div className="fade-up" style={{
            background: 'var(--red-dim)', border: '1px solid rgba(224,92,92,0.25)',
            borderRadius: 'var(--r-xl)', padding: '22px 26px',
            display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 32,
          }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 15, color: 'var(--red)', marginBottom: 4 }}>
                Audit failed
              </div>
              <div style={{ fontSize: 13, color: 'var(--paper-3)' }}>{errorMsg}</div>
            </div>
            <button onClick={handleReset} style={{
              padding: '8px 16px', background: 'var(--ink-4)',
              border: '1px solid var(--border-hi)', borderRadius: 'var(--r)',
              color: 'var(--paper-2)', fontSize: 12.5, cursor: 'pointer',
              fontFamily: 'var(--sans)',
            }}>Try again</button>
          </div>
        )}

        {/* Results */}
        {phase === 'results' && result && (
          <div ref={resultTop} style={{ paddingTop: 40 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--paper-4)', letterSpacing: '0.12em', marginBottom: 4 }}>
                  AUDIT COMPLETE
                </div>
                <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 24, color: 'var(--paper)' }}>
                  {result.url.replace(/^https?:\/\//, '')}
                </h2>
              </div>
            </div>

            <SummaryPanel result={result} onDownload={handleDownload} downloading={downloading} />

            <div style={{
              fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--paper-4)',
              letterSpacing: '0.1em', marginBottom: 14,
            }}>
              DETAILED BREAKDOWN — CLICK ANY CARD TO EXPAND
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 60 }}>
              {AGENT_ORDER.filter(k => result.agents[k]).map((k, i) => (
                <AgentCard key={k} agentKey={k} data={result.agents[k]} index={i} />
              ))}
            </div>

            {/* Download CTA at bottom */}
            <div style={{
              textAlign: 'center', padding: '32px 0 64px',
              borderTop: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: 14, color: 'var(--paper-4)', marginBottom: 16 }}>
                Share this audit with your team or present to your client
              </p>
              <button onClick={handleDownload} disabled={downloading} style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 32px',
                background: downloading ? 'var(--ink-4)' : 'var(--gold)',
                color: downloading ? 'var(--paper-4)' : 'var(--ink)',
                border: 'none', borderRadius: 'var(--r-xl)',
                fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 15,
                cursor: downloading ? 'not-allowed' : 'pointer',
                boxShadow: downloading ? 'none' : '0 6px 28px rgba(201,168,76,0.3)',
                transition: 'all 0.2s',
              }}>
                {downloading ? '⏳ Generating PDF…' : '↓ Download Full PDF Report'}
              </button>
              <div style={{ fontSize: 11, color: 'var(--paper-4)', fontFamily: 'var(--mono)', marginTop: 12 }}>
                Boardroom-ready · Includes all 10 dimensions · Branded report
              </div>
            </div>
          </div>
        )}

        {/* Capabilities on idle */}
        {phase === 'idle' && <AgentGrid />}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '20px 24px',
        textAlign: 'center', background: 'var(--ink-2)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--paper-4)', fontFamily: 'var(--mono)' }}>
          PRaudit AI · Powered by Claude Opus · Built for PR agencies
        </div>
      </footer>
    </div>
  );
}
