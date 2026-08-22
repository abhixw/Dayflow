from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings

# NullPool: no connections are cached across requests. Required because asyncpg
# connections are bound to the event loop that created them, and pooling would
# leak connections across loops (fatal under pytest-asyncio's per-test loops,
# and unnecessary anyway since Neon's own pooler endpoint handles reuse).
engine = create_async_engine(settings.database_url, poolclass=NullPool)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
