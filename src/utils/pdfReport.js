// src/utils/pdfReport.js
// Boardroom-ready PDF audit report — jsPDF only (no autoTable needed)

import jsPDF from 'jspdf';

// All colors as plain [R,G,B] arrays — jsPDF requires numbers, NOT CSS strings
const C = {
  ink:     [12,  12,  14],
  ink3:    [30,  30,  35],
  ink4:    [42,  42,  50],
  gold:    [201, 168, 76],
  goldLt:  [228, 198, 100],
  paper:   [242, 237, 228],
  paperDm: [170, 164, 154],
  grey:    [90,  88,  84],
  green:   [86,  201, 138],
  greenDk: [18,  42,  30],
  amber:   [232, 168, 58],
  amberDk: [42,  30,  12],
  red:     [224, 92,  92],
};

const AGENT_ORDER = [
  'content','conversion','seo','competitive','brand',
  'pr_media','social_proof','demand_gen','thought_leadership','growth_strategy'
];

// Always returns [R,G,B] — safe to spread into jsPDF
function scoreRGB(score) {
  if (score >= 80) return C.green;
  if (score >= 65) return C.goldLt;
  if (score >= 50) return C.amber;
  return C.red;
}

function gradeFromScore(score) {
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D+';
  return 'D';
}

// Safe helpers — always use these instead of spread directly
function setFill(doc, rgb)  { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
function setTxt(doc, rgb)   { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
function setDraw(doc, rgb)  { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }

export function downloadPDFReport(result) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210;
  const PH = 297;
  const ML = 16;
  const MR = 16;
  const CW = PW - ML - MR; // 178

  const cleanUrl = (result.url || '').replace(/^https?:\/\//, '');
  const agentsArr = AGENT_ORDER.filter(k => result.agents?.[k]);
  const ovScore = Number(result.overall_score) || 0;
  const ovGrade = result.overall_grade || gradeFromScore(ovScore);
  const ovColor = scoreRGB(ovScore);

  // ── COVER PAGE ──────────────────────────────────────────────
  setFill(doc, C.ink); doc.rect(0, 0, PW, PH, 'F');
  setFill(doc, C.gold); doc.rect(0, 0, PW, 3, 'F');        // top stripe
  setFill(doc, C.gold); doc.rect(ML, 36, 0.6, 56, 'F');   // left bar

  // Wordmark
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  setTxt(doc, C.gold); doc.setCharSpace(3);
  doc.text('PRAUDIT AI', ML + 7, 45); doc.setCharSpace(0);
  doc.setFontSize(7); setTxt(doc, C.grey); doc.setCharSpace(1.5);
  doc.text('MARKETING INTELLIGENCE PLATFORM', ML + 7, 53); doc.setCharSpace(0);

  // Title
  doc.setFont('helvetica', 'bold'); doc.setFontSize(30);
  setTxt(doc, C.paper); doc.text('Marketing Audit', ML + 7, 76);
  setTxt(doc, C.gold);  doc.text('Report', ML + 7, 89);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  setTxt(doc, C.paperDm); doc.text(cleanUrl, ML + 7, 101);

  // Score box
  setFill(doc, C.ink3); doc.roundedRect(ML + 7, 115, 72, 44, 3, 3, 'F');
  setFill(doc, ovColor); doc.roundedRect(ML + 7, 115, 3, 44, 1, 1, 'F');
  doc.setFontSize(38); doc.setFont('helvetica', 'bold');
  setTxt(doc, ovColor); doc.text(String(ovScore), ML + 18, 139);
  doc.setFontSize(10); setTxt(doc, C.paperDm);
  doc.text('/ 100  Overall Score', ML + 18, 148);
  doc.setFontSize(20); setTxt(doc, ovColor);
  doc.text(ovGrade, ML + 66, 135);

  // Mini grid header
  doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  setTxt(doc, C.grey); doc.setCharSpace(1);
  doc.text('DIMENSION SCORES', ML + 7, 172); doc.setCharSpace(0);

  const colW5 = CW / 5;
  agentsArr.forEach((key, i) => {
    const ag = result.agents[key];
    const sc = scoreRGB(Number(ag.score) || 0);
    const col = i % 5, row = Math.floor(i / 5);
    const bx = ML + col * colW5, by = 176 + row * 22;
    setFill(doc, C.ink3); doc.roundedRect(bx, by, colW5 - 2, 18, 2, 2, 'F');
    setFill(doc, sc);     doc.roundedRect(bx, by, colW5 - 2, 1.5, 0.5, 0.5, 'F');
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); setTxt(doc, C.grey);
    const nm = (ag.agent || key).split('&')[0].trim().split(' ').slice(0, 2).join(' ');
    doc.text(nm, bx + 2.5, by + 7.5);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); setTxt(doc, sc);
    doc.text(String(ag.score || 0), bx + 2.5, by + 14.5);
  });

  // Footer
  const dateStr = new Date(result.analysed_at || Date.now())
    .toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  setTxt(doc, C.grey); doc.setCharSpace(0.5);
  doc.text(`Analysed ${dateStr}  ·  ${result.agent_count || 10} agents  ·  ${result.model || 'Claude Opus'}`, ML + 7, 278);
  doc.text('CONFIDENTIAL — Prepared by PRaudit AI', ML + 7, 284);
  doc.setCharSpace(0);
  setFill(doc, C.gold); doc.rect(0, PH - 3, PW, 3, 'F');

  // ── PAGE TEMPLATE HELPER ─────────────────────────────────────
  let pageNum = 1;
  function newPage() {
    doc.addPage(); pageNum++;
    setFill(doc, C.ink);  doc.rect(0, 0, PW, PH, 'F');
    setFill(doc, C.gold); doc.rect(0, 0, PW, 1.5, 'F');
    setFill(doc, C.ink3); doc.rect(0, 1.5, PW, 16, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    setTxt(doc, C.gold); doc.setCharSpace(2);
    doc.text('PRAUDIT AI', ML, 11); doc.setCharSpace(0);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); setTxt(doc, C.grey);
    doc.text(cleanUrl, PW - MR - doc.getTextWidth(cleanUrl), 11);
    setFill(doc, C.gold); doc.rect(0, 17.5, PW, 0.4, 'F');
    setFill(doc, C.ink3); doc.rect(0, PH - 11, PW, 11, 'F');
    setFill(doc, C.gold); doc.rect(0, PH - 3, PW, 3, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); setTxt(doc, C.grey);
    doc.text('CONFIDENTIAL — PRaudit AI Marketing Intelligence', ML, PH - 5);
    const pgt = `Page ${pageNum}`;
    doc.text(pgt, PW - MR - doc.getTextWidth(pgt), PH - 5);
    return 26; // content start Y
  }

  // ── EXECUTIVE SUMMARY ────────────────────────────────────────
  let y = newPage();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17); setTxt(doc, C.paper);
  doc.text('Executive Summary', ML, y); y += 10;

  const sorted = agentsArr
    .map(k => ({ key: k, ...result.agents[k] }))
    .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));

  // Bar chart
  sorted.forEach((ag, i) => {
    const sc = scoreRGB(Number(ag.score) || 0);
    const barY = y + i * 11;
    const bx = ML + 66, bw = CW - 66 - 22;
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); setTxt(doc, C.paperDm);
    doc.text(`${ag.icon || ''} ${ag.agent || ag.key}`.trim(), ML, barY + 4.5);
    setFill(doc, C.ink4); doc.roundedRect(bx, barY, bw, 7, 1, 1, 'F');
    setFill(doc, sc);     doc.roundedRect(bx, barY, bw * ((Number(ag.score) || 0) / 100), 7, 1, 1, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); setTxt(doc, sc);
    doc.text(String(ag.score || 0), bx + bw + 3, barY + 5.5);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); setTxt(doc, C.grey);
    doc.text(ag.grade || '', bx + bw + 12, barY + 5.5);
  });

  y += sorted.length * 11 + 14;

  // Top / Bottom boxes
  const halfW = (CW - 6) / 2;
  const top3 = sorted.slice(0, 3);
  const bot3 = sorted.slice(-3).reverse();

  setFill(doc, C.greenDk); doc.roundedRect(ML, y, halfW, 40, 3, 3, 'F');
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); setTxt(doc, C.green);
  doc.setCharSpace(1.5); doc.text('▲ STRONGEST DIMENSIONS', ML + 4, y + 8); doc.setCharSpace(0);
  top3.forEach((ag, i) => {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); setTxt(doc, C.paperDm);
    doc.text(`${ag.icon||''} ${ag.agent||ag.key}`.trim(), ML + 4, y + 17 + i * 8);
    doc.setFont('helvetica', 'bold'); setTxt(doc, C.green);
    doc.text(String(ag.score || 0), ML + halfW - 14, y + 17 + i * 8);
  });

  const fx = ML + halfW + 6;
  setFill(doc, C.amberDk); doc.roundedRect(fx, y, halfW, 40, 3, 3, 'F');
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); setTxt(doc, C.amber);
  doc.setCharSpace(1.5); doc.text('↓ PRIORITY FOCUS AREAS', fx + 4, y + 8); doc.setCharSpace(0);
  bot3.forEach((ag, i) => {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); setTxt(doc, C.paperDm);
    doc.text(`${ag.icon||''} ${ag.agent||ag.key}`.trim(), fx + 4, y + 17 + i * 8);
    doc.setFont('helvetica', 'bold'); setTxt(doc, C.amber);
    doc.text(String(ag.score || 0), fx + halfW - 14, y + 17 + i * 8);
  });

  // ── AGENT PAGES ──────────────────────────────────────────────
  agentsArr.forEach(key => {
    const ag = result.agents[key];
    const sc = scoreRGB(Number(ag.score) || 0);
    y = newPage();

    // Header card
    setFill(doc, C.ink3); doc.roundedRect(ML, y, CW, 30, 3, 3, 'F');
    setFill(doc, sc);     doc.roundedRect(ML, y, 3, 30, 1, 1, 'F');
    doc.setFontSize(15); doc.setFont('helvetica', 'bold'); setTxt(doc, C.paper);
    doc.text(`${ag.icon||''} ${ag.agent||key}`.trim(), ML + 8, y + 12);
    if (ag.category) {
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); setTxt(doc, C.grey);
      doc.text(ag.category.toUpperCase(), ML + 8, y + 20);
    }
    doc.setFontSize(28); doc.setFont('helvetica', 'bold'); setTxt(doc, sc);
    doc.text(String(ag.score || 0), PW - MR - 28, y + 17);
    doc.setFontSize(9); setTxt(doc, C.grey);
    doc.text(`/100  ${ag.grade || ''}`, PW - MR - 28, y + 25);
    y += 36;

    // Summary
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); setTxt(doc, C.paperDm);
    const sumL = doc.splitTextToSize(String(ag.summary || ''), CW);
    doc.text(sumL, ML, y); y += sumL.length * 5.5 + 9;

    // Perf bar
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); setTxt(doc, C.grey);
    doc.setCharSpace(1); doc.text('PERFORMANCE', ML, y); doc.setCharSpace(0);
    y += 4;
    setFill(doc, C.ink4); doc.roundedRect(ML, y, CW, 6, 1.5, 1.5, 'F');
    setFill(doc, sc);     doc.roundedRect(ML, y, CW * ((Number(ag.score)||0)/100), 6, 1.5, 1.5, 'F');
    y += 13;

    // Three-column lists
    const col3 = (CW - 8) / 3;
    function drawCol(items, title, titleRgb, startX) {
      let cy = y;
      setFill(doc, titleRgb); doc.rect(startX, cy, col3, 2.5, 'F');
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); setTxt(doc, titleRgb);
      doc.setCharSpace(1.2); doc.text(title, startX + 2, cy + 8); doc.setCharSpace(0);
      cy += 13;
      (items || []).slice(0, 4).forEach(item => {
        const lines = doc.splitTextToSize('• ' + String(item), col3 - 4);
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); setTxt(doc, C.paper);
        lines.forEach(ln => { if (cy < 265) { doc.text(ln, startX + 2, cy); cy += 5.5; } });
        cy += 1.5;
      });
    }
    drawCol(ag.strengths,    '✓ STRENGTHS',    C.green, ML);
    drawCol(ag.improvements, '↑ IMPROVEMENTS', C.amber, ML + col3 + 4);
    drawCol(ag.quick_wins,   '⚡ QUICK WINS',  C.gold,  ML + (col3 + 4) * 2);
    y += 72;

    // Key insight
    const insight = ag.key_insight || ag.pr_angle || ag.top_story_angle ||
      ag.competitive_gap || ag.authority_gap || ag.funnel_gap ||
      ag.growth_lever || ag.positioning_opportunity || ag.revenue_impact ||
      ag.top_keyword_opportunity || ag.brand_archetype || '';
    if (insight && y < 255) {
      setFill(doc, [20, 18, 8]); doc.roundedRect(ML, y, CW, 32, 3, 3, 'F');
      setDraw(doc, C.gold); doc.setLineWidth(0.4);
      doc.roundedRect(ML, y, CW, 32, 3, 3, 'S');
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); setTxt(doc, C.gold);
      doc.setCharSpace(1.5); doc.text('◈ KEY INSIGHT', ML + 5, y + 9); doc.setCharSpace(0);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); setTxt(doc, C.paper);
      const iL = doc.splitTextToSize(String(insight), CW - 10).slice(0, 3);
      iL.forEach((ln, i) => doc.text(ln, ML + 5, y + 17 + i * 6));
    }
  });

  // ── QUICK WINS PAGE ──────────────────────────────────────────
  y = newPage();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17); setTxt(doc, C.paper);
  doc.text('Quick Wins Action Plan', ML, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setTxt(doc, C.grey);
  doc.text('High-impact improvements implementable within 24–48 hours', ML, y + 8);
  y += 18;

  let qNum = 1;
  agentsArr.forEach(key => {
    const ag = result.agents[key];
    const sc = scoreRGB(Number(ag.score) || 0);
    (ag.quick_wins || []).forEach(win => {
      if (y > 272) return;
      setFill(doc, C.ink3); doc.roundedRect(ML, y, CW, 14, 2, 2, 'F');
      setFill(doc, sc);     doc.roundedRect(ML, y, 2, 14, 0.5, 0.5, 'F');
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); setTxt(doc, C.gold);
      doc.text(`${qNum}.`, ML + 5, y + 9);
      doc.setFont('helvetica', 'normal'); setTxt(doc, C.paper);
      const winL = doc.splitTextToSize(String(win), CW - 42);
      doc.text(winL[0] || String(win), ML + 13, y + 9);
      doc.setFontSize(6.5); setTxt(doc, C.grey);
      const lbl = String(ag.agent || key);
      doc.text(lbl, PW - MR - doc.getTextWidth(lbl), y + 9);
      y += 17; qNum++;
    });
  });

  // ── SAVE ─────────────────────────────────────────────────────
  const safe = cleanUrl.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
  doc.save(`PRaudit_${safe}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
