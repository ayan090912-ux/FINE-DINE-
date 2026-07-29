from datetime import datetime, timedelta, timezone
import re
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import BadRequestException, ConflictException, UnauthorizedException
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.models.enums import SubscriptionPlan, SubscriptionStatus, UserRole
from app.models.restaurant import Restaurant, Subscription
from app.models.user import User
from app.repositories.restaurant import RestaurantRepository, SubscriptionRepository
from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest, RegisterOwnerRequest, TokenResponse


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)
        self.restaurant_repo = RestaurantRepository(session)
        self.subscription_repo = SubscriptionRepository(session)

    async def register_owner(self, request: RegisterOwnerRequest) -> TokenResponse:
        existing_user = await self.user_repo.get_by_email(request.email)
        if existing_user:
            raise ConflictException(detail="A user with this email already exists.")

        # Generate slug from restaurant name
        base_slug = re.sub(r'[^a-z0-9]+', '-', request.restaurant_name.lower()).strip('-')
        slug = base_slug
        counter = 1
        while await self.restaurant_repo.get_by_slug(slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Create Restaurant
        restaurant = await self.restaurant_repo.create({
            "name": request.restaurant_name,
            "slug": slug,
            "email": request.email,
            "phone": request.phone,
            "currency": request.currency,
            "is_active": True
        })

        # Create Subscription (Free Trial for 30 days)
        now = datetime.now(timezone.utc)
        trial_end = now + timedelta(days=30) if 'timedelta' in locals() else datetime.now(timezone.utc)
        await self.subscription_repo.create({
            "restaurant_id": restaurant.id,
            "plan_type": SubscriptionPlan.FREE_TRIAL,
            "status": SubscriptionStatus.ACTIVE,
            "current_period_start": now,
            "current_period_end": trial_end,
            "max_tables": 15,
            "max_menu_items": 100
        })

        # Create User with OWNER role
        user = await self.user_repo.create({
            "email": request.email.lower(),
            "password_hash": hash_password(request.password),
            "full_name": request.full_name,
            "phone": request.phone,
            "role": UserRole.OWNER,
            "restaurant_id": restaurant.id,
            "is_active": True
        })

        access_token = create_access_token(
            subject=user.id,
            role=user.role.value,
            restaurant_id=restaurant.id
        )
        refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=3600,
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            restaurant_id=restaurant.id
        )

    async def login(self, request: LoginRequest) -> TokenResponse:
        user = await self.user_repo.get_by_email(request.email)
        if not user or not verify_password(request.password, user.password_hash):
            raise UnauthorizedException(detail="Invalid email or password.")

        if not user.is_active:
            raise UnauthorizedException(detail="Account is deactivated. Please contact support.")

        access_token = create_access_token(
            subject=user.id,
            role=user.role.value,
            restaurant_id=user.restaurant_id,
            branch_id=user.branch_id
        )
        refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=3600,
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            restaurant_id=user.restaurant_id,
            branch_id=user.branch_id
        )

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedException(detail="Invalid token type.")

        user_id = payload.get("sub")
        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException(detail="User no longer active.")

        new_access_token = create_access_token(
            subject=user.id,
            role=user.role.value,
            restaurant_id=user.restaurant_id,
            branch_id=user.branch_id
        )
        new_refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=3600,
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            restaurant_id=user.restaurant_id,
            branch_id=user.branch_id
        )
