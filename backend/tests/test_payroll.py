EMPLOYEE_PAYLOAD = {
    "employee_id": "EMP400",
    "email": "payroll.employee@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
}

HR_PAYLOAD = {
    "employee_id": "HR400",
    "email": "payroll.hr@example.com",
    "password": "supersecret123",
    "role": "HR",
}

SALARY_PAYLOAD = {
    "basic_salary": "50000.00",
    "allowances": "5000.00",
    "deductions": "2000.00",
    "gross_salary": "55000.00",
    "net_salary": "53000.00",
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


async def test_employee_payroll_not_set_returns_404(client_factory):
    _, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.get("/api/payroll/me")
    assert response.status_code == 404


async def test_employee_cannot_modify_payroll(client_factory):
    employee_code, client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    response = await client.patch(f"/api/payroll/{employee_code}", json=SALARY_PAYLOAD)
    assert response.status_code == 403


async def test_hr_sets_and_employee_views_payroll(client_factory):
    employee_code, employee_client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)

    update_response = await hr_client.patch(f"/api/payroll/{employee_code}", json=SALARY_PAYLOAD)
    assert update_response.status_code == 200
    assert update_response.json()["basicSalary"] == 50000.0

    me_response = await employee_client.get("/api/payroll/me")
    assert me_response.status_code == 200
    assert me_response.json()["netSalary"] == 53000.0


async def test_hr_can_view_employee_payroll(client_factory):
    employee_code, _ = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)

    await hr_client.patch(f"/api/payroll/{employee_code}", json=SALARY_PAYLOAD)
    response = await hr_client.get(f"/api/payroll/{employee_code}")
    assert response.status_code == 200
    assert response.json()["employeeId"] == employee_code


async def test_hr_can_update_existing_payroll(client_factory):
    employee_code, _ = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    _, hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)

    await hr_client.patch(f"/api/payroll/{employee_code}", json=SALARY_PAYLOAD)
    second_update = await hr_client.patch(f"/api/payroll/{employee_code}", json={"basic_salary": "60000.00"})
    assert second_update.status_code == 200
    body = second_update.json()
    assert body["basicSalary"] == 60000.0
    # Fields not included in this PATCH stay at their previous value.
    assert body["allowances"] == 5000.0
