// api/audit.js — Vercel Node.js Serverless Function
// Runs 10 Claude Opus agents in parallel and returns structured audit results

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── In-memory cache (resets on cold start, good enough for demos) ───
const cache = new Map();
const CACHE_TTL = 3600 * 1000; // 1 hour ms

const AGENTS = {
  content: {
    name: 'Content & Messaging',
    icon: '✍️',
    category: 'Foundation',
    prompt: `You are a senior content strategist at a world-class PR agency with 15+ years experience.
Analyse the website at {url} as if preparing a client onboarding audit for a Fortune 500 brief.

Evaluate in depth:
- Headline clarity and emotional resonance
- Value proposition specificity and credibility
- Body copy quality, rhythm, and persuasion
- CTA hierarchy and urgency
- Tone of voice consistency and appropriateness
- Narrative arc and storytelling structure
- Messaging hierarchy across the page
- Audience targeting precision

Return ONLY valid JSON, no markdown fences, no preamble:
{"score":72,"grade":"B","summary":"2-3 sentence executive summary written for a senior audience","strengths":["specific strength with evidence","specific strength","specific strength"],"improvements":["actionable improvement with rationale","actionable improvement","actionable improvement"],"quick_wins":["1-day fix that moves the needle","1-day fix"],"key_insight":"The single most important content insight a PR director needs to know about this brand","pr_angle":"The 1-2 sentence earned media story angle this brand could pitch to tier-1 journalists today"}`
  },

  conversion: {
    name: 'Conversion & UX',
    icon: '🎯',
    category: 'Foundation',
    prompt: `You are a CRO director and UX researcher who has optimised $500M+ in revenue funnels.
Analyse the website at {url} for conversion effectiveness and user experience quality.

Evaluate in depth:
- Above-the-fold effectiveness and first impression
- CTA button copy, placement, and visual hierarchy
- Form friction and cognitive load
- Trust signals at decision points
- Social proof placement and specificity
- Pricing clarity and anchoring
- Mobile UX signals
- Page speed and technical UX indicators
- Checkout or contact flow friction

Return ONLY valid JSON, no markdown fences:
{"score":58,"grade":"C+","summary":"2-3 sentence executive summary","strengths":["specific strength","specific strength","specific strength"],"improvements":["actionable improvement","actionable improvement","actionable improvement"],"quick_wins":["1-day fix","1-day fix"],"key_insight":"The single conversion bottleneck costing this brand the most leads or revenue","revenue_impact":"Specific estimated uplift if the top 2 issues were fixed, e.g. +20-30% lead volume"}`
  },

  seo: {
    name: 'SEO & Discoverability',
    icon: '🔍',
    category: 'Foundation',
    prompt: `You are an SEO director with deep technical and content SEO expertise across B2B and B2C.
Analyse the website at {url} for organic search performance and discoverability.

Evaluate in depth:
- Title tag quality and keyword alignment
- Meta description effectiveness
- H1/H2/H3 hierarchy and keyword distribution
- Content depth and topical authority signals
- Internal linking structure signals
- Schema markup and rich result opportunities
- Local SEO signals if applicable
- Core Web Vitals and page experience signals
- E-E-A-T signals (Experience, Expertise, Authority, Trust)
- Featured snippet and SERP feature opportunities

Return ONLY valid JSON, no markdown fences:
{"score":81,"grade":"A-","summary":"2-3 sentence executive summary","strengths":["specific strength","specific strength","specific strength"],"improvements":["actionable improvement","actionable improvement","actionable improvement"],"quick_wins":["1-day fix","1-day fix"],"key_insight":"The most impactful SEO opportunity this site is leaving on the table","top_keyword_opportunity":"The single highest-value keyword this brand should target immediately with rationale"}`
  },

  competitive: {
    name: 'Competitive Positioning',
    icon: '⚔️',
    category: 'Strategy',
    prompt: `You are a strategy director and competitive intelligence expert who advises boards on market positioning.
Analyse the website at {url} for competitive differentiation and market positioning.

Evaluate in depth:
- Unique value proposition clarity vs likely competitors
- Key differentiators and how boldly they are communicated
- Category language and framing (are they defining or following?)
- Price positioning signals
- Competitive moat communication
- White-space opportunities in their messaging
- Risk of commoditisation in current positioning
- Messaging that competitors could easily copy

Return ONLY valid JSON, no markdown fences:
{"score":64,"grade":"C+","summary":"2-3 sentence executive summary","strengths":["specific strength","specific strength","specific strength"],"improvements":["actionable improvement","actionable improvement","actionable improvement"],"quick_wins":["1-day fix","1-day fix"],"key_insight":"The most dangerous gap in their competitive positioning","competitive_gap":"The biggest competitive advantage they have but are failing to communicate"}`
  },

  brand: {
    name: 'Brand & Trust',
    icon: '🏆',
    category: 'Foundation',
    prompt: `You are a chief brand officer and creative director who has built agency-of-record brands globally.
Analyse the website at {url} for brand strength, trust, and premium positioning.

Evaluate in depth:
- Visual identity consistency and sophistication
- Brand voice authenticity and distinctiveness
- Trust signal quality (testimonials, logos, certifications, media)
- About/team page strength and humanisation
- Brand story clarity and emotional resonance
- Contact and accessibility signals
- Premium vs commodity brand positioning
- Consistency of brand experience across sections

Return ONLY valid JSON, no markdown fences:
{"score":76,"grade":"B+","summary":"2-3 sentence executive summary","strengths":["specific strength","specific strength","specific strength"],"improvements":["actionable improvement","actionable improvement","actionable improvement"],"quick_wins":["1-day fix","1-day fix"],"key_insight":"The most critical brand trust issue affecting sales and PR potential","brand_archetype":"The brand archetype this company projects (e.g. The Sage, The Hero, The Rebel) and whether it appears intentional or accidental"}`
  },

  pr_media: {
    name: 'PR & Media Readiness',
    icon: '📰',
    category: 'PR',
    prompt: `You are a PR director with 20 years placing stories in Forbes, TechCrunch, FT, and national broadcast.
Analyse the website at {url} for PR and earned media readiness — as if assessing a new client.

Evaluate in depth:
- Newsroom or press page quality and completeness
- Media kit availability (logos, exec bios, boilerplate, hi-res images)
- Story angles visible from the website
- Founder/CEO thought leadership positioning
- Awards, recognition, and milestone communication
- Newsworthiness signals (data, research, controversy, firsts)
- Crisis communication preparedness signals
- Journalist and blogger friendliness
- Quote-ready spokespeople or expert positioning

Return ONLY valid JSON, no markdown fences:
{"score":55,"grade":"C","summary":"2-3 sentence executive summary","strengths":["specific strength","specific strength"],"improvements":["actionable improvement","actionable improvement","actionable improvement"],"quick_wins":["1-day fix","1-day fix"],"key_insight":"The single biggest barrier to earning tier-1 media coverage","top_story_angle":"The most compelling story angle hidden in this brand that a top journalist would actually care about"}`
  },

  social_proof: {
    name: 'Social Proof & Authority',
    icon: '⭐',
    category: 'PR',
    prompt: `You are a reputation strategist and authority-building expert who advises C-suite executives.
Analyse the website at {url} for social proof quality and authority positioning.

Evaluate in depth:
- Testimonial specificity, credibility, and placement
- Case study depth and results clarity
- Client/partner logo quality and recognisability
- Review platform integration and ratings
- Expert or influencer endorsements
- Industry awards and recognition
- Thought leadership content quality
- Community and follower signals
- User-generated content signals
- Third-party validation and media mentions

Return ONLY valid JSON, no markdown fences:
{"score":60,"grade":"C+","summary":"2-3 sentence executive summary","strengths":["specific strength","specific strength","specific strength"],"improvements":["actionable improvement","actionable improvement","actionable improvement"],"quick_wins":["1-day fix","1-day fix"],"key_insight":"The most damaging credibility gap on this site","authority_gap":"The single most impactful authority signal missing that top competitors in this space likely have"}`
  },

  demand_gen: {
    name: 'Demand Generation',
    icon: '📈',
    category: 'Growth',
    prompt: `You are a demand generation VP who has built $100M+ pipeline machines for SaaS and professional services firms.
Analyse the website at {url} for lead generation and demand creation effectiveness.

Evaluate in depth:
- Lead magnet quality and positioning
- Email capture strategy and placement
- Gated vs ungated content balance
- Content marketing depth and frequency signals
- Free tools or resource availability
- Webinar, event, or community marketing signals
- Retargeting and pixel readiness signals
- Bottom-of-funnel conversion paths
- Nurture sequence signals
- Account-based marketing signals

Return ONLY valid JSON, no markdown fences:
{"score":50,"grade":"C-","summary":"2-3 sentence executive summary","strengths":["specific strength","specific strength"],"improvements":["actionable improvement","actionable improvement","actionable improvement"],"quick_wins":["1-day fix","1-day fix"],"key_insight":"The biggest demand generation gap costing this brand pipeline","funnel_gap":"The single most important fix that would immediately increase qualified lead volume"}`
  },

  thought_leadership: {
    name: 'Thought Leadership',
    icon: '💡',
    category: 'PR',
    prompt: `You are an executive positioning consultant and thought leadership strategist who has built 7-figure personal brands for CEOs.
Analyse the website at {url} for thought leadership depth and category authority.

Evaluate in depth:
- Blog or insights content quality, depth, and frequency
- Original research, data, or proprietary frameworks
- Founder/team personal brand integration
- Opinion and point-of-view content
- Speaking, podcast, or media appearance signals
- Newsletter or subscription content
- LinkedIn and social integration
- Industry report or whitepaper quality
- Content that challenges conventional wisdom
- Category-defining language and concepts

Return ONLY valid JSON, no markdown fences:
{"score":45,"grade":"D+","summary":"2-3 sentence executive summary","strengths":["specific strength","specific strength"],"improvements":["actionable improvement","actionable improvement","actionable improvement"],"quick_wins":["1-day fix","1-day fix"],"key_insight":"The thought leadership gap most damaging to their PR and business development","positioning_opportunity":"The specific category or topic this brand should own and dominate with content"}`
  },

  growth_strategy: {
    name: 'Growth & Partnerships',
    icon: '🚀',
    category: 'Growth',
    prompt: `You are a growth strategy partner and BD director who has structured partnerships generating $500M+ in value.
Analyse the website at {url} for growth signals, channel diversity, and partnership potential.

Evaluate in depth:
- Partnership and integration signals
- Referral or affiliate programme presence
- Channel diversity signals
- International/geographic expansion readiness
- Product-led growth mechanics
- Community-led growth signals
- Strategic alliance and co-marketing signals
- Investor or funding narrative clarity
- Ecosystem and platform play signals
- Network effect signals

Return ONLY valid JSON, no markdown fences:
{"score":55,"grade":"C","summary":"2-3 sentence executive summary","strengths":["specific strength","specific strength"],"improvements":["actionable improvement","actionable improvement","actionable improvement"],"quick_wins":["1-day fix","1-day fix"],"key_insight":"The growth lever with highest near-term ROI this brand is ignoring","growth_lever":"The single partnership or channel play that would most accelerate their growth in the next 90 days"}`
  }
};

