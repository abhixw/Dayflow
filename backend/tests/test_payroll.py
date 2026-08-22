EMPLOYEE_PAYLOAD = {
    "employee_id": "EMP400",
    "email": "payroll.employee@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
    "first_name": "John",
    "last_name": "Doe",
}

HR_PAYLOAD = {
    "employee_id": "HR400",
    "email": "payroll.hr@example.com",
    "password": "supersecret123",
    "role": "HR",
    "first_name": "Hana",
    "last_name": "Reyes",
}

SALARY_PAYLOAD = {
    "basic_salary": "50000.00",
    "allowances": "5000.00",
    "deductions": "2000.00",
    "gross_salary": "55000.00",
    "net_salary": "53000.00",
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


async def test_employee_payroll_not_set_returns_404(client):
    _, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    response = await client.get("/api/payroll/me", headers=headers)
    assert response.status_code == 404


async def test_employee_cannot_modify_payroll(client):
    employee_id, headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    response = await client.patch(
        f"/api/payroll/{employee_id}", json=SALARY_PAYLOAD, headers=headers
    )
    assert response.status_code == 403


async def test_hr_sets_and_employee_views_payroll(client):
    employee_id, employee_headers = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    _, hr_headers = await _signup_and_login(client, HR_PAYLOAD)

    update_response = await client.patch(
        f"/api/payroll/{employee_id}", json=SALARY_PAYLOAD, headers=hr_headers
    )
    assert update_response.status_code == 200
    assert update_response.json()["basic_salary"] == "50000.00"

    me_response = await client.get("/api/payroll/me", headers=employee_headers)
    assert me_response.status_code == 200
    assert me_response.json()["net_salary"] == "53000.00"


async def test_hr_can_view_employee_payroll(client):
    employee_id, _ = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    _, hr_headers = await _signup_and_login(client, HR_PAYLOAD)

    await client.patch(f"/api/payroll/{employee_id}", json=SALARY_PAYLOAD, headers=hr_headers)
    response = await client.get(f"/api/payroll/{employee_id}", headers=hr_headers)
    assert response.status_code == 200
    assert response.json()["employee_id"] == employee_id


async def test_hr_can_update_existing_payroll(client):
    employee_id, _ = await _signup_and_login(client, EMPLOYEE_PAYLOAD)
    _, hr_headers = await _signup_and_login(client, HR_PAYLOAD)

    await client.patch(f"/api/payroll/{employee_id}", json=SALARY_PAYLOAD, headers=hr_headers)
    second_update = await client.patch(
        f"/api/payroll/{employee_id}", json={"basic_salary": "60000.00"}, headers=hr_headers
    )
    assert second_update.status_code == 200
    body = second_update.json()
    assert body["basic_salary"] == "60000.00"
    # Fields not included in this PATCH stay at their previous value.
    assert body["allowances"] == "5000.00"
