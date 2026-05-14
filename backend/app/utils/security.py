from __future__ import annotations

import os
import time
from collections import defaultdict, deque
from collections.abc import Callable
from dataclasses import dataclass
from threading import Lock

from fastapi import HTTPException, Request


def env_int(name: str, default: int, minimum: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return max(minimum, int(raw))
    except ValueError:
        return default


@dataclass(frozen=True)
class RateLimitRule:
    limit: int
    window_seconds: int
    error_message: str


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._entries: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def enforce(self, request: Request, scope: str, rule: RateLimitRule) -> None:
        client_host = request.client.host if request.client else "unknown"
        key = (scope, client_host)
        now = time.time()
        window_start = now - rule.window_seconds

        with self._lock:
            attempts = self._entries[key]
            while attempts and attempts[0] < window_start:
                attempts.popleft()

            if len(attempts) >= rule.limit:
                raise HTTPException(status_code=429, detail=rule.error_message)

            attempts.append(now)


rate_limiter = InMemoryRateLimiter()

PREDICT_MATCH_RULE = RateLimitRule(
    limit=env_int("RATE_LIMIT_PREDICT_MATCH", 120, 1),
    window_seconds=env_int("RATE_LIMIT_WINDOW_SECONDS", 60, 1),
    error_message="Too many match prediction requests. Please wait and try again.",
)

SIMULATE_ONE_RULE = RateLimitRule(
    limit=env_int("RATE_LIMIT_SIMULATE_ONE", 30, 1),
    window_seconds=env_int("RATE_LIMIT_WINDOW_SECONDS", 60, 1),
    error_message="Too many single tournament simulations. Please wait and try again.",
)

SIMULATE_BATCH_RULE = RateLimitRule(
    limit=env_int("RATE_LIMIT_SIMULATE_BATCH", 20, 1),
    window_seconds=env_int("RATE_LIMIT_WINDOW_SECONDS", 60, 1),
    error_message="Too many batch tournament simulations. Please wait and try again.",
)

PUBLIC_SIMULATION_MAX = env_int("PUBLIC_SIMULATION_MAX", 2000, 1)


def throttle(scope: str, rule: RateLimitRule) -> Callable[[Request], None]:
    def dependency(request: Request) -> None:
        rate_limiter.enforce(request, scope, rule)

    return dependency
