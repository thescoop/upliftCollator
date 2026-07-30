"""Minimal client for a local LM Studio server (OpenAI-compatible API).

The mechanics here are inherited from ``~/coding/LeapForward`` (leapforward_app/
llm.py), which learned them the hard way against the same machine and the same
class of work. Kept deliberately thinner than LeapForward's version — the
narrator makes two calls per case, not hundreds per bill — but the hard-won
details are copied verbatim in spirit:

* ``/api/v0/models`` (LM Studio's richer native API) reports *downloaded*
  models and which are *loaded*; the OpenAI ``/v1/models`` endpoint cannot.
* ``reasoning_effort: "none"`` is the only switch LM Studio honours for
  think-by-default families. Template flags (``enable_thinking``,
  ``chat_template_kwargs``) are ignored. Without it Gemma 4 and Qwen 3.5+
  spend the entire token budget reasoning and return an empty reply.
* ``lms`` streams a non-ASCII progress bar, so its output must be decoded as
  UTF-8 explicitly or a *successful* load is reported as a hard failure.

Divergence from LeapForward: this module uses stdlib ``urllib`` rather than
``requests``, because the ``uplift-narrate`` conda env does not have requests
and adding it would force everyone to re-run ``_setup``.

Base-URL resolution matters under WSL: when the narrator runs in WSL but LM
Studio runs on Windows, ``localhost`` does not forward — the server is on the
WSL2 gateway IP, which changes across reboots. Resolved at call time, never
cached to disk.

Nothing here leaves the machine. That is what makes the polish step safe for
privileged client material.
"""

from __future__ import annotations

import json
import os
import re
import socket
import struct
import subprocess
import urllib.error
import urllib.request
from typing import Callable, Iterator

DEFAULT_PORT = 1234
CONNECT_TIMEOUT = 3
READ_TIMEOUT = 900  # a long narrative on a 26B model can genuinely take minutes

# Constrained faithful-rewrite task, not creative generation: a low temperature
# keeps wording stable between runs on the same case.
DEFAULT_TEMPERATURE = 0.2
DEFAULT_CONTEXT_SIZE = 16384

# Preferred model, in order. Gemma-4-26b-a4b-qat leads on the evidence of the
# LeapForward bake-off (docs/model_comparison.md, 2026-05-17): against
# gpt-oss-20b on real Legal Aid bills it never fabricated work that had not
# happened and never duplicated a quantity. On audited LAA work,
# plausible-but-wrong is the worst failure class — the same reason it is the
# right default here. The QAT build is pinned first because the bare name is a
# prefix of the slower non-QAT variant that spills VRAM on a 16GB card.
PREFERRED_MODEL_HINTS = ("gemma-4-26b-a4b-qat", "gemma-4-26b-a4b", "gemma-4", "gemma")

# Think-by-default families. See the module docstring.
THINKING_OFF_PATTERNS = ("qwen3", "qwen-3", "gemma-4", "gemma4")


class LMStudioError(RuntimeError):
    """Raised with a message that tells the user what to actually do."""


class ModelSwapRequired(LMStudioError):
    """Loading the requested model would unload one already in use.

    On a 16GB card two models of this size cannot coexist, so switching means
    evicting whatever is there — which may belong to another application
    (LeapForward, say) that is mid-run. Never done silently.
    """

    def __init__(self, wanted: str, loaded: list[str]):
        self.wanted = wanted
        self.loaded = loaded
        super().__init__(
            f"{', '.join(loaded)} is currently loaded in LM Studio and may be in "
            f"use by another application. Loading {wanted} would unload it."
        )


# ── Server discovery ────────────────────────────────────────────────────────

def _wsl_gateway_ip() -> str | None:
    """Default-route gateway from /proc/net/route (Linux/WSL only)."""
    try:
        with open("/proc/net/route", encoding="utf-8") as fh:
            next(fh)  # header
            for line in fh:
                fields = line.split()
                if len(fields) > 2 and fields[1] == "00000000":  # destination 0.0.0.0
                    return socket.inet_ntoa(struct.pack("<L", int(fields[2], 16)))
    except (OSError, StopIteration, ValueError):
        pass
    return None


def _reachable(host: str) -> bool:
    try:
        with urllib.request.urlopen(f"{host}/v1/models", timeout=CONNECT_TIMEOUT):
            return True
    except (urllib.error.URLError, OSError):
        return False


