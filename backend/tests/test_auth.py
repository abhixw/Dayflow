SIGNUP_PAYLOAD = {
    "employee_id": "EMP001",
    "email": "employee@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
    "first_name": "John",
    "last_name": "Doe",
}


async def _signup(client, **overrides):
    payload = {**SIGNUP_PAYLOAD, **overrides}
    return await client.post("/api/auth/signup", json=payload)


async def test_signup_success(client):
    response = await _signup(client)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == SIGNUP_PAYLOAD["email"]
    assert body["role"] == "EMPLOYEE"
    assert "password" not in body
    assert "password_hash" not in body


async def test_signup_rejects_admin_role(client):
    response = await _signup(client, role="ADMIN", employee_id="EMP999", email="admin@example.com")
    assert response.status_code == 422


async def test_signup_duplicate_email(client):
    await _signup(client)
    response = await _signup(client, employee_id="EMP002")
    assert response.status_code == 409
    assert "email" in response.json()["detail"].lower()


async def test_signup_duplicate_employee_id(client):
    await _signup(client)
    response = await _signup(client, email="another@example.com")
    assert response.status_code == 409
    assert "employee id" in response.json()["detail"].lower()


async def test_login_success(client):
    await _signup(client)
    response = await client.post(
        "/api/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


async def test_login_invalid_credentials(client):
    await _signup(client)
    response = await client.post(
        "/api/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": "wrongpassword"},
    )
    assert response.status_code == 401


async def test_protected_route_without_token(client):
    response = await client.post("/api/auth/logout")
    assert response.status_code == 401


async def test_protected_route_with_invalid_token(client):
    response = await client.post(
        "/api/auth/logout", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401


async def test_protected_route_with_token(client):
    await _signup(client)
    login_response = await client.post(
        "/api/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    token = login_response.json()["access_token"]
    response = await client.post(
        "/api/auth/logout", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
