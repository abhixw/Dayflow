SIGNUP_PAYLOAD = {
    "employee_id": "EMP001",
    "email": "employee@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
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


async def test_signup_with_name_sets_employee_name(client):
    signup_response = await _signup(client, name="Jane Doe")
    assert signup_response.status_code == 201

    login_response = await client.post(
        "/api/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    assert login_response.status_code == 200

    me_response = await client.get("/api/employees/me")
    assert me_response.status_code == 200
    assert me_response.json()["name"] == "Jane Doe"


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


async def test_login_sets_httponly_cookie(client):
    await _signup(client)
    response = await client.post(
        "/api/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == SIGNUP_PAYLOAD["email"]
    assert "token" not in body  # not returned to JS, only set as a cookie

    set_cookie = response.headers.get("set-cookie", "")
    assert "access_token=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert response.cookies.get("access_token")


async def test_login_invalid_credentials(client):
    await _signup(client)
    response = await client.post(
        "/api/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert not response.cookies.get("access_token")


async def test_protected_route_without_cookie(client):
    response = await client.post("/api/auth/logout")
    assert response.status_code == 401


async def test_protected_route_with_invalid_cookie(client):
    client.cookies.set("access_token", "not-a-real-token")
    response = await client.post("/api/auth/logout")
    assert response.status_code == 401


async def test_protected_route_with_cookie(client):
    await _signup(client)
    await client.post(
        "/api/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    # No manual header needed: the client's cookie jar already carries the
    # access_token cookie set by the login response above.
    response = await client.post("/api/auth/logout")
    assert response.status_code == 200


async def test_logout_clears_cookie(client):
    await _signup(client)
    await client.post(
        "/api/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    logout_response = await client.post("/api/auth/logout")
    assert logout_response.status_code == 200

    # Cookie jar entry should be gone after the server clears it.
    assert not client.cookies.get("access_token")

    me_response = await client.get("/api/auth/me")
    assert me_response.status_code == 401


async def test_me_returns_current_user(client):
    await _signup(client)
    await client.post(
        "/api/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    response = await client.get("/api/auth/me")
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == SIGNUP_PAYLOAD["email"]
    assert body["employeeId"] == SIGNUP_PAYLOAD["employee_id"]
