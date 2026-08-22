import uuid
from datetime import datetime

from app.models.enums import NotificationType
from app.schemas.base import CamelModel


class NotificationOut(CamelModel):
    id: uuid.UUID
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime


class NotificationListResponse(CamelModel):
    items: list[NotificationOut]
    unread_count: int


class UnreadCountResponse(CamelModel):
    unread_count: int
