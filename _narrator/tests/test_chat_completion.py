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
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import lmstudio  # noqa: E402


def _sse(*frames: str) -> bytes:
    return "".join(f"data: {f}\n" for f in frames).encode("utf-8")


def _content(text: str) -> str:
    return '{"choices":[{"delta":{"content":"%s"}}]}' % text


def _stop() -> str:
    return '{"choices":[{"delta":{},"finish_reason":"stop"}]}'


class FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()
        return False


class ChatTestCase(unittest.TestCase):
    def setUp(self):
        self._real_urlopen = lmstudio._urlopen

    def tearDown(self):
        lmstudio._urlopen = self._real_urlopen

    def _respond(self, payload: bytes):
        lmstudio._urlopen = lambda req, timeout=None: FakeResponse(payload)

    def _chat(self, **kwargs):
        return lmstudio.chat("sys", "user", "test-model", "http://127.0.0.1:1234", **kwargs)


class TestCompleteResponses(ChatTestCase):
    def test_a_clean_stream_returns_its_content(self):
        self._respond(_sse(_content("Hello "), _content("world"), _stop(), "[DONE]"))
        self.assertEqual(self._chat(), "Hello world")

    def test_normal_finish_reason_is_accepted(self):
        self._respond(_sse(
            _content("done"),
            '{"choices":[{"delta":{},"finish_reason":"stop"}]}',
            "[DONE]",
        ))
        self.assertEqual(self._chat(), "done")

    def test_tokens_are_streamed_to_the_callback(self):
        self._respond(_sse(_content("a"), _content("b"), _stop(), "[DONE]"))
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
        self._respond(_sse(_content("partial"), _content("more"), _stop(), "[DONE]"))
        with self.assertRaises(lmstudio.LMStudioError) as ctx:
            self._chat(should_stop=lambda: True)
        self.assertIn("cancelled", str(ctx.exception).lower())

    def test_a_malformed_frame_is_refused(self):
        self._respond(_sse(_content("start"), "{not json}", _content("end"), _stop(), "[DONE]"))
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
            _stop(),
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



class TestStructuralValidation(ChatTestCase):
    """Frames that are JSON-valid but protocol-invalid still hide lost content."""

    def test_a_frame_with_no_choices_is_refused(self):
        self._respond(_sse(_content("start"), '{"choices":[]}', _stop(), "[DONE]"))
        with self.assertRaises(lmstudio.LMStudioError) as ctx:
            self._chat()
        self.assertIn("malformed", str(ctx.exception).lower())

    def test_a_corrupted_non_data_line_is_refused(self):
        payload = (b"data: " + _content("start").encode() + b"\n"
                   + b"<<<garbage>>>\n"
                   + b"data: " + _stop().encode() + b"\n"
                   + b"data: [DONE]\n")
        self._respond(payload)
        with self.assertRaises(lmstudio.LMStudioError) as ctx:
            self._chat()
        self.assertIn("malformed", str(ctx.exception).lower())

    def test_a_stream_with_no_finish_reason_is_refused(self):
        self._respond(_sse(_content("looks complete"), "[DONE]"))
        with self.assertRaises(lmstudio.LMStudioError) as ctx:
            self._chat()
        self.assertIn("without saying why", str(ctx.exception))

    def test_sse_comments_are_ignored(self):
        payload = (b": keep-alive\n"
                   + b"data: " + _content("ok").encode() + b"\n"
                   + b"data: " + _stop().encode() + b"\n"
                   + b"data: [DONE]\n")
        self._respond(payload)
        self.assertEqual(self._chat(), "ok")


class TestProxiesAreBypassed(unittest.TestCase):
    """urllib honours http_proxy, which would route even a loopback request
    through a proxy that then receives the narrative."""

    @staticmethod
    def _has_proxy(opener) -> bool:
        return any(getattr(h, "proxies", None) for h in opener.handlers)

    def test_environment_proxies_are_not_used(self):
        import os
        import urllib.request
        previous = os.environ.get("http_proxy")
        os.environ["http_proxy"] = "http://proxy.example.com:8080"
        try:
            # Sanity: a default opener really would honour it...
            self.assertTrue(self._has_proxy(urllib.request.build_opener()))
            # ...and ours does not.
            self.assertFalse(self._has_proxy(
                urllib.request.build_opener(urllib.request.ProxyHandler({}))))
        finally:
            if previous is None:
                os.environ.pop("http_proxy", None)
            else:
                os.environ["http_proxy"] = previous

    def test_the_module_opener_carries_no_proxy(self):
        self.assertFalse(self._has_proxy(lmstudio._OPENER))


class TestGatewayIsWslOnly(unittest.TestCase):
    def test_no_gateway_is_treated_as_local_off_wsl(self):
        real = lmstudio._under_wsl
        try:
            lmstudio._under_wsl = lambda: False
            # On native Linux the default gateway is a router, not this machine.
            self.assertIsNone(lmstudio._wsl_gateway_ip())
        finally:
            lmstudio._under_wsl = real

if __name__ == "__main__":
    unittest.main()
