"""Verify the LM Studio client's offline logic.

Nothing here touches the network — the suite must pass with LM Studio closed.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import lmstudio  # noqa: E402


class TestChooseModel(unittest.TestCase):
    CATALOG = [
        "google/gemma-4-26b-a4b-qat",
        "google/gemma-4-26b-a4b",
        "google/gemma-4-31b-qat",
        "qwen/qwen3.5-9b",
        "qwen/qwen3.6-27b",
    ]

    def test_prefers_the_bakeoff_winner(self):
        # gemma-4-26b-a4b-qat won LeapForward's safety comparison; the QAT build
        # must be pinned ahead of the non-QAT one, which spills VRAM on a 16GB card.
        self.assertEqual(lmstudio.choose_model(self.CATALOG), "google/gemma-4-26b-a4b-qat")

    def test_exact_preference_wins(self):
        self.assertEqual(
            lmstudio.choose_model(self.CATALOG, "qwen/qwen3.6-27b"), "qwen/qwen3.6-27b"
        )

    def test_prefix_preference_matches(self):
        self.assertEqual(
            lmstudio.choose_model(self.CATALOG, "qwen/qwen3.5"), "qwen/qwen3.5-9b"
        )

    def test_unknown_preference_falls_back_to_hints(self):
        self.assertEqual(
            lmstudio.choose_model(self.CATALOG, "not-installed"),
            "google/gemma-4-26b-a4b-qat",
        )

    def test_empty_catalog_returns_empty(self):
        self.assertEqual(lmstudio.choose_model([], "anything"), "")


class TestThinkingDetection(unittest.TestCase):
    def test_think_by_default_families_are_detected(self):
        # Getting this wrong produces an empty narrative and a baffling error,
        # so it is worth pinning per family.
        for model in ("google/gemma-4-26b-a4b-qat", "qwen/qwen3.6-27b", "Qwen3-32B"):
            self.assertTrue(lmstudio.forces_thinking_off(model), model)

    def test_other_models_are_left_alone(self):
        for model in ("openai/gpt-oss-20b", "mistralai/mistral-small", ""):
            self.assertFalse(lmstudio.forces_thinking_off(model), model)


class TestStreamParsing(unittest.TestCase):
    def _lines(self, *raw: str):
        return [line.encode("utf-8") for line in raw]

    def test_content_deltas_are_yielded_in_order(self):
        stream = self._lines(
            'data: {"choices":[{"delta":{"content":"Hello "}}]}\n',
            'data: {"choices":[{"delta":{"content":"world"}}]}\n',
            "data: [DONE]\n",
        )
        self.assertEqual(
            list(lmstudio._stream_deltas(stream)),
            [("content", "Hello "), ("content", "world")],
        )

    def test_reasoning_is_separated_from_content(self):
        stream = self._lines(
            'data: {"choices":[{"delta":{"reasoning":"thinking..."}}]}\n',
            'data: {"choices":[{"delta":{"content":"answer"}}]}\n',
            "data: [DONE]\n",
        )
        self.assertEqual(
            list(lmstudio._stream_deltas(stream)),
            [("reasoning", "thinking..."), ("content", "answer")],
        )

    def test_keepalives_and_malformed_lines_are_skipped(self):
        stream = self._lines(
            "\n",
            ": keepalive\n",
            "data: {not json}\n",
            'data: {"choices":[{"delta":{"content":"ok"}}]}\n',
            "data: [DONE]\n",
        )
        self.assertEqual(list(lmstudio._stream_deltas(stream)), [("content", "ok")])

    def test_stops_at_done(self):
        stream = self._lines(
            'data: {"choices":[{"delta":{"content":"a"}}]}\n',
            "data: [DONE]\n",
            'data: {"choices":[{"delta":{"content":"never"}}]}\n',
        )
        self.assertEqual(list(lmstudio._stream_deltas(stream)), [("content", "a")])


if __name__ == "__main__":
    unittest.main()


class TestSwapGuard(unittest.TestCase):
    """The eviction guard: never unload another application's model silently."""

    def setUp(self):
        self._real_catalog = lmstudio.model_catalog
        self._real_state = lmstudio.model_state
        self._ran = []
        self._real_run = lmstudio.run_lms
        lmstudio.run_lms = lambda args, timeout: self._ran.append(args) or ""

    def tearDown(self):
        lmstudio.model_catalog = self._real_catalog
        lmstudio.model_state = self._real_state
        lmstudio.run_lms = self._real_run

    def _fake_catalog(self, loaded):
        lmstudio.model_catalog = lambda host: (["a", "b"], loaded)

    def test_no_swap_when_nothing_is_loaded(self):
        self._fake_catalog([])
        self.assertEqual(lmstudio.swap_needed("h", "a"), [])

    def test_no_swap_when_the_wanted_model_is_already_loaded(self):
        self._fake_catalog(["a"])
        self.assertEqual(lmstudio.swap_needed("h", "a"), [])

    def test_swap_reports_what_would_be_evicted(self):
        self._fake_catalog(["b"])
        self.assertEqual(lmstudio.swap_needed("h", "a"), ["b"])

    def test_unknown_state_is_treated_as_no_swap(self):
        def boom(host):
            raise lmstudio.LMStudioError("no /api/v0")
        lmstudio.model_catalog = boom
        self.assertEqual(lmstudio.swap_needed("h", "a"), [])

    def test_ensure_refuses_to_evict_without_permission(self):
        lmstudio.model_state = lambda host, model: "not-loaded"
        self._fake_catalog(["b"])
        with self.assertRaises(lmstudio.ModelSwapRequired) as ctx:
            lmstudio.ensure_model_loaded("h", "a")
        self.assertEqual(ctx.exception.wanted, "a")
        self.assertEqual(ctx.exception.loaded, ["b"])
        self.assertEqual(self._ran, [], "must not run any lms command when refusing")

    def test_ensure_evicts_when_permission_is_given(self):
        lmstudio.model_state = lambda host, model: "not-loaded"
        self._fake_catalog(["b"])
        self.assertEqual(lmstudio.ensure_model_loaded("h", "a", allow_swap=True), "")
        self.assertEqual(self._ran[0], ["unload", "--all"])
        self.assertEqual(self._ran[1][:2], ["load", "a"])

    def test_already_loaded_model_is_never_reloaded(self):
        lmstudio.model_state = lambda host, model: "loaded"
        self._fake_catalog(["a"])
        self.assertEqual(lmstudio.ensure_model_loaded("h", "a"), "")
        self.assertEqual(self._ran, [])
