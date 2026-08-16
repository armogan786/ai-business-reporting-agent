// build_deck.js
// Stage 5 (presentation layer, non-agent): turns outputs/report_output.json
// -- the structured output of the 4-agent pipeline -- into a polished .pptx
// deck. Kept as plain code rather than another LLM call: slide layout and
// formatting is a deterministic, mechanical task once the content exists,
// so there's no reason to spend a model call on it.
//
// Usage: node build_deck.js

const pptxgen = require("pptxgenjs");
const fs = require("fs");

const NAVY = "0B1120";
const PANEL = "131B2E";
const TEAL = "2DD4BF";
const AMBER = "FBBF24";
const TEXT = "E5E9F0";
const MUTED = "94A3B8";
const WHITE = "FFFFFF";

const IMPORTANCE_COLOR = { high: AMBER, medium: TEAL, low: MUTED };

const report = JSON.parse(fs.readFileSync("outputs/report_output.json", "utf8"));

function newDeck() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.3" x 7.5"
  return pres;
}

function addBackground(slide, color) {
  slide.background = { color };
}

// ---- Slide 1: Title ----
function buildTitleSlide(pres) {
  const slide = pres.addSlide();
  addBackground(slide, NAVY);

  slide.addText("AGENTIC PIPELINE OUTPUT", {
    x: 0.7, y: 0.8, w: 8, h: 0.4,
    fontFace: "Consolas", fontSize: 12, color: TEAL, charSpacing: 2,
  });
  slide.addText(report.title, {
    x: 0.7, y: 1.3, w: 11.5, h: 1.6,
    fontFace: "Georgia", fontSize: 40, bold: true, color: WHITE,
    margin: 0,
  });
  slide.addText("Generated autonomously by a 4-stage AI agent pipeline", {
    x: 0.7, y: 2.9, w: 9, h: 0.5,
    fontFace: "Arial", fontSize: 15, color: MUTED, italic: true,
  });

  const stages = ["Profiler", "Insight Agent", "Strategy Agent", "Report Composer"];
  stages.forEach((s, i) => {
    const x = 0.7 + i * 2.9;
    slide.addShape(pres.ShapeType.roundRect, {
      x, y: 4.2, w: 2.6, h: 0.8, rectRadius: 0.08,
      fill: { color: PANEL }, line: { color: "1E293B", width: 1 },
    });
    slide.addText(String(i + 1), {
      x: x + 0.15, y: 4.35, w: 0.5, h: 0.5,
      fontFace: "Consolas", fontSize: 18, bold: true, color: TEAL, align: "center",
      margin: 0,
    });
    slide.addText(s, {
      x: x + 0.6, y: 4.4, w: 1.9, h: 0.4,
      fontFace: "Arial", fontSize: 12.5, bold: true, color: TEXT,
      margin: 0,
    });
    if (i < 3) {
      slide.addShape(pres.ShapeType.line, {
        x: x + 2.6, y: 4.6, w: 0.3, h: 0,
        line: { color: "334155", width: 1.5 },
      });
    }
  });

  slide.addText(`Data source: retail sales dataset, ${report.stats.row_count} rows`, {
    x: 0.7, y: 6.9, w: 8, h: 0.3,
    fontFace: "Consolas", fontSize: 9.5, color: "475569",
  });
}

// ---- Slide 2: Executive Summary ----
function buildSummarySlide(pres) {
  const slide = pres.addSlide();
  addBackground(slide, WHITE);

  slide.addText("EXECUTIVE SUMMARY", {
    x: 0.7, y: 0.6, w: 8, h: 0.4,
    fontFace: "Consolas", fontSize: 12, color: "0F766E", charSpacing: 2,
  });
  slide.addText(report.executive_summary, {
    x: 0.7, y: 1.3, w: 11.5, h: 3,
    fontFace: "Georgia", fontSize: 22, color: "1E293B", lineSpacingMultiple: 1.35,
    margin: 0,
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.7, y: 4.7, w: 11.5, h: 1.6, rectRadius: 0.08,
    fill: { color: "F1F5F9" }, line: { color: "E2E8F0", width: 1 },
  });
  slide.addText("BOTTOM LINE", {
    x: 1.0, y: 4.9, w: 4, h: 0.35,
    fontFace: "Consolas", fontSize: 10.5, color: "0F766E", charSpacing: 1.5,
  });
  slide.addText(report.closing_line, {
    x: 1.0, y: 5.25, w: 10.9, h: 0.9,
    fontFace: "Arial", fontSize: 16, italic: true, color: "334155",
    margin: 0,
  });
}

