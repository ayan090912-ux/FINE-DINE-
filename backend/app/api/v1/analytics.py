from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import require_roles
from app.core.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.analytics import AnalyticsSummary
from app.schemas.common import APIResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Dashboard Analytics"])


@router.get("/summary", response_model=APIResponse[AnalyticsSummary])
async def get_analytics_summary(
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve key performance metrics, revenue, order stats, and top-selling dishes."""
    service = AnalyticsService(db)
    summary = await service.get_summary(current_user.restaurant_id)
    return APIResponse(message="Analytics summary retrieved.", data=summary)
