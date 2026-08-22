EMPLOYEE_PAYLOAD = {
    "employee_id": "EMP200",
    "email": "attendance.employee@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
}

EMPLOYEE2_PAYLOAD = {
    "employee_id": "EMP201",
    "email": "attendance.employee2@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
}

HR_PAYLOAD = {
    "employee_id": "HR200",
    "email": "attendance.hr@example.com",
    "password": "supersecret123",
    "role": "HR",
}


async def _signup_and_login(client_factory, payload):
    client = await client_factory()
    signup_response = await client.post("/api/auth/signup", json=payload)
    assert signup_response.status_code == 201

    login_response = await client.post(
        "/api/auth/login", json={"email": payload["email"], "password": payload["password"]}
    )
    assert login_response.status_code == 200

    me_response = await client.get("/api/employees/me")
    assert me_response.status_code == 200
    employee_code = me_response.json()["employeeId"]

    return employee_code, client


async def test_check_in_success(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.post("/api/attendance/check-in")
    assert response.status_code == 201
    body = response.json()
    assert body["checkIn"] is not None
    assert body["checkOut"] is None
    assert body["status"] == "PRESENT"


async def test_duplicate_check_in_rejected(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    first = await client.post("/api/attendance/check-in")
    assert first.status_code == 201
    second = await client.post("/api/attendance/check-in")
    assert second.status_code == 409


async def test_check_out_success(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    await client.post("/api/attendance/check-in")
    response = await client.post("/api/attendance/check-out")
    assert response.status_code == 200
    assert response.json()["checkOut"] is not None


async def test_check_out_before_check_in_rejected(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.post("/api/attendance/check-out")
    assert response.status_code == 400


async def test_duplicate_check_out_rejected(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    await client.post("/api/attendance/check-in")
    first = await client.post("/api/attendance/check-out")
    assert first.status_code == 200
    second = await client.post("/api/attendance/check-out")
    assert second.status_code == 409


async def test_employee_sees_only_own_attendance(client_factory):
    _, client1 = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, client2 = await _signup_and_login(client_factory, EMPLOYEE2_PAYLOAD)

    await client1.post("/api/attendance/check-in")
    await client2.post("/api/attendance/check-in")

    response = await client1.get("/api/attendance/me")
    assert response.status_code == 200
    records = response.json()
    assert len(records) == 1


async def test_employee_cannot_access_admin_attendance_endpoints(client_factory):
    employee_code, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    list_response = await client.get("/api/attendance")
    assert list_response.status_code == 403
    detail_response = await client.get(f"/api/attendance/{employee_code}")
    assert detail_response.status_code == 403


async def test_hr_sees_all_attendance(client_factory):
    employee_code, employee_client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)

    await employee_client.post("/api/attendance/check-in")

    list_response = await hr_client.get("/api/attendance")
    assert list_response.status_code == 200
    assert len(list_response.json()) >= 1

    detail_response = await hr_client.get(f"/api/attendance/{employee_code}")
    assert detail_response.status_code == 200
    assert len(detail_response.json()) == 1
    assert detail_response.json()[0]["employeeId"] == employee_code
