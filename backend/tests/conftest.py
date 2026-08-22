import contextlib

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.db.database import get_db
from app.main import app

if not settings.test_database_url:
    raise RuntimeError(
        "TEST_DATABASE_URL is not set. Tests must run against an isolated "
        "database, never the dev/prod one, to avoid wiping seed data."
    )

test_engine = create_async_engine(settings.test_database_url, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(bind=test_engine, expire_on_commit=False)


async def _override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
async def _clean_tables():
    yield
    async with TestSessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE employees, users RESTART IDENTITY CASCADE"))
        await session.commit()
    # asyncpg connections are bound to the event loop that created them; pytest-asyncio
    # gives each test function its own loop, so pooled connections must be dropped
    # between tests instead of being reused on the next (different) loop.
    await test_engine.dispose()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def client_factory():
    """Cookie auth means one client can only hold one identity's cookie at a
    time (each login overwrites the last). Tests that need two authenticated
    identities concurrently (e.g. HR acting on an employee's data) must use
    separate clients, each with its own cookie jar."""
    async with contextlib.AsyncExitStack() as stack:

        async def _make() -> AsyncClient:
            transport = ASGITransport(app=app)
            ac = AsyncClient(transport=transport, base_url="http://test")
            await stack.enter_async_context(ac)
            return ac

        yield _make
