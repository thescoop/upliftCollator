"""The polish step: skeleton → flowing narrative → verification.

Shared by the CLI and the GUI so both run exactly the same pipeline. Split
into three small steps rather than one call so a caller can re-polish with a
different model without re-extracting the PDF, and so a failed verification
never discards a good narrative.
"""

from __future__ import annotations

import re
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
    # Whether a second opinion was asked for. A verification that was requested
    # and failed must not read as "no findings" — preserving the narrative and
    # passing it are separate decisions.
    verification_was_requested: bool = False

    @property
    def deterministic_ok(self) -> bool:
        """Did the exact citation/placeholder check pass?"""
        return bool(self.polished) and bool(self.check) and self.check.ok

    @property
    def semantic_ok(self) -> bool:
        """Did the LLM second opinion find nothing?

        Fails closed. An earlier version searched the whole report for the
        substring "NEEDS REVISION", which accepted a report listing changed
        facts and then saying SAFE TO REVIEW, accepted alternative wording like
        "Revision needed", and rejected a clean report that merely discussed
        the phrase. It also treated a verification that *errored* as a pass,
        so a malformed prompt produced a green verdict.

        Now: the verdict is read from the report's own Verdict section, and
        anything that cannot be read as an explicit pass counts as a failure.
        """
        if self.verification_was_requested and not self.llm_verification:
            return False  # asked for a second opinion and did not get one
        if not self.llm_verification:
            return True  # verification was skipped deliberately
        return self._parsed_llm_verdict() == "SAFE TO REVIEW"

    def _parsed_llm_verdict(self) -> str:
        """The verdict from the report's Verdict heading, or "" if unreadable."""
        match = re.search(
            r"^#{1,6}\s*Verdict\s*$(.*?)(?=^#{1,6}\s|\Z)",
            self.llm_verification,
            re.MULTILINE | re.DOTALL | re.IGNORECASE,
        )
        section = match.group(1) if match else ""
        found = re.findall(r"SAFE TO REVIEW|NEEDS REVISION", section, re.IGNORECASE)
        if len(set(f.upper() for f in found)) != 1:
            return ""  # absent, or self-contradictory
        return found[0].upper()

    @property
    def ok(self) -> bool:
        """Both checks. A semantic finding must not be outvoted by a clean
        citation count — the earlier version showed green SAFE TO REVIEW while
        the report underneath said NEEDS REVISION."""
        return self.deterministic_ok and self.semantic_ok

    @property
    def verdict(self) -> str:
        return "SAFE TO REVIEW" if self.ok else "NEEDS REVISION"

    @property
    def verdict_detail(self) -> str:
        """One line explaining the verdict, for the log and the CLI."""
        if not self.check:
            return "no check was run"
        parts = [
            f"{len(self.check.skeleton_citations)} citations",
            f"{len(self.check.dropped_citations)} dropped",
            f"{len(self.check.added_citations)} added",
            f"{len(self.check.placeholders)} placeholders left",
        ]
        if self.verification_error:
            parts.append("LLM review FAILED to run — narrative unverified")
        elif self.llm_verification and not self.semantic_ok:
            verdict = self._parsed_llm_verdict()
            parts.append(
                "LLM review flagged a discrepancy" if verdict == "NEEDS REVISION"
                else "LLM review verdict could not be read"
            )
        return ", ".join(parts)


def format_full_report(result: PolishResult) -> str:
    """The citation-check file: exact check, LLM second opinion, verdict.

    Shared by the CLI and the GUI so the two can never disagree, and so the
    overall verdict always appears last — an LLM "NEEDS REVISION" higher up the
    file must not be contradicted by a green summary elsewhere.
    """
    report = checks.format_report(result.check)
    if result.llm_verification:
        report += "\n\n---\n\n## LLM second opinion\n\n" + result.llm_verification + "\n"
    elif result.verification_error:
        report += ("\n\n---\n\n## LLM second opinion\n\n"
                   f"Did not run: {result.verification_error}\n")
    report += f"\n\n---\n\n## Overall verdict\n\n{result.verdict} — {result.verdict_detail}\n"
    return report


def prepare(
    model_hint: str = "",
    context_size: int = lmstudio.DEFAULT_CONTEXT_SIZE,
    *,
    consented: list[str] | None = None,
    force_swap: bool = False,
) -> tuple[str, str]:
    """Resolve the server and make sure a usable model is loaded.

    Returns (host, model). Raises LMStudioError with an actionable message if
    the server is unreachable or no model can be loaded, or ModelSwapRequired
    if satisfying the request would evict a model another application may be
    using. With no explicit model_hint this stays on whatever is already
    loaded, so the default path never triggers a swap.
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

    approved = consented
    if force_swap:
        # An explicit --force-swap means "evict whatever is there". Read the
        # set at the moment of acting so the consent is at least accurate.
        approved = lmstudio.swap_needed(host, model)

    error = lmstudio.ensure_model_loaded(host, model, context_size, consented=approved)
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
    prompt_snapshot: prompts.PromptSnapshot | None = None,
    on_token: Callable[[str], None] | None = None,
    should_stop: Callable[[], bool] | None = None,
) -> str:
    """Rewrite the skeleton as flowing prose. Returns the polished narrative.

    Uses the caller's frozen snapshot so what is sent matches what was recorded
    in narrative-prompt.txt, even if a template is edited mid-run.
    """
    snap = prompt_snapshot or prompts.snapshot()
    return lmstudio.chat(
        snap.system,
        snap.user_message(skeleton, case_meta),
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
    consented: list[str] | None = None,
    force_swap: bool = False,
    prompt_snapshot: prompts.PromptSnapshot | None = None,
    on_token: Callable[[str], None] | None = None,
    on_status: Callable[[str], None] | None = None,
    should_stop: Callable[[], bool] | None = None,
) -> PolishResult:
    """Full pipeline: load model → polish → deterministic check → LLM check."""

    def status(message: str) -> None:
        if on_status:
            on_status(message)

    status("Connecting to LM Studio…")
    host, model = prepare(model_hint, consented=consented, force_swap=force_swap)
    status(f"Polishing with {model}…")

    polished = polish(
        skeleton, case_meta, model, host,
        prompt_snapshot=prompt_snapshot,
        on_token=on_token, should_stop=should_stop,
    )
    result = PolishResult(polished=polished, model=model,
                          verification_was_requested=verify)

    status("Checking citations…")
    result.check = checks.check(skeleton, polished)

    if verify:
        status("Running LLM verification…")
        try:
            result.llm_verification = verify_with_llm(skeleton, polished, model, host)
        except Exception as exc:  # noqa: BLE001 — see below
            # A failed second opinion must never discard a good narrative, and
            # "failed" means any exception: a malformed verification.md raises
            # ValueError, not LMStudioError, and catching only the latter threw
            # away a perfectly good polished narrative before it reached disk.
            result.verification_error = f"{type(exc).__name__}: {exc}"

    return result