def resolve_host() -> str:
    """Find a live LM Studio server, or explain why there isn't one.

    Returns the host root (no /v1 suffix) so both the OpenAI-compatible and
    the native /api/v0 endpoints can be reached from it.
    """
    override = os.environ.get("UPLIFT_LMSTUDIO_URL", "").strip().rstrip("/")
    if override:
        if _reachable(override):
            return override
        raise LMStudioError(
            f"UPLIFT_LMSTUDIO_URL is set to {override} but nothing answered there.\n"
            "Unset it to fall back to auto-detection, or correct the address."
        )

    candidates = [f"http://127.0.0.1:{DEFAULT_PORT}"]
    gateway = _wsl_gateway_ip()
    if gateway:  # WSL → Windows-hosted LM Studio
        candidates.append(f"http://{gateway}:{DEFAULT_PORT}")

    for host in candidates:
        if _reachable(host):
            return host

    raise LMStudioError(
        "Could not reach LM Studio on " + " or ".join(candidates) + ".\n\n"
        "In LM Studio: Developer tab → turn the server on, and load a model.\n"
        "If it runs on a non-default port, set UPLIFT_LMSTUDIO_URL to its address."
    )


def _get_json(url: str, timeout: int = CONNECT_TIMEOUT) -> dict:
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def model_catalog(host: str) -> tuple[list[str], list[str]]:
    """Return (all downloaded chat models, those currently loaded).

    Prefers LM Studio's native /api/v0 so the picker can offer everything
    downloaded, not just what currently occupies VRAM. Falls back to the
    OpenAI-compatible endpoint, which only reports loaded models — there both
    lists are the same.
    """
    try:
        payload = _get_json(f"{host}/api/v0/models")
        models: list[str] = []
        loaded: list[str] = []
        for item in payload.get("data", []):
            if item.get("type") not in {"llm", "vlm"}:
                continue
            model_id = str(item.get("id") or "")
            if not model_id:
                continue
            models.append(model_id)
            if item.get("state") == "loaded":
                loaded.append(model_id)
        if models:
            return sorted(models), sorted(loaded)
    except (urllib.error.URLError, OSError, json.JSONDecodeError, ValueError):
        pass  # older LM Studio without /api/v0

    try:
        payload = _get_json(f"{host}/v1/models")
    except (urllib.error.URLError, OSError, json.JSONDecodeError) as exc:
        raise LMStudioError(f"LM Studio did not return a model list: {exc}") from exc

    ids = sorted(str(m.get("id")) for m in payload.get("data", []) if m.get("id"))
    return ids, ids


def choose_model(models: list[str], preferred: str = "") -> str:
    """Pick a model: an exact/prefix match on `preferred`, else the best hint."""
    if not models:
        return ""
    if preferred:
        if preferred in models:
            return preferred
        for candidate in models:
            if candidate.lower().startswith(preferred.lower()):
                return candidate
    for hint in PREFERRED_MODEL_HINTS:
        for candidate in models:
            if hint in candidate.lower():
                return candidate
    return models[0]


def model_state(host: str, model_id: str) -> str:
    """"loaded", "not-loaded", or "" when /api/v0 is unavailable."""
    try:
        payload = _get_json(f"{host}/api/v0/models")
    except (urllib.error.URLError, OSError, json.JSONDecodeError):
        return ""
    for item in payload.get("data", []):
        if item.get("id") == model_id:
            return str(item.get("state") or "")
    return ""


# ── Model loading via the lms CLI ───────────────────────────────────────────

def _lms_candidates() -> list[str]:
    """Possible `lms` binaries, including the Windows one seen from WSL."""
    candidates = [
        "lms",
        os.path.expanduser("~/.lmstudio/bin/lms"),
        os.path.expanduser("~/.lmstudio/bin/lms.exe"),
    ]
    # Under WSL, LM Studio is installed on the Windows side; $HOME is Linux.
    windows_user = os.environ.get("WSL_WINDOWS_USER", "thescoop")
    candidates.append(f"/mnt/c/Users/{windows_user}/.lmstudio/bin/lms.exe")
    return candidates


def run_lms(args: list[str], timeout: int) -> str:
    """Run an lms CLI command. Returns an error message, or "" on success."""
    for binary in _lms_candidates():
        try:
            # lms streams a non-ASCII progress bar. Without an explicit codec
            # Python decodes with the OS default (cp1252 on Windows), which
            # raises UnicodeDecodeError and reports a SUCCESSFUL load as a
            # hard failure. Inherited from LeapForward.
            result = subprocess.run(
                [binary, *args],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout,
            )
            if result.returncode == 0:
                return ""
            detail = (result.stderr or result.stdout or "").strip()[-400:]
            return f"lms {args[0]} failed: {detail or 'unknown error'}"
        except FileNotFoundError:
            continue
        except subprocess.TimeoutExpired:
            return f"lms {args[0]} timed out after {timeout}s"
        except OSError as exc:
            return f"lms {args[0]} failed: {exc}"
    return "LM Studio CLI (lms) not found — load the model in LM Studio manually."


