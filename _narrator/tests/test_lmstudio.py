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
