EMPLOYEE_PAYLOAD = {
    "employee_id": "EMP600",
    "email": "analytics.employee@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
}

HR_PAYLOAD = {
    "employee_id": "HR600",
    "email": "analytics.hr@example.com",
    "password": "supersecret123",
    "role": "HR",
}

LEAVE_PAYLOAD = {
    "leave_type": "PAID",
    "start_date": "2026-09-01",
    "end_date": "2026-09-03",
    "remarks": "Family trip",
}


async def _signup_and_login(client_factory, payload):
    client = await client_factory()
    signup_response = await client.post("/api/auth/signup", json=payload)
    assert signup_response.status_code == 201

    login_response = await client.post(
        "/api/auth/login", json={"email": payload["email"], "password": payload["password"]}
    )
    assert login_response.status_code == 200

    return client


async def test_employee_can_access_own_analytics(client_factory):
    client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.get("/api/analytics/me")
    assert response.status_code == 200
    body = response.json()
    assert "attendance" in body
    assert "leave" in body
    assert "payroll" in body
    assert body["payroll"] is None  # not set up yet


async def test_employee_analytics_reflects_only_own_data(client_factory):
    client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    await client.post("/api/attendance/check-in")
    await client.post("/api/leaves", json=LEAVE_PAYLOAD)

    response = await client.get("/api/analytics/me")
    assert response.status_code == 200
    body = response.json()
    assert body["attendance"]["total"] == 1
    assert body["attendance"]["present"] == 1
    assert body["attendance"]["percentage"] == 100.0
    assert body["leave"]["total"] == 1
    assert body["leave"]["pending"] == 1
    assert body["leave"]["paid"] == 1


async def test_hr_can_access_admin_analytics(client_factory):
    client = await _signup_and_login(client_factory, HR_PAYLOAD)
    response = await client.get("/api/analytics/admin")
    assert response.status_code == 200
    body = response.json()
    assert "employees" in body
    assert "attendance" in body
    assert "leave" in body
    assert "payroll" in body


async def test_employee_cannot_access_admin_analytics(client_factory):
    client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.get("/api/analytics/admin")
    assert response.status_code == 403


async def test_admin_analytics_reflects_org_wide_data(client_factory):
    employee_client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)

    await employee_client.post("/api/attendance/check-in")
    await employee_client.post("/api/leaves", json=LEAVE_PAYLOAD)

    response = await hr_client.get("/api/analytics/admin")
    assert response.status_code == 200
    body = response.json()
    assert body["employees"]["totalEmployees"] == 2
    assert body["employees"]["activeEmployees"] == 2
    assert body["attendance"]["total"] == 1
    assert body["leave"]["total"] == 1
    assert body["leave"]["paid"] == 1