function scoreToGrade(s) {
  if (s >= 90) return 'A';
  if (s >= 85) return 'A-';
  if (s >= 80) return 'B+';
  if (s >= 75) return 'B';
  if (s >= 70) return 'B-';
  if (s >= 65) return 'C+';
  if (s >= 60) return 'C';
  if (s >= 55) return 'C-';
  if (s >= 50) return 'D+';
  return 'D';
}

async function runAgent(agentKey, url) {
  const agent = AGENTS[agentKey];
  const prompt = agent.prompt.replace('{url}', url);
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    });
    let raw = message.content[0].text.trim();
    // Strip any accidental markdown fences
    raw = raw.replace(/```json|```/g, '').trim();
    // Extract JSON if there's surrounding text
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in response');
    const data = JSON.parse(match[0]);
    return { key: agentKey, data: { ...data, agent: agent.name, icon: agent.icon, category: agent.category }, error: null };
  } catch (err) {
    return {
      key: agentKey,
      data: {
        agent: agent.name, icon: agent.icon, category: agent.category,
        score: 0, grade: 'N/A',
        summary: `Analysis could not be completed: ${err.message?.slice(0, 100)}`,
        strengths: [], improvements: [], quick_wins: [],
        key_insight: 'Unable to analyse'
      },
      error: err.message
    };
  }
}

export default async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let url = (req.body?.url || '').trim();
  if (!url) return res.status(400).json({ error: 'url is required' });
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  // Cache check
  const cached = cache.get(url);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return res.status(200).json({ ...cached.data, cached: true });
  }

  const start = Date.now();

  // Run all 10 agents in parallel
  const results = await Promise.allSettled(
    Object.keys(AGENTS).map(key => runAgent(key, url))
  );

  const agents = {};
  for (const result of results) {
    if (result.status === 'fulfilled') {
      agents[result.value.key] = result.value.data;
    }
  }

  const validScores = Object.values(agents)
    .map(a => a.score)
    .filter(s => typeof s === 'number' && s > 0);
  const overallScore = validScores.length
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 0;

  const payload = {
    url,
    overall_score: overallScore,
    overall_grade: scoreToGrade(overallScore),
    agents,
    agent_count: Object.keys(agents).length,
    duration_seconds: ((Date.now() - start) / 1000).toFixed(1),
    analysed_at: new Date().toISOString(),
    cached: false,
    model: 'Claude Opus (claude-opus-4-5)'
  };

  cache.set(url, { data: payload, time: Date.now() });
  return res.status(200).json(payload);
}
