"""
profiler.py
Stage 1 of the pipeline: Data Profiler.

Deliberately NOT an LLM call. Raw datasets can be large and expensive to hand
directly to a language model, and LLMs are unreliable at precise arithmetic
over many rows. Instead, this stage does exact, deterministic aggregation in
pandas, and produces a compact statistical summary. That summary is what gets
passed to the LLM-based agents downstream -- they reason over pre-computed
facts, they don't compute the facts themselves.
"""

from typing import Any, Dict, List
import pandas as pd


def profile_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Produces a compact statistical summary of a business dataset:
    - numeric vs categorical column detection
    - per-category breakdowns (sum of each numeric column, grouped by each
      categorical column), sorted by the primary metric
    - overall totals for each numeric column

    The "primary metric" is assumed to be the first numeric column -- for
    business data this is typically the main KPI (revenue, units, etc.).
    Callers can reorder columns before calling this if a different column
    should be treated as primary.
    """
    numeric_cols: List[str] = df.select_dtypes(include="number").columns.tolist()
    categorical_cols: List[str] = [c for c in df.columns if c not in numeric_cols]

    if not numeric_cols:
        raise ValueError("No numeric columns found -- nothing to profile.")

    primary_metric = numeric_cols[0]

    breakdowns: Dict[str, Any] = {}
    for cat_col in categorical_cols:
        grouped = df.groupby(cat_col)[numeric_cols].sum()
        grouped["row_count"] = df.groupby(cat_col).size()
        grouped = grouped.sort_values(primary_metric, ascending=False)
        breakdowns[cat_col] = grouped.reset_index().to_dict(orient="records")

    summary = {
        "row_count": len(df),
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "primary_metric": primary_metric,
        "overall_totals": df[numeric_cols].sum().round(2).to_dict(),
        "breakdowns": breakdowns,
    }
    return summary
