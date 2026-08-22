EMPLOYEE_PAYLOAD = {
    "employee_id": "EMP500",
    "email": "notif.employee@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
}

EMPLOYEE2_PAYLOAD = {
    "employee_id": "EMP501",
    "email": "notif.employee2@example.com",
    "password": "supersecret123",
    "role": "EMPLOYEE",
}

HR_PAYLOAD = {
    "employee_id": "HR500",
    "email": "notif.hr@example.com",
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

    return client


async def test_notification_created_on_leave_submission(client_factory):
    employee_client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)

    create_response = await employee_client.post("/api/leaves", json=LEAVE_PAYLOAD)
    assert create_response.status_code == 201

    response = await hr_client.get("/api/notifications")
    assert response.status_code == 200
    body = response.json()
    assert body["unreadCount"] == 1
    assert body["items"][0]["type"] == "LEAVE_SUBMITTED"
    assert body["items"][0]["isRead"] is False


async def test_get_own_notifications_only(client_factory):
    employee_client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    employee2_client = await _signup_and_login(client_factory, EMPLOYEE2_PAYLOAD)
    await _signup_and_login(client_factory, HR_PAYLOAD)

    await employee_client.post("/api/leaves", json=LEAVE_PAYLOAD)

    # The HR-only LEAVE_SUBMITTED notification must not leak to employee2.
    response = await employee2_client.get("/api/notifications")
    assert response.status_code == 200
    assert response.json()["items"] == []


async def test_cannot_mark_another_users_notification_read(client_factory):
    employee_client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)

    await employee_client.post("/api/leaves", json=LEAVE_PAYLOAD)
    notification_id = (await hr_client.get("/api/notifications")).json()["items"][0]["id"]

    response = await employee_client.patch(f"/api/notifications/{notification_id}/read")
    assert response.status_code == 404


async def test_mark_notification_read(client_factory):
    employee_client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)

    await employee_client.post("/api/leaves", json=LEAVE_PAYLOAD)
    notification_id = (await hr_client.get("/api/notifications")).json()["items"][0]["id"]

    response = await hr_client.patch(f"/api/notifications/{notification_id}/read")
    assert response.status_code == 200
    assert response.json()["isRead"] is True

    count_response = await hr_client.get("/api/notifications/unread-count")
    assert count_response.json()["unreadCount"] == 0


async def test_mark_all_read(client_factory):
    employee_client = await _signup_and_login(client_factory, EMPLOYEE_PAYLOAD)
    employee2_client = await _signup_and_login(client_factory, EMPLOYEE2_PAYLOAD)
    hr_client = await _signup_and_login(client_factory, HR_PAYLOAD)

    await employee_client.post("/api/leaves", json=LEAVE_PAYLOAD)
    await employee2_client.post(
        "/api/leaves", json={**LEAVE_PAYLOAD, "start_date": "2026-11-01", "end_date": "2026-11-02"}
    )

    count_before = (await hr_client.get("/api/notifications/unread-count")).json()["unreadCount"]
    assert count_before == 2

    response = await hr_client.patch("/api/notifications/read-all")
    assert response.status_code == 204

    count_after = (await hr_client.get("/api/notifications/unread-count")).json()["unreadCount"]
    assert count_after == 0
