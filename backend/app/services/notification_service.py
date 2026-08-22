import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotificationNotFoundError
from app.models.enums import NotificationType
from app.models.notification import Notification
from app.schemas.notification import NotificationListResponse, NotificationOut


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    notification_type: NotificationType,
    title: str,
    message: str,
) -> Notification:
    """Create a single in-app notification. Callers that also need an email
    (leave/payroll events) should call email_service separately — this
    function only writes the notification row."""
    notification = Notification(
        id=uuid.uuid4(),
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        is_read=False,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification


async def get_notifications(db: AsyncSession, user_id: uuid.UUID) -> NotificationListResponse:
    result = await db.scalars(
        select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc())
    )
    items = [NotificationOut.model_validate(n) for n in result]
    unread_count = await get_unread_count(db, user_id)
    return NotificationListResponse(items=items, unread_count=unread_count)


async def get_unread_count(db: AsyncSession, user_id: uuid.UUID) -> int:
    count = await db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
    )
    return count or 0


async def mark_read(db: AsyncSession, user_id: uuid.UUID, notification_id: uuid.UUID) -> NotificationOut:
    notification = await db.get(Notification, notification_id)
    if notification is None or notification.user_id != user_id:
        raise NotificationNotFoundError

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return NotificationOut.model_validate(notification)


async def mark_all_read(db: AsyncSession, user_id: uuid.UUID) -> None:
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    await db.commit()
