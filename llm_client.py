"""
llm_client.py
Thin wrapper around the Gemini API, used by every LLM-based agent stage.

Kept as a single, small module so the model/provider is swappable in one
place. The agent stages (agents.py) only ever call
`get_json_response(system_prompt, user_prompt)` and don't know or care
which provider is behind it -- this file is the only one that would need
to change to swap providers again later.

Uses Google's free-tier Gemini API (no billing required to start).
Get a key at: https://aistudio.google.com/apikey
"""

import json
import os
import re
from typing import Any, Dict

import requests
from dotenv import load_dotenv

load_dotenv()  # picks up GEMINI_API_KEY from a local .env file, if present

# Google periodically renames/retires free-tier models. If this stops
# working, check https://ai.google.dev/gemini-api/docs/pricing for the
# current free-tier model list and update this constant (or set the
# GEMINI_MODEL environment variable instead of editing code).
MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
MAX_OUTPUT_TOKENS = 1000


def _get_api_key() -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY environment variable not set. "
            "Get a free key from https://aistudio.google.com/apikey and set it, e.g.:\n"
            "  export GEMINI_API_KEY=your-key-here"
        )
    return api_key


def _extract_json(text: str) -> Dict[str, Any]:
    """
    Agents are instructed to return JSON only, but models occasionally wrap
    output in markdown code fences despite instructions. Strip those
    defensively before parsing, rather than trusting raw output blindly.
    """
    cleaned = re.sub(r"```json|```", "", text).strip()
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"No JSON object found in model output:\n{text}")
    return json.loads(cleaned[start : end + 1])


def get_json_response(system_prompt: str, user_prompt: str) -> Dict[str, Any]:
    """
    Sends a single request to Gemini and parses the response as JSON.
    Every agent stage in this pipeline uses this -- each stage is a single,
    focused call with a narrow, well-defined job (see agents.py), rather
    than one large open-ended "do everything" prompt.
    """
    api_key = _get_api_key()
    url = f"{API_BASE}/{MODEL}:generateContent?key={api_key}"

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "maxOutputTokens": MAX_OUTPUT_TOKENS,
            "temperature": 0.4,
        },
    }

    response = requests.post(url, json=payload, timeout=60)
    if not response.ok:
        raise RuntimeError(
            f"Gemini API request failed ({response.status_code}): {response.text}"
        )

    data = response.json()
    try:
        candidate = data["candidates"][0]
        parts = candidate["content"]["parts"]
        text = "".join(p.get("text", "") for p in parts)
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"Unexpected Gemini response shape: {data}") from exc

    if not text.strip():
        finish_reason = data.get("candidates", [{}])[0].get("finishReason", "unknown")
        raise RuntimeError(
            f"Gemini returned an empty response (finishReason: {finish_reason}). "
            f"This can happen if maxOutputTokens is too low for the requested JSON -- "
            f"try increasing MAX_OUTPUT_TOKENS in llm_client.py."
        )

    return _extract_json(text)
