from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base for all API schemas: accepts snake_case or camelCase on input,
    always serializes camelCase on output (FastAPI's response_model_by_alias
    default), so the frontend's camelCase JSON contract is satisfied while
    snake_case still works for direct/internal callers (e.g. tests)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)
