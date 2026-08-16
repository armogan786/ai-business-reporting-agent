"""
pipeline.py
Orchestrates the full 4-stage agent pipeline end-to-end:

    Stage 1: Profiler       (local, deterministic pandas aggregation)
    Stage 2: Insight Agent  (LLM)
    Stage 3: Strategy Agent (LLM)
    Stage 4: Report Composer (LLM)

Usage:
    export GEMINI_API_KEY=your-key-here   # free key: aistudio.google.com/apikey
    python pipeline.py sample_data.csv

Writes the final structured report to outputs/report_output.json, which
build_deck.js then turns into a polished .pptx slide deck.
"""

import json
import sys
from pathlib import Path

import pandas as pd

from profiler import profile_dataframe
from agents import run_insight_agent, run_strategy_agent, run_report_composer


def run_pipeline(csv_path: str) -> dict:
    print(f"[1/4] Profiling data from {csv_path} ...")
    df = pd.read_csv(csv_path)
    stats = profile_dataframe(df)
    print(f"      -> {stats['row_count']} rows, "
          f"{len(stats['categorical_columns'])} categorical / "
          f"{len(stats['numeric_columns'])} numeric columns")

    print("[2/4] Running insight agent ...")
    insights = run_insight_agent(stats)
    print(f"      -> {len(insights)} insights generated")

    print("[3/4] Running strategy agent ...")
    recommendations = run_strategy_agent(insights)
    print(f"      -> {len(recommendations)} recommendations generated")

    print("[4/4] Composing executive report ...")
    report = run_report_composer(insights, recommendations)

    output = {
        "title": report["title"],
        "executive_summary": report["executive_summary"],
        "closing_line": report["closing_line"],
        "insights": insights,
        "recommendations": recommendations,
        "stats": stats,
    }
    return output


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python pipeline.py <path_to_csv>")
        sys.exit(1)

    result = run_pipeline(sys.argv[1])

    out_dir = Path("outputs")
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "report_output.json"
    out_path.write_text(json.dumps(result, indent=2))

    print(f"\nDone. Report written to {out_path}")
    print(f"Next: node build_deck.js  (turns this JSON into a .pptx deck)")
