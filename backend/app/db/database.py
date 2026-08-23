from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# A real connection pool. The running app has one long-lived event loop for
# its whole process lifetime (unlike pytest-asyncio, which hands each test
# function a fresh loop — asyncpg connections are bound to the loop that
# created them, which is why tests use NullPool instead; see
# tests/conftest.py). Without pooling here, every request paid a fresh
# TCP+TLS+Postgres-auth handshake to Neon from scratch — the dominant cause
# of perceived slowness.
#
# No pool_pre_ping: each round trip to Neon costs ~250ms here, so a ping
# before every single request is a permanent tax, not a one-off. pool_recycle
# already retires connections well before Neon would close them idle, which
# covers the staleness risk pre_ping exists for.
engine = create_async_engine(
    settings.database_url,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,
)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
