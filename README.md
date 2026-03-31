# PRaudit AI — Marketing Intelligence Platform

> 10 specialist AI agents. Boardroom-ready audits. Built for PR agencies.  
> **100% Vercel-native** — Node.js serverless API + React frontend, zero separate backend.

---

## Deploy to Vercel (5 minutes)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "PRaudit AI — initial commit"
git remote add origin https://github.com/YOUR_USERNAME/praudit.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Vite — **keep all defaults**
4. Add one Environment Variable:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-...` (from [console.anthropic.com](https://console.anthropic.com))
5. Click **Deploy**

✅ Done. No separate backend. No Amplify. No Render. Everything runs on Vercel.

---

## How It Works

```
Browser → Vercel CDN (React frontend)
       → Vercel Serverless Function /api/audit.js (Node.js)
       → Anthropic Claude Opus API (10 agents, parallel)
```

The `/api/audit.js` function runs 10 Claude Opus agents in parallel using `Promise.allSettled`, returning complete results in ~25–45 seconds.

---

## The 10 Agents

| Agent | Category | Unique Insight Delivered |
|-------|----------|--------------------------|
| ✍️ Content & Messaging | Foundation | PR pitch angle for tier-1 media |
| 🎯 Conversion & UX | Foundation | Estimated revenue impact of fixes |
| 🔍 SEO & Discoverability | Foundation | Top keyword opportunity |
| ⚔️ Competitive Positioning | Strategy | Biggest uncommunicated advantage |
| 🏆 Brand & Trust | Foundation | Brand archetype analysis |
| 📰 PR & Media Readiness | PR | Hidden Forbes/TechCrunch story angle |
| ⭐ Social Proof & Authority | PR | Missing credibility signal vs competitors |
| 📈 Demand Generation | Growth | Funnel gap diagnosis |
| 💡 Thought Leadership | PR | Category ownership opportunity |
| 🚀 Growth & Partnerships | Growth | Highest-leverage 90-day growth lever |

---

## PDF Report

Click **Download PDF Report** after any audit to get a multi-page, boardroom-ready PDF including:
- Executive summary with score bar chart
- Cover page with overall grade
- Individual agent pages with strengths, improvements, quick wins
- Quick wins action plan
- Branded and ready to present to clients

---

## Local Development

```bash
# Install dependencies
npm install

# Set your API key
cp .env.example .env.local
# Edit .env.local → ANTHROPIC_API_KEY=sk-ant-...

# Run locally (Vercel dev server handles /api/* automatically)
npx vercel dev

# OR: run Vite only (no API calls will work)
npm run dev
```

> **Recommended local setup**: Use `npx vercel dev` — it emulates the Vercel serverless environment exactly, including `/api/audit.js`.

---

## Project Structure

```
praudit/
├── api/
│   ├── audit.js        ← POST /api/audit — 10-agent Claude orchestrator
│   └── health.js       ← GET /api/health — status check
├── src/
│   ├── App.jsx         ← Full React application
│   ├── main.jsx        ← Entry point
│   ├── styles/
│   │   └── global.css  ← Design system tokens + animations
│   └── utils/
│       ├── constants.js ← Agent config, color helpers
│       └── pdfReport.js ← PDF generation (jsPDF)
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.js
├── vercel.json         ← Routing + function config
└── .env.example
```

---

## Environment Variables

| Variable | Required | Set in |
|----------|----------|--------|
| `ANTHROPIC_API_KEY` | ✅ Yes | Vercel Project Settings → Environment Variables |

---

## Tech Stack

- **Frontend**: React 18 + Vite 5
- **API**: Vercel Serverless Functions (Node.js 20)
- **AI**: Anthropic Claude Opus via `@anthropic-ai/sdk`
- **PDF**: jsPDF + jspdf-autotable
- **Fonts**: Playfair Display + DM Sans + JetBrains Mono
- **Deploy**: Vercel

---

## Customising Agents

To add or modify an agent, edit the `AGENTS` object in `api/audit.js`:

```js
my_agent: {
  name: 'My Custom Agent',
  icon: '🎨',
  category: 'Strategy',
  prompt: `You are a [specialist]. Analyse {url}. 
  Return ONLY valid JSON: {"score":70,"grade":"B-","summary":"...","strengths":[],"improvements":[],"quick_wins":[],"key_insight":"..."}`
}
```

Then add `'my_agent'` to `AGENT_ORDER` in `src/utils/constants.js`.
