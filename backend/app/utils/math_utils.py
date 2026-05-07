from __future__ import annotations

import math
import random


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def poisson_pmf(k: int, expected_goals: float) -> float:
    return math.exp(-expected_goals) * (expected_goals**k) / math.factorial(k)


def sample_poisson(expected_goals: float) -> int:
    expected_goals = max(expected_goals, 0.01)
    threshold = math.exp(-expected_goals)
    product = 1.0
    goals = 0

    while product > threshold:
        goals += 1
        product *= random.random()

    return goals - 1
