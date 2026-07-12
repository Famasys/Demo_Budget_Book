from pydantic import BaseModel


class BudgetCreate(BaseModel):
    today: str
    values: dict[str, int] = {}


class BudgetUpdate(BaseModel):
    values: dict[str, int] = {}
