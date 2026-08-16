"""
agents.py
Stages 2-4 of the pipeline: the three LLM-based agents.

Each agent has ONE narrow job and a strict output contract (JSON schema
described in its system prompt). This is a deliberate design choice: a
single agent asked to "analyze this data and write a report" tends to
produce shallower, less structured output than a pipeline of focused
agents that each do one thing well and hand off to the next. It also
makes each stage independently testable and debuggable -- if the final
report looks wrong, you can inspect exactly which stage produced the
bad output.
"""

from typing import Any, Dict, List

from llm_client import get_json_response


def run_insight_agent(stats: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Takes the statistical summary from the profiler and extracts the most
    important, non-obvious business insights from it.
    """
    system_prompt = (
        "You are a business insight analyst. Given structured data statistics, "
        "identify the most important, non-obvious business insights. Respond "
        "ONLY with JSON, no preamble, no markdown fences: "
        '{"insights":[{"title":string,"detail":string,'
        '"importance":"high"|"medium"|"low"}]} '
        "Return 3 to 5 insights, ordered by importance."
    )
    user_prompt = f"Data statistics:\n{stats}"
    result = get_json_response(system_prompt, user_prompt)
    return result["insights"]


def run_strategy_agent(insights: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Takes the insights and proposes concrete, prioritized recommendations.
    Deliberately a SEPARATE agent from the insight agent: generating an
    observation ("Category X underperforms") and generating a recommendation
    ("here's what to do about it, and why") are different reasoning tasks,
    and separating them produces more grounded recommendations than asking
    one agent to do both at once.
    """
    system_prompt = (
        "You are a strategy consultant. Given a list of business insights, "
        "propose concrete, prioritized recommendations. Respond ONLY with "
        "JSON, no preamble, no markdown fences: "
        '{"recommendations":[{"title":string,"action":string,'
        '"expected_impact":string}]} '
        "Return 2 to 4 recommendations."
    )
    user_prompt = f"Insights:\n{insights}"
    result = get_json_response(system_prompt, user_prompt)
    return result["recommendations"]


def run_report_composer(
    insights: List[Dict[str, str]], recommendations: List[Dict[str, str]]
) -> Dict[str, str]:
    """
    Takes insights + recommendations and composes the final executive-ready
    summary. This is the "presentation layer" agent -- its only job is
    communication quality, not analysis, which is why it runs last and
    receives already-analyzed content rather than raw data.
    """
    system_prompt = (
        "You are a report composer. Given business insights and "
        "recommendations, write a short, polished executive summary suitable "
        "for a leadership audience. Respond ONLY with JSON, no preamble, no "
        "markdown fences: "
        '{"title":string,"executive_summary":string (3-4 sentences),'
        '"closing_line":string (one sentence)}'
    )
    user_prompt = f"Insights:\n{insights}\n\nRecommendations:\n{recommendations}"
    return get_json_response(system_prompt, user_prompt)
