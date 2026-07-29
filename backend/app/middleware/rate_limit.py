import time
from typing import Dict, Tuple
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """In-memory sliding window rate limiter for security and performance protection."""

    def __init__(self, app):
        super().__init__(app)
        # ip -> (request_count, window_start_time)
        self.ip_limits: Dict[str, Tuple[int, float]] = {}

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path.startswith("/docs") or request.url.path.startswith("/openapi"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        window = 60.0 # 1 minute window

        if client_ip in self.ip_limits:
            count, start = self.ip_limits[client_ip]
            if now - start < window:
                if count >= settings.RATE_LIMIT_PER_MINUTE:
                    return JSONResponse(
                        status_code=429,
                        content={
                            "success": False,
                            "code": "RATE_LIMIT_EXCEEDED",
                            "detail": "Rate limit exceeded. Please try again in a minute."
                        }
                    )
                self.ip_limits[client_ip] = (count + 1, start)
            else:
                self.ip_limits[client_ip] = (1, now)
        else:
            self.ip_limits[client_ip] = (1, now)

        return await call_next(request)
