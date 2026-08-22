EMPLOYEE_PAYLOAD = {
    "employee_id": "EMP100",
    "email": "profile.employee@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
}

HR_PAYLOAD = {
    "employee_id": "HR100",
    "email": "profile.hr@example.com",
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

    # /api/employees/{employee_id} takes the human-readable employee code
    # (e.g. "EMP100"), matching what the frontend uses everywhere.
    me_response = await client.get("/api/employees/me")
    assert me_response.status_code == 200
    employee_code = me_response.json()["employeeId"]

    return employee_code, client


async def test_employee_views_own_profile(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.get("/api/employees/me")
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == EMPLOYEE_PAYLOAD["email"]
    assert body["employeeId"] == EMPLOYEE_PAYLOAD["employee_id"]
    assert body["role"] == "EMPLOYEE"
    assert "password" not in body
    assert "password_hash" not in body


async def test_employee_edits_allowed_fields(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.patch(
        "/api/employees/me",
        json={"phone": "555-1234", "address": "123 Main St", "profilePictureUrl": "https://example.com/p.png"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["phone"] == "555-1234"
    assert body["address"] == "123 Main St"
    assert body["profilePictureUrl"] == "https://example.com/p.png"


async def test_employee_cannot_modify_restricted_fields(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.patch(
        "/api/employees/me",
        json={
            "jobTitle": "Hacked Title",
            "department": "Hacked Dept",
            "employeeId": "HACKED",
            "role": "ADMIN",
            "status": "INACTIVE",
        },
    )
    assert response.status_code == 200
    body = response.json()
    # Restricted fields silently ignored: EmployeeSelfUpdate has no such fields.
    assert body["jobTitle"] is None
    assert body["department"] is None
    assert body["employeeId"] == EMPLOYEE_PAYLOAD["employee_id"]
    assert body["role"] == "EMPLOYEE"
    assert body["status"] == "ACTIVE"


async def test_employee_cannot_list_employees(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.get("/api/employees")
    assert response.status_code == 403


async def test_employee_cannot_view_other_employee(client_factory):
    employee_code, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.get(f"/api/employees/{employee_code}")
    assert response.status_code == 403


async def test_hr_can_list_and_view_employees(client_factory):
    employee_code, _ = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)

    list_response = await hr_client.get("/api/employees")
    assert list_response.status_code == 200
    codes = {item["employeeId"] for item in list_response.json()}
    assert EMPLOYEE_PAYLOAD["employee_id"] in codes

    detail_response = await hr_client.get(f"/api/employees/{employee_code}")
    assert detail_response.status_code == 200
    assert detail_response.json()["employeeId"] == EMPLOYEE_PAYLOAD["employee_id"]


async def test_hr_can_update_employee_job_details(client_factory):
    employee_code, _ = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)

    response = await hr_client.patch(
        f"/api/employees/{employee_code}",
        json={"name": "Jane Doe", "jobTitle": "Software Engineer", "department": "Engineering"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Jane Doe"
    assert body["jobTitle"] == "Software Engineer"
    assert body["department"] == "Engineering"


async def test_hr_can_deactivate_employee(client_factory):
    employee_code, _ = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)

    response = await hr_client.patch(f"/api/employees/{employee_code}", json={"status": "INACTIVE"})
    assert response.status_code == 200
    assert response.json()["status"] == "INACTIVE"


async def test_hr_get_nonexistent_employee_returns_404(client_factory):
    _, hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)
    response = await hr_client.get("/api/employees/NOPE999")
    assert response.status_code == 404
