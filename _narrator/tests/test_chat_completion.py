"""Verify chat() refuses to return an incomplete narrative.

`chat()` had no tests at all until independent review on 30 July 2026 found
that a cancelled generation, a stream that stopped without `[DONE]`, and a
response truncated at the token limit were all returned as if finished. A
narrative cut off after its headings and citations passes the citation check,
so it would have been filed as completed work.

Nothing here touches the network: urlopen is replaced with a fake stream.
"""

import io
import sys
import unittest
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import lmstudio  # noqa: E402


def _sse(*frames: str) -> bytes:
    return "".join(f"data: {f}\n" for f in frames).encode("utf-8")


def _content(text: str) -> str:
    return '{"choices":[{"delta":{"content":"%s"}}]}' % text


class FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()
        return False


class ChatTestCase(unittest.TestCase):
    def setUp(self):
        self._real_urlopen = urllib.request.urlopen

    def tearDown(self):
        urllib.request.urlopen = self._real_urlopen

    def _respond(self, payload: bytes):
        urllib.request.urlopen = lambda req, timeout=None: FakeResponse(payload)

    def _chat(self, **kwargs):
        return lmstudio.chat("sys", "user", "test-model", "http://127.0.0.1:1234", **kwargs)


class TestCompleteResponses(ChatTestCase):
    def test_a_clean_stream_returns_its_content(self):
        self._respond(_sse(_content("Hello "), _content("world"), "[DONE]"))
        self.assertEqual(self._chat(), "Hello world")

    def test_normal_finish_reason_is_accepted(self):
        self._respond(_sse(
            _content("done"),
            '{"choices":[{"delta":{},"finish_reason":"stop"}]}',
            "[DONE]",
        ))
        self.assertEqual(self._chat(), "done")

    def test_tokens_are_streamed_to_the_callback(self):
        self._respond(_sse(_content("a"), _content("b"), "[DONE]"))
        seen: list[str] = []
        self._chat(on_token=seen.append)
        self.assertEqual(seen, ["a", "b"])


class TestIncompleteResponsesAreDiscarded(ChatTestCase):
    def test_truncation_at_the_token_limit_is_refused(self):
        self._respond(_sse(
            _content("An enhancement of 75% is claimed"),
            '{"choices":[{"delta":{},"finish_reason":"length"}]}',
            "[DONE]",
        ))
        with self.assertRaises(lmstudio.LMStudioError) as ctx:
            self._chat()
        self.assertIn("cut off", str(ctx.exception))

    def test_a_stream_that_stops_without_done_is_refused(self):
        self._respond(_sse(_content("half a narrative")))
        with self.assertRaises(lmstudio.LMStudioError) as ctx:
            self._chat()
        self.assertIn("without completing", str(ctx.exception))

    def test_cancellation_discards_the_partial_narrative(self):
        self._respond(_sse(_content("partial"), _content("more"), "[DONE]"))
        with self.assertRaises(lmstudio.LMStudioError) as ctx:
            self._chat(should_stop=lambda: True)
        self.assertIn("cancelled", str(ctx.exception).lower())

    def test_a_malformed_frame_is_refused(self):
        self._respond(_sse(_content("start"), "{not json}", _content("end"), "[DONE]"))
        with self.assertRaises(lmstudio.LMStudioError) as ctx:
            self._chat()
        self.assertIn("malformed", str(ctx.exception).lower())

    def test_an_unexpected_finish_reason_is_refused(self):
        self._respond(_sse(
            _content("text"),
            '{"choices":[{"delta":{},"finish_reason":"content_filter"}]}',
            "[DONE]",
        ))
        with self.assertRaises(lmstudio.LMStudioError):
            self._chat()

    def test_hidden_reasoning_with_no_answer_explains_itself(self):
        self._respond(_sse(
            '{"choices":[{"delta":{"reasoning":"thinking and thinking"}}]}',
            "[DONE]",
        ))
        with self.assertRaises(lmstudio.LMStudioError) as ctx:
            self._chat()
        self.assertIn("THINKING_OFF_PATTERNS", str(ctx.exception))


class TestLocalOnly(unittest.TestCase):
    """The confidentiality guarantee: privileged material stays on this machine."""

    def setUp(self):
        self._env = {}
        import os
        self._os = os
        for key in ("UPLIFT_LMSTUDIO_URL", "UPLIFT_LMSTUDIO_ALLOW_REMOTE"):
            self._env[key] = os.environ.pop(key, None)

    def tearDown(self):
        for key, value in self._env.items():
            if value is None:
                self._os.environ.pop(key, None)
            else:
                self._os.environ[key] = value

    def test_a_remote_url_is_refused(self):
        self._os.environ["UPLIFT_LMSTUDIO_URL"] = "http://api.example.com:1234"
        with self.assertRaises(lmstudio.LMStudioError) as ctx:
            lmstudio.resolve_host()
        self.assertIn("not this machine", str(ctx.exception))

    def test_a_remote_url_needs_an_explicit_opt_in(self):
        self._os.environ["UPLIFT_LMSTUDIO_URL"] = "http://api.example.com:1234"
        self._os.environ["UPLIFT_LMSTUDIO_ALLOW_REMOTE"] = "1"
        # Now it gets as far as trying to reach it, rather than refusing outright.
        with self.assertRaises(lmstudio.LMStudioError) as ctx:
            lmstudio.resolve_host()
        self.assertIn("nothing answered", str(ctx.exception))

    def test_loopback_is_local(self):
        self.assertTrue(lmstudio._is_local("http://127.0.0.1:1234", None))
        self.assertTrue(lmstudio._is_local("http://localhost:1234", None))

    def test_the_wsl_gateway_is_local(self):
        self.assertTrue(lmstudio._is_local("http://172.26.96.1:1234", "172.26.96.1"))

    def test_a_lan_address_is_not_local(self):
        self.assertFalse(lmstudio._is_local("http://192.168.1.50:1234", "172.26.96.1"))


if __name__ == "__main__":
    unittest.main()
