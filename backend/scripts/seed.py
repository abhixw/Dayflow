"""Seed development users: 1 ADMIN, 1 HR, 2-3 EMPLOYEEs.

This is the only supported way to create an ADMIN account — public signup
rejects the ADMIN role by design (see SignupRequest.role_must_be_public).

Usage:
    python -m scripts.seed
"""

import asyncio
import uuid

from sqlalchemy import select

from app.db.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models.employee import Employee
from app.models.enums import Role
from app.models.user import User

SEED_USERS = [
    {
        "employee_id": "ADMIN001",
        "email": "admin@dayflow.dev",
        "password": "AdminPass123!",
        "role": Role.ADMIN,
        "first_name": "Ava",
        "last_name": "Admin",
    },
    {
        "employee_id": "HR001",
        "email": "hr@dayflow.dev",
        "password": "HrPass123!",
        "role": Role.HR,
        "first_name": "Hana",
        "last_name": "Reyes",
    },
    {
        "employee_id": "EMP001",
        "email": "employee1@dayflow.dev",
        "password": "EmpPass123!",
        "role": Role.EMPLOYEE,
        "first_name": "John",
        "last_name": "Doe",
    },
    {
        "employee_id": "EMP002",
        "email": "employee2@dayflow.dev",
        "password": "EmpPass123!",
        "role": Role.EMPLOYEE,
        "first_name": "Jane",
        "last_name": "Smith",
    },
    {
        "employee_id": "EMP003",
        "email": "employee3@dayflow.dev",
        "password": "EmpPass123!",
        "role": Role.EMPLOYEE,
        "first_name": "Sam",
        "last_name": "Lee",
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        for entry in SEED_USERS:
            existing = await session.scalar(select(User).where(User.email == entry["email"]))
            if existing:
                print(f"skip (exists): {entry['email']}")
                continue

            user = User(
                id=uuid.uuid4(),
                employee_id=entry["employee_id"],
                email=entry["email"],
                password_hash=hash_password(entry["password"]),
                role=entry["role"],
                is_verified=True,
                is_active=True,
            )
            session.add(user)
            await session.flush()

            employee = Employee(
                id=uuid.uuid4(),
                user_id=user.id,
                employee_id=user.employee_id,
                first_name=entry["first_name"],
                last_name=entry["last_name"],
            )
            session.add(employee)
            print(f"created: {entry['email']} ({entry['role'].value})")

        await session.commit()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
