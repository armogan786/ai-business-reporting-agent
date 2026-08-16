# AI Agent for Automated Business Reporting

A 4-stage AI agent pipeline that takes a raw business dataset (CSV) and
autonomously produces a client-ready insights report and slide deck —
no manual analysis in between.

## Why this exists

Junior consultants and analysts spend hours turning raw data into a
polished report: profile the data, find the story in it, decide what to
recommend, then write it up for leadership. This project automates that
entire chain with a pipeline of specialized AI agents, each responsible
for one step, handing off structured output to the next.

## Architecture

```
CSV data
   │
   ▼
[1] Profiler        — local pandas aggregation (no LLM; exact arithmetic,
   │                   compresses raw rows into a compact stats summary)
   ▼
[2] Insight Agent    — LLM: finds the most important, non-obvious findings
   │                   in the stats summary
   ▼
[3] Strategy Agent   — LLM: turns findings into concrete, prioritized
   │                   recommendations
   ▼
[4] Report Composer  — LLM: writes the executive summary in a polished,
   │                   leadership-ready tone
   ▼
[5] Deck Builder     — deterministic code (not an LLM call): renders the
                        structured output into a formatted .pptx deck
```

Each LLM stage has ONE narrow job with a strict JSON output contract —
deliberately not one large "analyze everything and write a report" prompt.
This makes each stage independently testable, and means a bad final report
can be traced to exactly which stage produced the weak output.

## Run it

```bash
pip install -r requirements.txt
export GEMINI_API_KEY=your-key-here   # free key: aistudio.google.com/apikey

python pipeline.py sample_data.csv     # runs stages 1-4
node build_deck.js                     # runs stage 5, produces the .pptx
```

Uses Google's Gemini API (free tier, no billing required to start). The
pipeline only makes 3 short calls per run, well within free-tier limits.

Output: `outputs/report_output.json` (structured report) and
`outputs/Agent_Generated_Report.pptx` (the slide deck).

## Files

- `profiler.py` — Stage 1, local data profiling
- `llm_client.py` — thin Gemini API wrapper, swappable to another provider
- `agents.py` — Stages 2-4, the three LLM agents
- `pipeline.py` — orchestrates the full run
- `build_deck.js` — Stage 5, turns the JSON report into a .pptx
- `sample_data.csv` — example dataset (regional/product sales)
- `outputs/` — example output already included, so you can see the result
  without needing an API key

## Tools

Python (pandas, requests) for the agent pipeline · pptxgenjs (Node)
for deck generation · Google Gemini (gemini-2.5-flash) as the underlying
model, chosen for its free tier
