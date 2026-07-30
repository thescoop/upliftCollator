"""The polish step: skeleton → flowing narrative → verification.

Shared by the CLI and the GUI so both run exactly the same pipeline. Split
into three small steps rather than one call so a caller can re-polish with a
different model without re-extracting the PDF, and so a failed verification
never discards a good narrative.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

import checks
import lmstudio
import prompts


@dataclass
class PolishResult:
    """Everything one polish run produced, including what went wrong."""

    polished: str = ""
    model: str = ""
    check: checks.CheckResult | None = None
    llm_verification: str = ""
    verification_error: str = ""

    @property
    def ok(self) -> bool:
        return bool(self.polished) and bool(self.check) and self.check.ok


def prepare(model_hint: str = "", context_size: int = lmstudio.DEFAULT_CONTEXT_SIZE) -> tuple[str, str]:
    """Resolve the server and make sure a usable model is loaded.

    Returns (host, model). Raises LMStudioError with an actionable message if
    the server is unreachable or no model can be loaded.
    """
    host = lmstudio.resolve_host()
    downloaded, loaded = lmstudio.model_catalog(host)
    if not downloaded:
        raise lmstudio.LMStudioError(
            "LM Studio is running but reports no downloaded models."
        )

    # With no explicit preference, stay on whatever already occupies VRAM
    # rather than triggering a slow model swap.
    model = lmstudio.choose_model(downloaded, model_hint)
    if not model_hint and loaded:
        model = lmstudio.choose_model(loaded, "")

    error = lmstudio.ensure_model_loaded(host, model, context_size)
    if error:
        raise lmstudio.LMStudioError(
            f"Could not load {model!r} in LM Studio.\n\n{error}"
        )
    return host, model


def polish(
    skeleton: str,
    case_meta: dict,
    model: str,
    host: str,
    *,
    on_token: Callable[[str], None] | None = None,
    should_stop: Callable[[], bool] | None = None,
) -> str:
    """Rewrite the skeleton as flowing prose. Returns the polished narrative."""
    return lmstudio.chat(
        prompts.system_prompt(),
        prompts.user_message(skeleton, case_meta),
        model,
        host,
        on_token=on_token,
        should_stop=should_stop,
    )


def verify_with_llm(skeleton: str, polished: str, model: str, host: str) -> str:
    """Second-opinion pass for semantic drift a regex cannot see.

    Catches a fact quietly *altered* rather than deleted — the failure the
    deterministic check in checks.py is blind to.
    """
    return lmstudio.chat(
        prompts.verification_system_prompt(),
        prompts.verification_user_message(skeleton, polished),
        model,
        host,
    )


def run(
    skeleton: str,
    case_meta: dict,
    *,
    model_hint: str = "",
    verify: bool = True,
    on_token: Callable[[str], None] | None = None,
    on_status: Callable[[str], None] | None = None,
    should_stop: Callable[[], bool] | None = None,
) -> PolishResult:
    """Full pipeline: load model → polish → deterministic check → LLM check."""

    def status(message: str) -> None:
        if on_status:
            on_status(message)

    status("Connecting to LM Studio…")
    host, model = prepare(model_hint)
    status(f"Polishing with {model}…")

    polished = polish(
        skeleton, case_meta, model, host,
        on_token=on_token, should_stop=should_stop,
    )
    result = PolishResult(polished=polished, model=model)

    status("Checking citations…")
    result.check = checks.check(skeleton, polished)

    if verify:
        status("Running LLM verification…")
        try:
            result.llm_verification = verify_with_llm(skeleton, polished, model, host)
        except lmstudio.LMStudioError as exc:
            # A failed second opinion must never discard a good narrative.
            result.verification_error = str(exc)

    return result
