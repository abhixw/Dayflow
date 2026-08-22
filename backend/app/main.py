from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import analytics, attendance, auth, employees, leaves, notifications, payroll

app = FastAPI(title="Dayflow HRMS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(leaves.router)
app.include_router(payroll.router)
app.include_router(notifications.router)
app.include_router(analytics.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
