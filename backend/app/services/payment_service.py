from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException
from app.models.enums import OrderStatus, PaymentStatus
from app.models.payment import Payment
from app.repositories.order import OrderRepository
from app.schemas.payment import PaymentCreate


class PaymentService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.order_repo = OrderRepository(session)

    async def process_payment(self, data: PaymentCreate) -> Payment:
        order = await self.order_repo.get_by_id(data.order_id)
        if not order:
            raise NotFoundException("Order", data.order_id)

        payment = Payment(
            order_id=order.id,
            restaurant_id=order.restaurant_id,
            amount=data.amount,
            payment_method=data.payment_method,
            status=PaymentStatus.PAID,
            transaction_reference=data.transaction_reference
        )
        self.session.add(payment)

        # Update order payment status
        order.payment_status = PaymentStatus.PAID
        if order.status == OrderStatus.SERVED:
            order.status = OrderStatus.COMPLETED

        await self.session.flush()
        return payment
