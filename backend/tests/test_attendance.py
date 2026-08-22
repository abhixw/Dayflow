EMPLOYEE_PAYLOAD = {
    "employee_id": "EMP200",
    "email": "attendance.employee@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
    "first_name": "John",
    "last_name": "Doe",
}

EMPLOYEE2_PAYLOAD = {
    "employee_id": "EMP201",
    "email": "attendance.employee2@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
    "first_name": "Jane",
    "last_name": "Smith",
}

HR_PAYLOAD = {
    "employee_id": "HR200",
    "email": "attendance.hr@example.com",
    "password": "supersecret123",
    "role": "HR",
    "first_name": "Hana",
    "last_name": "Reyes",
}


async def _signup_and_login(client, payload):
    signup_response = await client.post("/api/auth/signup", json=payload)
    assert signup_response.status_code == 201

    login_response = await client.post(
        "/api/auth/login", json={"email": payload["email"], "password": payload["password"]}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_response = await client.get("/api/employees/me", headers=headers)
    assert me_response.status_code == 200
    employee_pk = me_response.json()["id"]

    return employee_pk, headers


async def test_check_in_success(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    response = await client.post("/api/attendance/check-in", headers=headers)
    assert response.status_code == 201
    body = response.json()
    assert body["check_in"] is not None
    assert body["check_out"] is None
    assert body["status"] == "PRESENT"


async def test_duplicate_check_in_rejected(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    first = await client.post("/api/attendance/check-in", headers=headers)
    assert first.status_code == 201
    second = await client.post("/api/attendance/check-in", headers=headers)
    assert second.status_code == 409


async def test_check_out_success(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    await client.post("/api/attendance/check-in", headers=headers)
    response = await client.post("/api/attendance/check-out", headers=headers)
    assert response.status_code == 200
    assert response.json()["check_out"] is not None


async def test_check_out_before_check_in_rejected(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    response = await client.post("/api/attendance/check-out", headers=headers)
    assert response.status_code == 400


async def test_duplicate_check_out_rejected(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    await client.post("/api/attendance/check-in", headers=headers)
    first = await client.post("/api/attendance/check-out", headers=headers)
    assert first.status_code == 200
    second = await client.post("/api/attendance/check-out", headers=headers)
    assert second.status_code == 409


async def test_employee_sees_only_own_attendance(client):
    _, headers1 = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    _, headers2 = await _signup_and_login(client, EMPLOYEE2_PAYLOAD)

    await client.post("/api/attendance/check-in", headers=headers1)
    await client.post("/api/attendance/check-in", headers=headers2)

    response = await client.get("/api/attendance/me", headers=headers1)
    assert response.status_code == 200
    records = response.json()
    assert len(records) == 1


async def test_employee_cannot_access_admin_attendance_endpoints(client):
    employee_id, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    list_response = await client.get("/api/attendance", headers=headers)
    assert list_response.status_code == 403
    detail_response = await client.get(f"/api/attendance/{employee_id}", headers=headers)
    assert detail_response.status_code == 403


async def test_hr_sees_all_attendance(client):
    employee_id, employee_headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    _, hr_headers = await _signup_and_login(client, HR_PAYLOAD)

    await client.post("/api/attendance/check-in", headers=employee_headers)

    list_response = await client.get("/api/attendance", headers=hr_headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) >= 1

    detail_response = await client.get(f"/api/attendance/{employee_id}", headers=hr_headers)
    assert detail_response.status_code == 200
    assert len(detail_response.json()) == 1
