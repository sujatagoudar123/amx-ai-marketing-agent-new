// src/utils/constants.js

export const AGENT_ORDER = [
  'content', 'conversion', 'seo', 'competitive', 'brand',
  'pr_media', 'social_proof', 'demand_gen', 'thought_leadership', 'growth_strategy'
];

export const AGENT_META = {
  content:           { label: 'Content & Messaging',      icon: '✍️', cat: 'Foundation' },
  conversion:        { label: 'Conversion & UX',          icon: '🎯', cat: 'Foundation' },
  seo:               { label: 'SEO & Discoverability',    icon: '🔍', cat: 'Foundation' },
  competitive:       { label: 'Competitive Positioning',  icon: '⚔️', cat: 'Strategy'   },
  brand:             { label: 'Brand & Trust',            icon: '🏆', cat: 'Foundation' },
  pr_media:          { label: 'PR & Media Readiness',     icon: '📰', cat: 'PR'         },
  social_proof:      { label: 'Social Proof & Authority', icon: '⭐', cat: 'PR'         },
  demand_gen:        { label: 'Demand Generation',        icon: '📈', cat: 'Growth'     },
  thought_leadership:{ label: 'Thought Leadership',       icon: '💡', cat: 'PR'         },
  growth_strategy:   { label: 'Growth & Partnerships',    icon: '🚀', cat: 'Growth'     },
};

export const CATEGORY_COLOR = {
  Foundation: 'var(--gold)',
  Strategy:   '#a78bfa',
  PR:         '#38bdf8',
  Growth:     'var(--green)',
};

export function scoreColor(s) {
  if (s >= 80) return 'var(--green)';
  if (s >= 65) return 'var(--gold-2)';
  if (s >= 50) return 'var(--amber)';
  return 'var(--red)';
}

export function scoreBg(s) {
  if (s >= 80) return 'var(--green-dim)';
  if (s >= 65) return 'var(--gold-dim)';
  if (s >= 50) return 'var(--amber-dim)';
  return 'var(--red-dim)';
}

export function gradeFromScore(s) {
  if (s >= 90) return 'A';
  if (s >= 85) return 'A−';
  if (s >= 80) return 'B+';
  if (s >= 75) return 'B';
  if (s >= 70) return 'B−';
  if (s >= 65) return 'C+';
  if (s >= 60) return 'C';
  if (s >= 55) return 'C−';
  if (s >= 50) return 'D+';
  return 'D';
}

export const GRADE_COLOR = {
  'A':  'var(--green)',   'A−': 'var(--green)',
  'B+': '#a3e635',       'B':  '#bef264',   'B−': '#d9f99d',
  'C+': 'var(--amber)',  'C':  'var(--amber)', 'C−': '#fde68a',
  'D+': '#fb923c',       'D':  'var(--red)',
  'N/A':'var(--paper-4)',
};
