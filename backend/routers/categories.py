from fastapi import APIRouter, HTTPException
from backend.schemas.category import CategoryCreate, CategoryUpdate
from backend.db import categories as db

router = APIRouter(prefix='/categories', tags=['categories'])


@router.get('')
def list_categories():
    return db.list_categories()


@router.post('', status_code=201)
def create_category(body: CategoryCreate):
    if body.name not in db.ALLOWED_CATEGORY_NAMES:
        raise HTTPException(status_code=400, detail='この名前はデモで使用できません。一覧にある名前から選んでください')
    if any(cat['name'] == body.name for cat in db.list_categories()):
        raise HTTPException(status_code=409, detail='同じ名前のカテゴリがすでに存在します')
    return db.add_category(body.name, body.type)


@router.put('/{category_id}')
def update_category(category_id: int, body: CategoryUpdate):
    if not any(cat['id'] == category_id for cat in db.list_categories()):
        raise HTTPException(status_code=404, detail='Category not found')
    if body.name is not None and body.name not in db.ALLOWED_CATEGORY_NAMES:
        raise HTTPException(status_code=400, detail='この名前はデモで使用できません。一覧にある名前から選んでください')
    db.update_category(category_id, body.name, body.type)
    return {'ok': True}


@router.delete('/{category_id}')
def delete_category(category_id: int):
    cat = next((c for c in db.list_categories() if c['id'] == category_id), None)
    if not cat:
        raise HTTPException(status_code=404, detail='Category not found')
    if db.has_data(cat['name']):
        raise HTTPException(status_code=409, detail='このカテゴリにはデータが記録されているため削除できません')
    db.delete_category(category_id)
    return {'ok': True}