// ---- Slide 3: Key Findings ----
function buildFindingsSlide(pres) {
  const slide = pres.addSlide();
  addBackground(slide, NAVY);

  slide.addText("KEY FINDINGS", {
    x: 0.7, y: 0.5, w: 8, h: 0.4,
    fontFace: "Consolas", fontSize: 12, color: TEAL, charSpacing: 2,
  });
  slide.addText("What the Insight Agent surfaced", {
    x: 0.7, y: 0.85, w: 9, h: 0.5,
    fontFace: "Georgia", fontSize: 22, bold: true, color: WHITE,
  });

  const insights = report.insights.slice(0, 4);
  const colW = 5.6, gap = 0.3;
  insights.forEach((ins, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.7 + col * (colW + gap);
    const y = 1.7 + row * 2.5;

    slide.addShape(pres.ShapeType.roundRect, {
      x, y, w: colW, h: 2.2, rectRadius: 0.08,
      fill: { color: PANEL }, line: { color: "1E293B", width: 1 },
    });
    const badgeColor = IMPORTANCE_COLOR[ins.importance] || MUTED;
    slide.addShape(pres.ShapeType.roundRect, {
      x: x + 0.3, y: y + 0.25, w: 1.1, h: 0.32, rectRadius: 0.16,
      fill: { color: badgeColor, transparency: 80 },
      line: { type: "none" },
    });
    slide.addText(ins.importance.toUpperCase(), {
      x: x + 0.3, y: y + 0.25, w: 1.1, h: 0.32,
      fontFace: "Consolas", fontSize: 9, bold: true, color: badgeColor,
      align: "center", valign: "middle", margin: 0,
    });
    slide.addText(ins.title, {
      x: x + 0.3, y: y + 0.68, w: colW - 0.6, h: 0.6,
      fontFace: "Arial", fontSize: 15, bold: true, color: WHITE,
      margin: 0,
    });
    slide.addText(ins.detail, {
      x: x + 0.3, y: y + 1.25, w: colW - 0.6, h: 0.85,
      fontFace: "Arial", fontSize: 11, color: MUTED, lineSpacingMultiple: 1.25,
      margin: 0,
    });
  });
}

// ---- Slide 4: Regional Revenue Chart ----
function buildChartSlide(pres) {
  const slide = pres.addSlide();
  addBackground(slide, WHITE);

  slide.addText("SUPPORTING DATA", {
    x: 0.7, y: 0.5, w: 8, h: 0.4,
    fontFace: "Consolas", fontSize: 12, color: "0F766E", charSpacing: 2,
  });
  slide.addText("Revenue by Region", {
    x: 0.7, y: 0.85, w: 9, h: 0.5,
    fontFace: "Georgia", fontSize: 22, bold: true, color: "1E293B",
  });

  const chartData = [
    {
      name: "Revenue",
      labels: ["North", "West", "East", "South"],
      values: [1210500, 1184500, 847000, 565000],
    },
  ];

  slide.addChart(pres.ChartType.bar, chartData, {
    x: 0.7, y: 1.6, w: 11.5, h: 4.8,
    barDir: "col",
    showTitle: false,
    showLegend: false,
    showValue: true,
    dataLabelPosition: "outEnd",
    dataLabelColor: "1E293B",
    dataLabelFontSize: 11,
    chartColors: [TEAL, "0F766E", "0F766E", "F59E0B"],
    invertedColors: [TEAL, "0F766E", "0F766E", "F59E0B"],
    catAxisLabelColor: "475569",
    catAxisLabelFontSize: 12,
    valAxisLabelColor: "94A3B8",
    valAxisLabelFontSize: 10,
    valGridLine: { color: "E2E8F0", size: 1 },
    catGridLine: { style: "none" },
  });

  slide.addText("South is the only region below its regional peers on both revenue and growth.", {
    x: 0.7, y: 6.7, w: 11, h: 0.4,
    fontFace: "Arial", fontSize: 12, italic: true, color: "64748B",
  });
}

// ---- Slide 5: Recommendations ----
function buildRecsSlide(pres) {
  const slide = pres.addSlide();
  addBackground(slide, NAVY);

  slide.addText("RECOMMENDATIONS", {
    x: 0.7, y: 0.5, w: 8, h: 0.4,
    fontFace: "Consolas", fontSize: 12, color: TEAL, charSpacing: 2,
  });
  slide.addText("What the Strategy Agent proposes", {
    x: 0.7, y: 0.85, w: 9, h: 0.5,
    fontFace: "Georgia", fontSize: 22, bold: true, color: WHITE,
  });

  const recs = report.recommendations.slice(0, 3);
  const rowH = 1.55;
  recs.forEach((r, i) => {
    const y = 1.75 + i * (rowH + 0.15);
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.7, y, w: 11.5, h: rowH, rectRadius: 0.08,
      fill: { color: PANEL }, line: { color: "1E293B", width: 1 },
    });
    slide.addShape(pres.ShapeType.ellipse, {
      x: 0.95, y: y + 0.3, w: 0.55, h: 0.55,
      fill: { color: TEAL, transparency: 85 }, line: { color: TEAL, width: 1 },
    });
    slide.addText(String(i + 1), {
      x: 0.95, y: y + 0.3, w: 0.55, h: 0.55,
      fontFace: "Consolas", fontSize: 16, bold: true, color: TEAL,
      align: "center", valign: "middle", margin: 0,
    });
    slide.addText(r.title, {
      x: 1.7, y: y + 0.15, w: 10.2, h: 0.4,
      fontFace: "Arial", fontSize: 15, bold: true, color: WHITE, margin: 0,
    });
    slide.addText(r.action, {
      x: 1.7, y: y + 0.55, w: 10.2, h: 0.45,
      fontFace: "Arial", fontSize: 11.5, color: MUTED, margin: 0,
    });
    slide.addText("Expected impact: " + r.expected_impact, {
      x: 1.7, y: y + 1.0, w: 10.2, h: 0.45,
      fontFace: "Arial", fontSize: 10.5, italic: true, color: TEAL, margin: 0,
    });
  });
}

const pres = newDeck();
buildTitleSlide(pres);
buildSummarySlide(pres);
buildFindingsSlide(pres);
buildChartSlide(pres);
buildRecsSlide(pres);

pres.writeFile({ fileName: "outputs/Agent_Generated_Report.pptx" }).then(() => {
  console.log("Deck written to outputs/Agent_Generated_Report.pptx");
});
