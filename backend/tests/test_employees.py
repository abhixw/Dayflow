EMPLOYEE_PAYLOAD = {
    "employee_id": "EMP100",
    "email": "profile.employee@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
    "first_name": "John",
    "last_name": "Doe",
}

HR_PAYLOAD = {
    "employee_id": "HR100",
    "email": "profile.hr@example.com",
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

    # /api/employees/{employee_id} takes the employees.id PK, distinct from the
    # users.id returned by signup, so fetch it via /me.
    me_response = await client.get("/api/employees/me", headers=headers)
    assert me_response.status_code == 200
    employee_pk = me_response.json()["id"]

    return employee_pk, headers


async def test_employee_views_own_profile(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    response = await client.get("/api/employees/me", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == EMPLOYEE_PAYLOAD["email"]
    assert body["employee_id"] == EMPLOYEE_PAYLOAD["employee_id"]
    assert body["role"] == "EMPLOYEE"
    assert "password" not in body
    assert "password_hash" not in body


async def test_employee_edits_allowed_fields(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    response = await client.patch(
        "/api/employees/me",
        json={"phone": "555-1234", "address": "123 Main St", "profile_picture": "https://example.com/p.png"},
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["phone"] == "555-1234"
    assert body["address"] == "123 Main St"
    assert body["profile_picture"] == "https://example.com/p.png"


async def test_employee_cannot_modify_restricted_fields(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    response = await client.patch(
        "/api/employees/me",
        json={
            "job_title": "Hacked Title",
            "department": "Hacked Dept",
            "employee_id": "HACKED",
            "role": "ADMIN",
        },
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    # Restricted fields silently ignored: EmployeeSelfUpdate has no such fields.
    assert body["job_title"] is None
    assert body["department"] is None
    assert body["employee_id"] == EMPLOYEE_PAYLOAD["employee_id"]
    assert body["role"] == "EMPLOYEE"


async def test_employee_cannot_list_employees(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    response = await client.get("/api/employees", headers=headers)
    assert response.status_code == 403


async def test_employee_cannot_view_other_employee(client):
    employee_id, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    response = await client.get(f"/api/employees/{employee_id}", headers=headers)
    assert response.status_code == 403


async def test_hr_can_list_and_view_employees(client):
    employee_id, _ = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    _, hr_headers = await _signup_and_login(client, HR_PAYLOAD)

    list_response = await client.get("/api/employees", headers=hr_headers)
    assert list_response.status_code == 200
    ids = {item["employee_id"] for item in list_response.json()}
    assert EMPLOYEE_PAYLOAD["employee_id"] in ids

    detail_response = await client.get(f"/api/employees/{employee_id}", headers=hr_headers)
    assert detail_response.status_code == 200
    assert detail_response.json()["employee_id"] == EMPLOYEE_PAYLOAD["employee_id"]


async def test_hr_can_update_employee_job_details(client):
    employee_id, _ = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    _, hr_headers = await _signup_and_login(client, HR_PAYLOAD)

    response = await client.patch(
        f"/api/employees/{employee_id}",
        json={"job_title": "Software Engineer", "department": "Engineering"},
        headers=hr_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["job_title"] == "Software Engineer"
    assert body["department"] == "Engineering"


async def test_hr_get_nonexistent_employee_returns_404(client):
    _, hr_headers = await _signup_and_login(client, HR_PAYLOAD)
    response = await client.get(
        "/api/employees/00000000-0000-0000-0000-000000000000", headers=hr_headers
    )
    assert response.status_code == 404
