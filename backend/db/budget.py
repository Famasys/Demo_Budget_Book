import os
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / '.env')

# Demo safeguard: amounts are the only other free-input field besides category
# names, so only these fixed values may be stored. Deliberately a short,
# obviously-fake set (not a realistic per-category range) — with only a
# handful of shared choices, there's no way to approximate a real salary,
# rent, etc. figure, and the numbers read as demo placeholders on sight.
ALLOWED_AMOUNTS = {0, 1000, 5000, 10000, 50000, 100000}

# Demo safeguard: the dataset is capped to exactly these 6 months. Nobody can
# create a 7th month or any month outside this set -- the demo can only ever
# contain what was seeded, never grow.
ALLOWED_DATES = {
    '2026-02-01', '2026-03-01', '2026-04-01',
    '2026-05-01', '2026-06-01', '2026-07-01',
}


def _connect():
    return mysql.connector.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        user=os.environ.get('DB_USER', 'root'),
        password=os.environ['DB_PASSWORD'],
        database=os.environ.get('DB_NAME', 'in_out'),
    )


def exists(date: str) -> bool:
    conn = _connect()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM budget WHERE date = %s', (date,))
    count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return count > 0


def get_history():
    conn = _connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT date, category, income, expense FROM budget ORDER BY date, id')
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


def get_month_data(date: str) -> dict:
    conn = _connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT category, income, expense FROM budget WHERE date = %s AND category NOT IN ('合計', '残高')",
        (date,),
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return {row['category']: row['income'] if row['income'] is not None else row['expense'] for row in rows}


def _build_rows(date: str, values: dict, categories: list[dict]) -> list[tuple]:
    income_total = 0
    expense_total = 0
    rows = []
    for cat in categories:
        amount = values.get(cat['name']) or 0
        if cat['type'] == 'income':
            income_total += amount
            rows.append((date, cat['name'], amount, None))
        else:
            expense_total += amount
            rows.append((date, cat['name'], None, amount))
    balance = income_total - expense_total
    rows.append((date, '合計', None, expense_total))
    rows.append((date, '残高', None, balance))
    return rows


def save(date: str, values: dict, categories: list[dict]):
    conn = _connect()
    cursor = conn.cursor()
    try:
        rows = _build_rows(date, values, categories)
        cursor.executemany(
            'INSERT INTO budget (date, category, income, expense) VALUES (%s, %s, %s, %s)',
            rows,
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()


def delete(date: str):
    conn = _connect()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM budget WHERE date = %s', (date,))
        conn.commit()
    finally:
        cursor.close()
        conn.close()


def delete_all():
    conn = _connect()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM budget')
        conn.commit()
    finally:
        cursor.close()
        conn.close()


def update(date: str, values: dict, categories: list[dict]):
    conn = _connect()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM budget WHERE date = %s', (date,))
        rows = _build_rows(date, values, categories)
        cursor.executemany(
            'INSERT INTO budget (date, category, income, expense) VALUES (%s, %s, %s, %s)',
            rows,
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
