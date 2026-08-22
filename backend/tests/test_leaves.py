EMPLOYEE_PAYLOAD = {
    "employee_id": "EMP300",
    "email": "leave.employee@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
    "first_name": "John",
    "last_name": "Doe",
}

EMPLOYEE2_PAYLOAD = {
    "employee_id": "EMP301",
    "email": "leave.employee2@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
    "first_name": "Jane",
    "last_name": "Smith",
}

HR_PAYLOAD = {
    "employee_id": "HR300",
    "email": "leave.hr@example.com",
    "password": "supersecret123",
    "role": "HR",
    "first_name": "Hana",
    "last_name": "Reyes",
}

LEAVE_PAYLOAD = {
    "leave_type": "PAID",
    "start_date": "2026-09-01",
    "end_date": "2026-09-03",
    "remarks": "Family trip",
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


async def test_apply_leave_success(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    response = await client.post("/api/leaves", json=LEAVE_PAYLOAD, headers=headers)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "PENDING"
    assert body["leave_type"] == "PAID"


async def test_apply_leave_invalid_date_range(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    response = await client.post(
        "/api/leaves",
        json={**LEAVE_PAYLOAD, "start_date": "2026-09-05", "end_date": "2026-09-01"},
        headers=headers,
    )
    assert response.status_code == 422


async def test_apply_overlapping_leave_rejected(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    first = await client.post("/api/leaves", json=LEAVE_PAYLOAD, headers=headers)
    assert first.status_code == 201

    second = await client.post(
        "/api/leaves",
        json={**LEAVE_PAYLOAD, "start_date": "2026-09-02", "end_date": "2026-09-04"},
        headers=headers,
    )
    assert second.status_code == 409


async def test_employee_views_own_leaves(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    await client.post("/api/leaves", json=LEAVE_PAYLOAD, headers=headers)

    response = await client.get("/api/leaves/me", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_employee_cannot_view_others_leave(client):
    _, headers1 = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    _, headers2 = await _signup_and_login(client, EMPLOYEE2_PAYLOAD)

    create_response = await client.post("/api/leaves", json=LEAVE_PAYLOAD, headers=headers1)
    leave_id = create_response.json()["id"]

    response = await client.get(f"/api/leaves/{leave_id}", headers=headers2)
    assert response.status_code == 404


async def test_hr_can_view_any_leave(client):
    _, employee_headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    _, hr_headers = await _signup_and_login(client, HR_PAYLOAD)

    create_response = await client.post("/api/leaves", json=LEAVE_PAYLOAD, headers=employee_headers)
    leave_id = create_response.json()["id"]

    response = await client.get(f"/api/leaves/{leave_id}", headers=hr_headers)
    assert response.status_code == 200
    assert response.json()["id"] == leave_id


async def test_get_nonexistent_leave_returns_404(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    response = await client.get(
        "/api/leaves/00000000-0000-0000-0000-000000000000", headers=headers
    )
    assert response.status_code == 404


async def test_employee_cannot_list_all_leaves(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    response = await client.get("/api/leaves", headers=headers)
    assert response.status_code == 403


async def test_employee_cannot_approve_leave(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    create_response = await client.post("/api/leaves", json=LEAVE_PAYLOAD, headers=headers)
    leave_id = create_response.json()["id"]

    response = await client.patch(
        f"/api/leaves/{leave_id}/approve", json={"comment": "self-approved"}, headers=headers
    )
    assert response.status_code == 403


async def test_hr_can_list_all_leaves(client):
    _, employee_headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    _, hr_headers = await _signup_and_login(client, HR_PAYLOAD)
    await client.post("/api/leaves", json=LEAVE_PAYLOAD, headers=employee_headers)

    response = await client.get("/api/leaves", headers=hr_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


async def test_hr_approve_leave(client):
    _, employee_headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    _, hr_headers = await _signup_and_login(client, HR_PAYLOAD)
    create_response = await client.post("/api/leaves", json=LEAVE_PAYLOAD, headers=employee_headers)
    leave_id = create_response.json()["id"]

    response = await client.patch(
        f"/api/leaves/{leave_id}/approve", json={"comment": "Approved, enjoy!"}, headers=hr_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "APPROVED"
    assert body["review_comment"] == "Approved, enjoy!"
    assert body["reviewed_at"] is not None


async def test_hr_reject_leave(client):
    _, employee_headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    _, hr_headers = await _signup_and_login(client, HR_PAYLOAD)
    create_response = await client.post("/api/leaves", json=LEAVE_PAYLOAD, headers=employee_headers)
    leave_id = create_response.json()["id"]

    response = await client.patch(
        f"/api/leaves/{leave_id}/reject", json={"comment": "Not enough coverage"}, headers=hr_headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "REJECTED"


async def test_cannot_approve_already_processed_leave(client):
    _, employee_headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    _, hr_headers = await _signup_and_login(client, HR_PAYLOAD)
    create_response = await client.post("/api/leaves", json=LEAVE_PAYLOAD, headers=employee_headers)
    leave_id = create_response.json()["id"]

    first = await client.patch(
        f"/api/leaves/{leave_id}/approve", json={"comment": "ok"}, headers=hr_headers
    )
    assert first.status_code == 200

    second = await client.patch(
        f"/api/leaves/{leave_id}/reject", json={"comment": "changed my mind"}, headers=hr_headers
    )
    assert second.status_code == 409
