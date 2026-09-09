import os
import json
import urllib.request
import urllib.error
from typing import Optional, Dict, Any

class GeminiClient:
    """
    Lightweight Python client for Google Gemini API.
    Uses standard library urllib.request for zero external dependency overhead.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        if self.api_key == "MY_GEMINI_API_KEY":
            self.api_key = ""

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        model: str = "gemini-3.6-flash",
        response_mime_type: Optional[str] = None,
        timeout: int = 35
    ) -> Optional[str]:
        """
        Calls the Gemini REST API and returns the generated text.
        Tries gemini-3.6-flash first, then gemini-3-flash-preview as fallback.
        """
        if not self.is_configured:
            return None

        candidates = [model, "gemini-3.6-flash", "gemini-3-flash-preview"]
        models_to_try = []
        for m in candidates:
            if m and m not in models_to_try:
                models_to_try.append(m)

        for target_model in models_to_try:
            res = self._try_generate_single_model(
                prompt=prompt,
                system_instruction=system_instruction,
                model=target_model,
                response_mime_type=response_mime_type,
                timeout=timeout
            )
            if res:
                return res

        return None

    def _try_generate_single_model(
        self,
        prompt: str,
        system_instruction: Optional[str],
        model: str,
        response_mime_type: Optional[str],
        timeout: int
    ) -> Optional[str]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"

        payload: Dict[str, Any] = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ]
        }

        generation_config: Dict[str, Any] = {
            "temperature": 0.2,
        }

        if response_mime_type:
            generation_config["responseMimeType"] = response_mime_type

        payload["generationConfig"] = generation_config

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [
                    {"text": system_instruction}
                ]
            }

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "SprintFlow-Python-Agent/1.0"
        }

        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)

                candidates = res_json.get("candidates", [])
                if not candidates:
                    return None

                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    return None

                return parts[0].get("text", "")
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8")
            print(f"[GeminiClient HTTPError on {model}] {e.code}: {err_msg[:200]}", file=os.sys.stderr)
            return None
        except Exception as e:
            print(f"[GeminiClient Exception on {model}] {e}", file=os.sys.stderr)
            return None
