from __future__ import annotations

import logging
import os
import time
from collections import defaultdict, deque
from collections.abc import Callable
from dataclasses import dataclass
from threading import Lock

from fastapi import HTTPException, Request

logger = logging.getLogger(__name__)


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


@dataclass(frozen=True)
class WeightedBudgetRule:
    budget: int
    window_seconds: int


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


class InMemoryWeightedBudgetLimiter:
    def __init__(self) -> None:
        self._entries: dict[tuple[str, str], deque[tuple[float, int]]] = defaultdict(deque)
        self._lock = Lock()

    def enforce(self, request: Request, scope: str, rule: WeightedBudgetRule, cost: int, detail: str) -> int:
        client_host = request.client.host if request.client else "unknown"
        key = (scope, client_host)
        now = time.time()
        window_start = now - rule.window_seconds

        with self._lock:
            attempts = self._entries[key]
            while attempts and attempts[0][0] < window_start:
                attempts.popleft()

            spent = sum(entry_cost for _, entry_cost in attempts)
            remaining = max(0, rule.budget - spent)
            if cost > remaining:
                raise HTTPException(status_code=429, detail=detail)

            attempts.append((now, cost))
            return rule.budget - (spent + cost)

    def remaining_budget(self, request: Request, scope: str, rule: WeightedBudgetRule) -> int:
        client_host = request.client.host if request.client else "unknown"
        key = (scope, client_host)
        now = time.time()
        window_start = now - rule.window_seconds

        with self._lock:
            attempts = self._entries[key]
            while attempts and attempts[0][0] < window_start:
                attempts.popleft()

            spent = sum(entry_cost for _, entry_cost in attempts)
            return max(0, rule.budget - spent)


rate_limiter = InMemoryRateLimiter()
weighted_budget_limiter = InMemoryWeightedBudgetLimiter()

PREDICT_MATCH_RULE = RateLimitRule(
    limit=env_int("RATE_LIMIT_PREDICT_MATCH", 120, 1),
    window_seconds=env_int("RATE_LIMIT_WINDOW_SECONDS", 60, 1),
    error_message="Too many match prediction requests. Please wait and try again.",
)

SIMULATE_ONE_RULE = RateLimitRule(
    limit=env_int("RATE_LIMIT_SIMULATE_ONE", 90, 1),
    window_seconds=env_int("RATE_LIMIT_WINDOW_SECONDS", 60, 1),
    error_message="Too many single tournament simulations. Please wait and try again.",
)

SIMULATE_BATCH_RULE = RateLimitRule(
    limit=env_int("RATE_LIMIT_SIMULATE_BATCH", 40, 1),
    window_seconds=env_int("RATE_LIMIT_WINDOW_SECONDS", 60, 1),
    error_message="Too many batch tournament simulations. Please wait and try again.",
)

SIMULATE_BATCH_BUDGET_RULE = WeightedBudgetRule(
    budget=env_int("RATE_LIMIT_SIMULATE_BATCH_BUDGET", 100, 1),
    window_seconds=env_int("RATE_LIMIT_WINDOW_SECONDS", 60, 1),
)

PUBLIC_SIMULATION_MAX = env_int("PUBLIC_SIMULATION_MAX", 5000, 1)


def batch_simulation_cost(simulations: int) -> int:
    if simulations <= 100:
        return 1
    if simulations <= 500:
        return 3
    if simulations <= 1000:
        return 8
    if simulations <= 5000:
        return 25
    return 50


def enforce_weighted_batch_budget(request: Request, simulations: int) -> None:
    cost = batch_simulation_cost(simulations)
    client_host = request.client.host if request.client else "unknown"
    scope = "simulate-tournament-weighted"
    remaining_before = weighted_budget_limiter.remaining_budget(
        request=request,
        scope=scope,
        rule=SIMULATE_BATCH_BUDGET_RULE,
    )
    detail = (
        f"Batch of {simulations} simulations costs {cost} budget units, "
        f"but only {remaining_before} remain in this minute. Please wait and try again."
    )

    try:
        remaining_budget = weighted_budget_limiter.enforce(
            request=request,
            scope=scope,
            rule=SIMULATE_BATCH_BUDGET_RULE,
            cost=cost,
            detail=detail,
        )
    except HTTPException:
        logger.warning(
            "weighted_batch_rate_limit_rejected client_host=%s simulations=%s cost=%s remaining_budget=%s budget=%s",
            client_host,
            simulations,
            cost,
            remaining_before,
            SIMULATE_BATCH_BUDGET_RULE.budget,
        )
        raise

    logger.info(
        "weighted_batch_rate_limit_charged client_host=%s simulations=%s cost=%s remaining_budget=%s",
        client_host,
        simulations,
        cost,
        remaining_budget,
    )


def throttle(scope: str, rule: RateLimitRule) -> Callable[[Request], None]:
    def dependency(request: Request) -> None:
        rate_limiter.enforce(request, scope, rule)

    return dependency