def loaded_context(host: str, model_id: str) -> int:
    """Context length a loaded model was loaded with, or 0 if unknown.

    Read-only insight: the OpenAI-compatible endpoint cannot report or change
    this. Matters when another application loaded the model at a smaller
    context than the narrator would have chosen — a long narrative can then
    overflow, and the resulting error otherwise points at the wrong cause.
    """
    try:
        payload = _get_json(f"{host}/api/v0/models")
    except (urllib.error.URLError, OSError, json.JSONDecodeError):
        return 0
    for item in payload.get("data", []):
        if item.get("id") == model_id:
            return int(item.get("loaded_context_length") or 0)
    return 0


def swap_needed(host: str, model_id: str) -> list[str]:
    """Models that would be unloaded to make room for model_id.

    Empty when the model is already loaded, when nothing is loaded, or when
    /api/v0 is unavailable and the state is therefore unknown.
    """
    try:
        _, loaded = model_catalog(host)
    except LMStudioError:
        return []
    if not loaded or model_id in loaded:
        return []
    return loaded


def ensure_model_loaded(
    host: str,
    model_id: str,
    context_size: int = DEFAULT_CONTEXT_SIZE,
    *,
    allow_swap: bool = False,
) -> str:
    """Make model_id the loaded model. Returns an error message, or "".

    Unloads whatever holds the VRAM first — on a 16GB card two models of this
    size cannot coexist. That eviction can belong to another application, so it
    requires ``allow_swap``; otherwise ModelSwapRequired is raised for the
    caller to confirm with the user. When /api/v0 is unavailable the state is
    unknown, so do nothing and rely on LM Studio's just-in-time loading.
    """
    state = model_state(host, model_id)
    if state == "loaded" or not state:
        return ""

    evicted = swap_needed(host, model_id)
    if evicted and not allow_swap:
        raise ModelSwapRequired(model_id, evicted)

    error = run_lms(["unload", "--all"], timeout=120)
    if error:
        return error
    return run_lms(["load", model_id, "--context-length", str(int(context_size)), "-y"], timeout=600)


# ── Chat ────────────────────────────────────────────────────────────────────

def forces_thinking_off(model: str) -> bool:
    lowered = str(model or "").lower()
    return any(pattern in lowered for pattern in THINKING_OFF_PATTERNS)


def _stream_deltas(resp) -> Iterator[tuple[str, str]]:
    """Yield (kind, text) pairs from an OpenAI-style SSE stream.

    kind is "content" or "reasoning" — reasoning is surfaced separately so an
    otherwise baffling empty reply can be explained in the log.
    """
    for raw in resp:
        line = raw.decode("utf-8", errors="replace").strip()
        if not line.startswith("data:"):
            continue
        body = line[len("data:"):].strip()
        if body == "[DONE]":
            return
        try:
            chunk = json.loads(body)
        except json.JSONDecodeError:
            continue
        for choice in chunk.get("choices", []):
            delta = choice.get("delta", {})
            if delta.get("content"):
                yield "content", delta["content"]
            reasoning = delta.get("reasoning") or delta.get("reasoning_content")
            if reasoning:
                yield "reasoning", reasoning


def chat(
    system: str,
    user: str,
    model: str,
    host: str,
    *,
    temperature: float = DEFAULT_TEMPERATURE,
    on_token: Callable[[str], None] | None = None,
    should_stop: Callable[[], bool] | None = None,
) -> str:
    """Run one chat completion and return the content (reasoning stripped)."""
    payload: dict = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "stream": True,
    }
    if forces_thinking_off(model):
        # See module docstring — the only switch LM Studio actually honours.
        payload["reasoning_effort"] = "none"

    req = urllib.request.Request(
        f"{host}/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    content: list[str] = []
    reasoning: list[str] = []
    try:
        with urllib.request.urlopen(req, timeout=READ_TIMEOUT) as resp:
            for kind, piece in _stream_deltas(resp):
                if kind == "content":
                    content.append(piece)
                    if on_token:
                        on_token(piece)
                else:
                    reasoning.append(piece)
                if should_stop and should_stop():
                    break
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:400]
        raise LMStudioError(
            f"LM Studio rejected the request ({exc.code}). "
            f"Is the model {model!r} loaded?\n\n{detail}"
        ) from exc
    except (urllib.error.URLError, OSError) as exc:
        raise LMStudioError(
            f"Lost contact with LM Studio at {host}: {exc}\n"
            "The server may have stopped, or the model may have been unloaded."
        ) from exc

    text = "".join(content).strip()
    if not text:
        if reasoning:
            raise LMStudioError(
                f"{model} spent its whole budget on hidden reasoning and returned "
                "no answer. It is a think-by-default model that was not switched "
                "off — add its name to THINKING_OFF_PATTERNS in lmstudio.py."
            )
        raise LMStudioError(
            "LM Studio returned an empty response. The model may have failed to "
            "load, or the prompt may exceed its context length."
        )
    return text
