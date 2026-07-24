from typing import Literal, Optional

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    type: Literal['income', 'expense'] = 'expense'


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[Literal['income', 'expense']] = None
