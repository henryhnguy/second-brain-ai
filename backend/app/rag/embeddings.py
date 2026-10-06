import hashlib
import json
import math
import re
from typing import List
import httpx
import numpy as np


class EmbeddingService:
    def __init__(self, api_key: str = "", model: str = "text-embedding-004"):
        self.api_key = api_key
        self.model = model
        self.dim = 384  # Dimension for fallback local vectors

    def update_api_key(self, api_key: str):
        self.api_key = api_key

    def _local_hash_embedding(self, text: str) -> List[float]:
        """
        A deterministic, high-dimensional TF-IDF subword hash vectorizer
        that computes normalized vector representations locally without external dependencies.
        """
        vec = np.zeros(self.dim, dtype=np.float32)
        if not text:
            return vec.tolist()

        # Tokenize words and character 3-grams
        words = re.findall(r'\w+', text.lower(), re.UNICODE)
        if not words:
            return vec.tolist()

        # Word frequency
        word_counts = {}
        for w in words:
            word_counts[w] = word_counts.get(w, 0) + 1

        for word, count in word_counts.items():
            # Hash word
            h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
            idx = h % self.dim
            sign = 1.0 if (h // self.dim) % 2 == 0 else -1.0
            tf = 1.0 + math.log(count)
            vec[idx] += sign * tf

            # Add character n-grams for subword matching
            if len(word) >= 3:
                for i in range(len(word) - 2):
                    ngram = word[i:i+3]
                    h_ng = int(hashlib.sha256(ngram.encode('utf-8')).hexdigest(), 16)
                    ng_idx = h_ng % self.dim
                    ng_sign = 1.0 if (h_ng // self.dim) % 2 == 0 else -1.0
                    vec[ng_idx] += ng_sign * 0.5

        # L2 Normalize
        norm = np.linalg.norm(vec)
        if norm > 1e-6:
            vec = vec / norm

        return vec.tolist()

    async def get_embedding(self, text: str) -> List[float]:
        """
        Gets embedding for text. Uses Gemini API if key is present; otherwise falls back to local vectorizer.
        """
        if self.api_key and len(self.api_key) > 10:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:embedContent?key={self.api_key}"
                payload = {
                    "model": f"models/{self.model}",
                    "content": {
                        "parts": [{"text": text[:2000]}]
                    }
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        values = data.get("embedding", {}).get("values", [])
                        if values:
                            # Normalize
                            arr = np.array(values, dtype=np.float32)
                            norm = np.linalg.norm(arr)
                            if norm > 1e-6:
                                arr = arr / norm
                            return arr.tolist()
            except Exception as e:
                # Log and fallback gracefully
                print(f"[EmbeddingService] Gemini API embed failed, falling back to local: {e}")

        # Fallback to local vectorizer
        return self._local_hash_embedding(text)


embedding_service = EmbeddingService()
