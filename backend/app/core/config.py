from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    test_database_url: str | None = None
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173"

    # Base URL of the deployed frontend, used to build links embedded in
    # emails (e.g. the password reset link) — never inferred from the
    # incoming request, since the API and SPA live on different domains.
    frontend_url: str = "http://localhost:5175"

    # This API's own public base URL, used to build absolute links to files
    # it serves itself (e.g. uploaded profile pictures) — a relative path
    # would resolve against the frontend's origin in the browser, not ours.
    backend_url: str = "http://localhost:8000"

    # Cookie-based auth: secure=False/samesite=lax by default for local HTTP
    # dev across localhost ports; set cookie_secure=true behind HTTPS in prod.
    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    @property
    def access_token_expire_seconds(self) -> int:
        return self.access_token_expire_minutes * 60

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
