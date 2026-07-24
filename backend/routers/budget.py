from __future__ import annotations

import csv
import io
import re

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response
from backend.schemas.budget import BudgetCreate, BudgetUpdate
from backend.db import budget as db
from backend.db import categories as categories_db

router = APIRouter(prefix='/budget', tags=['budget'])

MONTH_LABEL_RE = re.compile(r'(\d+)年(\d+)月')


def _check_allowed_amounts(values: dict[str, int]) -> None:
    invalid = sorted({v for v in values.values() if v not in db.ALLOWED_AMOUNTS})
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f'一覧にない金額は使用できません: {", ".join(str(v) for v in invalid)}',
        )


def _build_pivot(rows):
    months_keys: list[str] = []
    months_labels: list[str] = []
    pivot: dict[str, dict] = {}

    for row in rows:
        d = row['date']
        key = d.strftime('%Y-%m-%d')
        if key not in pivot:
            pivot[key] = {}
            months_keys.append(key)
            months_labels.append(f'{d.year}年{d.month}月')
        val = row['income'] if row['income'] is not None else row['expense']
        pivot[key][row['category']] = val

    return months_keys, months_labels, pivot


@router.get('/history')
def get_history():
    months_keys, months_labels, pivot = _build_pivot(db.get_history())
    months = [{'key': k, 'label': l} for k, l in zip(months_keys, months_labels)]
    items = [cat['name'] for cat in categories_db.list_categories()] + ['合計', '残高']
    return {'months': months, 'pivot': pivot, 'items': items}


@router.get('/export')
def export_csv(dates: str | None = None):
    months_keys, months_labels, pivot = _build_pivot(db.get_history())
    items = [cat['name'] for cat in categories_db.list_categories()] + ['合計', '残高']

    if dates is not None:
        selected = set(dates.split(','))
        filtered = [(k, l) for k, l in zip(months_keys, months_labels) if k in selected]
        months_keys = [k for k, _ in filtered]
        months_labels = [l for _, l in filtered]

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([''] + months_labels)
    for name in items:
        writer.writerow([name] + [pivot[key].get(name, '') for key in months_keys])

    return Response(
        content=buffer.getvalue().encode('utf-8-sig'),
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="budget.csv"'},
    )


@router.get('/{date}/exists')
def check_exists(date: str):
    return {'exists': db.exists(date)}


@router.get('/{date}')
def get_month(date: str):
    data = db.get_month_data(date)
    if not data:
        raise HTTPException(status_code=404, detail='Data not found')
    return data


@router.post('', status_code=201)
def create_budget(body: BudgetCreate):
    if body.today not in db.ALLOWED_DATES:
        raise HTTPException(status_code=400, detail='このデモでは新しい月を追加できません')
    if db.exists(body.today):
        raise HTTPException(status_code=409, detail='この月のデータはすでに存在します')
    _check_allowed_amounts(body.values)
    db.save(body.today, body.values, categories_db.list_categories())
    return {'ok': True}


@router.put('/{date}')
def update_budget(date: str, body: BudgetUpdate):
    _check_allowed_amounts(body.values)
    db.update(date, body.values, categories_db.list_categories())
    return {'ok': True}


@router.delete('/{date}')
def delete_budget(date: str):
    if not db.exists(date):
        raise HTTPException(status_code=404, detail='Data not found')
    db.delete(date)
    return {'ok': True}


def _decode_csv(raw: bytes) -> str:
    try:
        return raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        return raw.decode('cp932')


def _parse_month_label(label: str) -> str | None:
    m = MONTH_LABEL_RE.search(label)
    if not m:
        return None
    year, month = int(m.group(1)), int(m.group(2))
    return f'{year:04d}-{month:02d}-01'


def _parse_amount(text: str) -> int:
    text = text.strip().replace('¥', '').replace(',', '')
    return int(text) if text else 0


@router.post('/import')
async def import_csv(file: UploadFile = File(...)):
    raw = await file.read()
    try:
        text = _decode_csv(raw)
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail='文字コードを読み取れませんでした')

    rows = list(csv.reader(io.StringIO(text)))
    if not rows:
        raise HTTPException(status_code=400, detail='空のファイルです')

    header = rows[0]
    month_cols = []
    rejected_months: list[str] = []
    for i, cell in enumerate(header[1:], start=1):
        date = _parse_month_label(cell)
        if not date:
            continue
        if date not in db.ALLOWED_DATES:
            rejected_months.append(cell)
            continue
        month_cols.append((i, date))
    if not month_cols:
        raise HTTPException(status_code=400, detail='取り込める月の列が見つかりませんでした(2026年2月〜7月のみ対応)')

    values_by_date: dict[str, dict[str, int]] = {date: {} for _, date in month_cols}
    existing_names = {cat['name'] for cat in categories_db.list_categories()}
    added_categories: list[str] = []
    rejected_categories: list[str] = []
    rejected_amounts: list[str] = []

    for row in rows[1:]:
        if not row or not row[0].strip():
            continue
        category_name = row[0].strip()
        if category_name in ('合計', '残高'):
            continue
        if category_name not in categories_db.ALLOWED_CATEGORY_NAMES:
            if category_name not in rejected_categories:
                rejected_categories.append(category_name)
            continue
        if category_name not in existing_names:
            added_categories.append(category_name)
            existing_names.add(category_name)
        categories_db.get_or_create(category_name, 'income' if category_name == '収入' else 'expense')

        for col_index, date in month_cols:
            cell = row[col_index] if col_index < len(row) else ''
            amount = _parse_amount(cell)
            if amount not in db.ALLOWED_AMOUNTS:
                rejected_amounts.append(f'{date} {category_name}: {amount}')
                amount = 0
            values_by_date[date][category_name] = amount

    all_categories = categories_db.list_categories()
    for date, values in values_by_date.items():
        db.update(date, values, all_categories)

    return {
        'imported_months': sorted(values_by_date.keys()),
        'added_categories': added_categories,
        'rejected_categories': rejected_categories,
        'rejected_amounts': rejected_amounts,
        'rejected_months': rejected_months,
    }
