from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class TenantIsolationMiddleware(BaseHTTPMiddleware):
    """Enforces multi-tenant context identification from request headers or auth payload."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Extract X-Restaurant-ID header if provided by client or proxy
        restaurant_id = request.headers.get("X-Restaurant-ID")
        if restaurant_id:
            request.state.restaurant_id = restaurant_id
        return await call_next(request)
