from app.domains.metrics.schemas import AgentRatingRead


def build_agent_rating(*, total_tasks: int, succeeded_tasks: int, avg_duration_ms: int | None) -> AgentRatingRead:
    if total_tasks <= 0:
        return AgentRatingRead(score=0, label="Нет данных", success_rate_percent=0, avg_duration_ms=avg_duration_ms)

    success_rate = round((succeeded_tasks / total_tasks) * 100)
    speed_bonus = 0
    if avg_duration_ms is not None:
        if avg_duration_ms <= 150:
            speed_bonus = 15
        elif avg_duration_ms <= 300:
            speed_bonus = 10
        elif avg_duration_ms <= 600:
            speed_bonus = 5

    score = min(100, success_rate + speed_bonus)
    if score >= 95:
        label = "Отличный"
    elif score >= 85:
        label = "Стабильный"
    elif score >= 70:
        label = "Нормальный"
    elif score >= 50:
        label = "Нестабилен"
    else:
        label = "Проблемный"

    return AgentRatingRead(
        score=score,
        label=label,
        success_rate_percent=success_rate,
        avg_duration_ms=avg_duration_ms,
    )
