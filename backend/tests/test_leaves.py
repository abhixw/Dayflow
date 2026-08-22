EMPLOYEE_PAYLOAD = {
    "employee_id": "EMP300",
    "email": "leave.employee@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
}

EMPLOYEE2_PAYLOAD = {
    "employee_id": "EMP301",
    "email": "leave.employee2@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
}

HR_PAYLOAD = {
    "employee_id": "HR300",
    "email": "leave.hr@example.com",
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

    me_response = await client.get("/api/employees/me")
    assert me_response.status_code == 200
    employee_code = me_response.json()["employeeId"]

    return employee_code, client


async def test_apply_leave_success(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.post("/api/leaves", json=LEAVE_PAYLOAD)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "PENDING"
    assert body["leaveType"] == "PAID"


async def test_apply_leave_invalid_date_range(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.post(
        "/api/leaves",
        json={**LEAVE_PAYLOAD, "start_date": "2026-09-05", "end_date": "2026-09-01"},
    )
    assert response.status_code == 422


async def test_apply_overlapping_leave_rejected(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    first = await client.post("/api/leaves", json=LEAVE_PAYLOAD)
    assert first.status_code == 201

    second = await client.post(
        "/api/leaves",
        json={**LEAVE_PAYLOAD, "start_date": "2026-09-02", "end_date": "2026-09-04"},
    )
    assert second.status_code == 409


async def test_employee_views_own_leaves(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    await client.post("/api/leaves", json=LEAVE_PAYLOAD)

    response = await client.get("/api/leaves/me")
    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_employee_cannot_view_others_leave(client_factory):
    _, client1 = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, client2 = await _signup_and_login(client_factory, EMPLOYEE2_PAYLOAD)

    create_response = await client1.post("/api/leaves", json=LEAVE_PAYLOAD)
    leave_id = create_response.json()["id"]

    response = await client2.get(f"/api/leaves/{leave_id}")
    assert response.status_code == 404


async def test_hr_can_view_any_leave(client_factory):
    _, employee_client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)

    create_response = await employee_client.post("/api/leaves", json=LEAVE_PAYLOAD)
    leave_id = create_response.json()["id"]

    response = await hr_client.get(f"/api/leaves/{leave_id}")
    assert response.status_code == 200
    assert response.json()["id"] == leave_id


async def test_get_nonexistent_leave_returns_404(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.get("/api/leaves/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


async def test_employee_cannot_list_all_leaves(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.get("/api/leaves")
    assert response.status_code == 403


async def test_employee_cannot_approve_leave(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    create_response = await client.post("/api/leaves", json=LEAVE_PAYLOAD)
    leave_id = create_response.json()["id"]

    response = await client.patch(f"/api/leaves/{leave_id}/approve", json={"comment": "self-approved"})
    assert response.status_code == 403


async def test_hr_can_list_all_leaves(client_factory):
    _, employee_client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)
    await employee_client.post("/api/leaves", json=LEAVE_PAYLOAD)

    response = await hr_client.get("/api/leaves")
    assert response.status_code == 200
    assert len(response.json()) >= 1


async def test_hr_approve_leave(client_factory):
    _, employee_client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)
    create_response = await employee_client.post("/api/leaves", json=LEAVE_PAYLOAD)
    leave_id = create_response.json()["id"]

    response = await hr_client.patch(f"/api/leaves/{leave_id}/approve", json={"comment": "Approved, enjoy!"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "APPROVED"
    assert body["reviewComment"] == "Approved, enjoy!"
    assert body["reviewedAt"] is not None


async def test_hr_reject_leave(client_factory):
    _, employee_client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)
    create_response = await employee_client.post("/api/leaves", json=LEAVE_PAYLOAD)
    leave_id = create_response.json()["id"]

    response = await hr_client.patch(f"/api/leaves/{leave_id}/reject", json={"comment": "Not enough coverage"})
    assert response.status_code == 200
    assert response.json()["status"] == "REJECTED"


async def test_cannot_approve_already_processed_leave(client_factory):
    _, employee_client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)
    create_response = await employee_client.post("/api/leaves", json=LEAVE_PAYLOAD)
    leave_id = create_response.json()["id"]

    first = await hr_client.patch(f"/api/leaves/{leave_id}/approve", json={"comment": "ok"})
    assert first.status_code == 200

    second = await hr_client.patch(f"/api/leaves/{leave_id}/reject", json={"comment": "changed my mind"})
    assert second.status_code == 409
