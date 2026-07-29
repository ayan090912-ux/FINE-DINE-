import logging
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("dineflow.audit")


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Log all state-changing API operations (POST, PUT, PATCH, DELETE) for security auditing."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            client_ip = request.client.host if request.client else "unknown"
            logger.info(
                f"[AUDIT] {request.method} {request.url.path} | Status: {response.status_code} | IP: {client_ip}"
            )

        return response
