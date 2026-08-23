import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

# In-memory sliding-window limiter. One process only — fine for this app's
# single-instance deployment; would need a shared store (Redis) behind a
# load balancer with multiple instances.
_hits: dict[str, list[float]] = defaultdict(list)


def rate_limit(max_requests: int, window_seconds: float):
    async def _dependency(request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"
        key = f"{request.url.path}:{client_ip}"
        now = time.monotonic()

        window_start = now - window_seconds
        hits = [t for t in _hits[key] if t > window_start]

        if len(hits) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Please try again later.",
            )

        hits.append(now)
        _hits[key] = hits

    return _dependency
