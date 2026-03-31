// src/utils/pdfReport.js
// Generates a professional boardroom-ready PDF audit report

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  ink:      [12, 12, 14],
  gold:     [201, 168, 76],
  goldLight:[232, 201, 106],
  paper:    [242, 237, 228],
  paperDim: [180, 175, 166],
  green:    [86, 201, 138],
  amber:    [232, 168, 58],
  red:      [224, 92, 92],
  white:    [255, 255, 255],
  grey1:    [30, 30, 35],
  grey2:    [45, 45, 53],
  grey3:    [90, 88, 84],
};

function scoreColor(score) {
  if (score >= 80) return COLORS.green;
  if (score >= 65) return COLORS.goldLight;
  if (score >= 50) return COLORS.amber;
  return COLORS.red;
}

function gradeLabel(score) {
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

const AGENT_ORDER = [
  'content','conversion','seo','competitive','brand',
  'pr_media','social_proof','demand_gen','thought_leadership','growth_strategy'
];

export function downloadPDFReport(result) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 18; // margin
  const CW = W - M * 2; // content width

  // ── Cover Page ──────────────────────────────────────────────
  doc.setFillColor(...COLORS.ink);
  doc.rect(0, 0, 210, 297, 'F');

  // Gold top stripe
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 0, 210, 3, 'F');

  // Decorative vertical line
  doc.setFillColor(...COLORS.gold);
  doc.rect(M, 40, 0.5, 60, 'F');

  // PRaudit wordmark
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gold);
  doc.setCharSpace(3);
  doc.text('PRAUDIT AI', M + 6, 48);
  doc.setCharSpace(0);

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.grey3);
  doc.setCharSpace(1.5);
  doc.text('MARKETING INTELLIGENCE PLATFORM', M + 6, 55);
  doc.setCharSpace(0);

  // Report title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.paper);
  doc.text('Marketing Audit', M + 6, 80);
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.gold);
  doc.text('Report', M + 6, 92);

  // Website being audited
  const cleanUrl = result.url.replace(/^https?:\/\//, '');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.paperDim);
  doc.text(cleanUrl, M + 6, 104);

  // Overall score box
  const scoreColor = scoreColor_local(result.overall_score);
  doc.setFillColor(...COLORS.grey1);
  doc.roundedRect(M + 6, 118, 70, 42, 3, 3, 'F');
  doc.setFillColor(...scoreColor);
  doc.roundedRect(M + 6, 118, 2.5, 42, 1, 1, 'F');

  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...scoreColor);
  doc.text(String(result.overall_score), M + 18, 140);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.paperDim);
  doc.text('/ 100  Overall Score', M + 18, 148);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...scoreColor);
  doc.text(result.overall_grade, M + 68, 136);

  // Agent mini scores grid
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.grey3);
  doc.setCharSpace(1);
  doc.text('DIMENSION SCORES', M + 6, 172);
  doc.setCharSpace(0);

  const agentsArr = AGENT_ORDER.filter(k => result.agents[k]);
  const colW = CW / 5;
  agentsArr.forEach((key, i) => {
    const ag = result.agents[key];
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = M + col * colW;
    const y = 176 + row * 22;

    doc.setFillColor(...COLORS.grey1);
    doc.roundedRect(x, y, colW - 2, 18, 2, 2, 'F');

    const sc = scoreColor_local(ag.score);
    doc.setFillColor(...sc);
    doc.roundedRect(x, y, colW - 2, 1.5, 0.5, 0.5, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.grey3);
    const label = ag.agent.split('&')[0].trim().split(' ').slice(0,2).join(' ');
    doc.text(label, x + 3, y + 7);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...sc);
    doc.text(String(ag.score), x + 3, y + 14);
  });

  // Date / model footer on cover
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.grey3);
  doc.setCharSpace(0.8);
  const dateStr = new Date(result.analysed_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  doc.text(`Analysed ${dateStr}  ·  ${result.agent_count} agents  ·  ${result.model}`, M + 6, 280);
  doc.text('CONFIDENTIAL — Prepared by PRaudit AI', M + 6, 286);
  doc.setCharSpace(0);

  // Gold bottom stripe
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 294, 210, 3, 'F');

  // ── Page header helper ───────────────────────────────────────
  function addPageHeader(title) {
    doc.addPage();
    doc.setFillColor(...COLORS.ink);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setFillColor(...COLORS.gold);
    doc.rect(0, 0, 210, 1.5, 'F');
    doc.setFillColor(...COLORS.grey1);
    doc.rect(0, 1.5, 210, 16, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gold);
    doc.setCharSpace(2);
    doc.text('PRAUDIT AI', M, 11);
    doc.setCharSpace(0);
    doc.setTextColor(...COLORS.grey3);
    doc.setFontSize(7);
    doc.text(cleanUrl, W - M - doc.getTextWidth(cleanUrl), 11);
    doc.setFillColor(...COLORS.gold);
    doc.rect(0, 17.5, 210, 0.4, 'F');
    return 26; // starting Y
  }

  function addPageFooter(pageNum) {
    doc.setFillColor(...COLORS.grey1);
    doc.rect(0, 286, 210, 11, 'F');
    doc.setFillColor(...COLORS.gold);
    doc.rect(0, 294, 210, 3, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.grey3);
    doc.text('CONFIDENTIAL — PRaudit AI Marketing Intelligence', M, 292);
    doc.text(`Page ${pageNum}`, W - M - 10, 292);
  }

  // ── Executive Summary Page ───────────────────────────────────
  let y = addPageHeader('Executive Summary');
  let pageNum = 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.paper);
  doc.text('Executive Summary', M, y);
  y += 10;

  // Score bar chart
  const sorted = AGENT_ORDER
    .filter(k => result.agents[k])
    .map(k => ({ key: k, ...result.agents[k] }))
    .sort((a, b) => b.score - a.score);

  sorted.forEach((ag, i) => {
    const barY = y + i * 11;
    const sc = scoreColor_local(ag.score);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.paperDim);
    const label = `${ag.icon || ''} ${ag.agent}`.trim();
    doc.text(label, M, barY + 4.5);

    const barX = M + 64;
    const barW = CW - 64 - 22;
    doc.setFillColor(...COLORS.grey2);
    doc.roundedRect(barX, barY, barW, 7, 1, 1, 'F');
    doc.setFillColor(...sc);
    doc.roundedRect(barX, barY, barW * (ag.score / 100), 7, 1, 1, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...sc);
    doc.text(String(ag.score), barX + barW + 3, barY + 5.5);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.grey3);
    doc.text(ag.grade, barX + barW + 12, barY + 5.5);
  });

  y += sorted.length * 11 + 12;

  // Strengths vs Focus areas
  const top3 = sorted.slice(0, 3);
  const bot3 = sorted.slice(-3).reverse();
  const halfW = (CW - 6) / 2;

  // Strengths box
  doc.setFillColor(...COLORS.green[0], COLORS.green[1], COLORS.green[2], 0.08);
  doc.setFillColor(18, 42, 30);
  doc.roundedRect(M, y, halfW, 38, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.green);
  doc.setCharSpace(1.5);
  doc.text('▲ STRONGEST DIMENSIONS', M + 4, y + 8);
  doc.setCharSpace(0);
  top3.forEach((ag, i) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.paperDim);
    doc.text(`${ag.icon || ''} ${ag.agent}`, M + 4, y + 17 + i * 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.green);
    doc.text(String(ag.score), M + halfW - 14, y + 17 + i * 8);
  });

  // Focus areas box
  const fx = M + halfW + 6;
  doc.setFillColor(42, 30, 18);
  doc.roundedRect(fx, y, halfW, 38, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.amber);
  doc.setCharSpace(1.5);
  doc.text('↓ PRIORITY FOCUS AREAS', fx + 4, y + 8);
  doc.setCharSpace(0);
  bot3.forEach((ag, i) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.paperDim);
    doc.text(`${ag.icon || ''} ${ag.agent}`, fx + 4, y + 17 + i * 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.amber);
    doc.text(String(ag.score), fx + halfW - 14, y + 17 + i * 8);
  });

  addPageFooter(pageNum);

  // ── Individual Agent Pages ────────────────────────────────────
  AGENT_ORDER.filter(k => result.agents[k]).forEach((key, idx) => {
    const ag = result.agents[key];
    pageNum++;
    y = addPageHeader(ag.agent);

    // Agent header
    const sc = scoreColor_local(ag.score);
    doc.setFillColor(...COLORS.grey1);
    doc.roundedRect(M, y, CW, 28, 3, 3, 'F');
    doc.setFillColor(...sc);
    doc.roundedRect(M, y, 3, 28, 1, 1, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.paper);
    doc.text(`${ag.icon || ''} ${ag.agent}`, M + 8, y + 11);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.grey3);
    if (ag.category) doc.text(ag.category.toUpperCase(), M + 8, y + 19);

    // Score circle (simulated with text)
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...sc);
    doc.text(String(ag.score), W - M - 24, y + 16);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.grey3);
    doc.text(`/ 100  ${ag.grade}`, W - M - 24, y + 24);

    y += 34;

    // Summary
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.paperDim);
    const summaryLines = doc.splitTextToSize(ag.summary || '', CW);
    doc.text(summaryLines, M, y);
    y += summaryLines.length * 5.5 + 8;

    // Score bar
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.grey3);
    doc.setCharSpace(1);
    doc.text('PERFORMANCE', M, y);
    doc.setCharSpace(0);
    y += 4;
    doc.setFillColor(...COLORS.grey2);
    doc.roundedRect(M, y, CW, 6, 1.5, 1.5, 'F');
    doc.setFillColor(...sc);
    doc.roundedRect(M, y, CW * (ag.score / 100), 6, 1.5, 1.5, 'F');
    y += 12;

    // Three columns: Strengths | Improvements | Quick Wins
    const col3W = (CW - 8) / 3;

    function drawList(items, title, color, x, startY, maxItems = 4) {
      let cy = startY;
      doc.setFillColor(...COLORS.grey1);
      doc.roundedRect(x, cy, col3W, 3, 0, 0, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...color);
      doc.setCharSpace(1.2);
      doc.text(title, x + 2, cy + 5.5);
      doc.setCharSpace(0);
      cy += 10;

      const shown = (items || []).slice(0, maxItems);
      shown.forEach(item => {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.paper);
        const lines = doc.splitTextToSize('• ' + item, col3W - 4);
        lines.forEach(line => {
          if (cy < 275) {
            doc.text(line, x + 2, cy);
            cy += 5.5;
          }
        });
        cy += 1;
      });
      return cy;
    }

    const colY = y;
    drawList(ag.strengths, '✓ STRENGTHS', COLORS.green, M, colY);
    drawList(ag.improvements, '↑ IMPROVEMENTS', COLORS.amber, M + col3W + 4, colY);
    drawList(ag.quick_wins, '⚡ QUICK WINS', COLORS.gold, M + (col3W + 4) * 2, colY);

    // Move y below columns (estimate)
    y = colY + 65;

    // Key insight box
    const insight = ag.key_insight || ag.pr_angle || ag.top_story_angle ||
      ag.competitive_gap || ag.authority_gap || ag.funnel_gap ||
      ag.growth_lever || ag.positioning_opportunity || ag.revenue_impact ||
      ag.top_keyword_opportunity || ag.brand_archetype || '';

    if (insight && y < 255) {
      doc.setFillColor(25, 22, 8);
      doc.setDrawColor(...COLORS.gold);
      doc.setLineWidth(0.4);
      doc.roundedRect(M, y, CW, 3, 0, 0, 'F');
      doc.setFillColor(18, 16, 6);
      doc.roundedRect(M, y + 3, CW, 28, 0, 0, 'F');
      doc.setFillColor(25, 22, 8);
      doc.roundedRect(M, y + 28, CW, 3, 0, 0, 'F');

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.gold);
      doc.setCharSpace(1.5);
      doc.text('◈ KEY INSIGHT', M + 4, y + 10);
      doc.setCharSpace(0);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.paper);
      const insightLines = doc.splitTextToSize(insight, CW - 8);
      insightLines.slice(0, 3).forEach((line, i) => {
        doc.text(line, M + 4, y + 18 + i * 6);
      });
    }

    addPageFooter(pageNum);
  });

  // ── Quick Wins Summary Page ──────────────────────────────────
  pageNum++;
  y = addPageHeader('Quick Wins');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.paper);
  doc.text('Quick Wins Action Plan', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.grey3);
  doc.text('High-impact improvements implementable within 24–48 hours', M, y + 7);
  y += 16;

  let qwNum = 1;
  AGENT_ORDER.filter(k => result.agents[k]).forEach(key => {
    const ag = result.agents[key];
    if (!ag.quick_wins?.length) return;
    ag.quick_wins.forEach(win => {
      if (y > 272) return;
      const sc = scoreColor_local(ag.score);
      doc.setFillColor(...COLORS.grey1);
      doc.roundedRect(M, y, CW, 14, 2, 2, 'F');
      doc.setFillColor(...sc);
      doc.roundedRect(M, y, 2, 14, 0.5, 0.5, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.gold);
      doc.text(`${qwNum}.`, M + 5, y + 9);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.paper);
      const lines = doc.splitTextToSize(win, CW - 40);
      doc.text(lines[0] || win, M + 12, y + 9);

      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.grey3);
      doc.text(ag.agent, W - M - doc.getTextWidth(ag.agent), y + 9);

      y += 18;
      qwNum++;
    });
  });

  addPageFooter(pageNum);

  // ── Save ────────────────────────────────────────────────────
  const filename = `PRaudit_${cleanUrl.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
}

// helper local (avoids name collision with outer scope)
function scoreColor_local(score) {
  if (score >= 80) return COLORS.green;
  if (score >= 65) return COLORS.goldLight;
  if (score >= 50) return COLORS.amber;
  return COLORS.red;
}
