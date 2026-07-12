from __future__ import annotations

from backend.db.budget import _connect

DEFAULT_ORDER = [
    '収入', '家賃', '水道代', '電気代', 'ガス代', '固定光代',
    '携帯代1', '携帯代2', 'クレジットカード1', 'クレジットカード2',
    '後払い', '共済', 'その他',
]

# Demo safeguard: category names are the only free-text field in this app,
# so new/renamed categories must come from this fixed list. This makes it
# structurally impossible to store a real name or other personal info in a
# category name, without needing per-user data isolation. Deliberately kept
# to just the default set -- no extra "spare" names -- to keep the surface
# area small.
ALLOWED_CATEGORY_NAMES = DEFAULT_ORDER


def ensure_schema():
    conn = _connect()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                type ENUM('income', 'expense') NOT NULL DEFAULT 'expense',
                sort_order INT NOT NULL DEFAULT 0
            )
        ''')
        cursor.execute('SELECT COUNT(*) FROM categories')
        if cursor.fetchone()[0] == 0:
            _seed_from_existing_data(conn, cursor)
        conn.commit()
    finally:
        cursor.close()
        conn.close()


def _seed_from_existing_data(conn, cursor):
    cursor.execute("SELECT DISTINCT category FROM budget WHERE category NOT IN ('合計', '残高')")
    existing = [row[0] for row in cursor.fetchall()]

    ordered = [name for name in DEFAULT_ORDER if name in existing]
    ordered += [name for name in existing if name not in ordered]

    rows = [
        (name, 'income' if name == '収入' else 'expense', i)
        for i, name in enumerate(ordered)
    ]
    if rows:
        cursor.executemany(
            'INSERT INTO categories (name, type, sort_order) VALUES (%s, %s, %s)',
            rows,
        )


def list_categories() -> list[dict]:
    conn = _connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT id, name, type, sort_order FROM categories ORDER BY sort_order, id')
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


def add_category(name: str, type_: str = 'expense') -> dict:
    conn = _connect()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT COALESCE(MAX(sort_order), -1) + 1 FROM categories')
        next_order = cursor.fetchone()[0]
        cursor.execute(
            'INSERT INTO categories (name, type, sort_order) VALUES (%s, %s, %s)',
            (name, type_, next_order),
        )
        new_id = cursor.lastrowid
        conn.commit()
        return {'id': new_id, 'name': name, 'type': type_, 'sort_order': next_order}
    finally:
        cursor.close()
        conn.close()


def get_or_create(name: str, default_type: str = 'expense') -> dict:
    conn = _connect()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('SELECT id, name, type, sort_order FROM categories WHERE name = %s', (name,))
        row = cursor.fetchone()
        if row:
            return row
    finally:
        cursor.close()
        conn.close()
    return add_category(name, default_type)


def has_data(name: str) -> bool:
    conn = _connect()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM budget WHERE category = %s', (name,))
    count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return count > 0


def delete_category(category_id: int) -> None:
    conn = _connect()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM categories WHERE id = %s', (category_id,))
        conn.commit()
    finally:
        cursor.close()
        conn.close()


def update_category(category_id: int, name: str | None = None, type_: str | None = None) -> None:
    conn = _connect()
    cursor = conn.cursor()
    try:
        if name is not None:
            cursor.execute('SELECT name FROM categories WHERE id = %s', (category_id,))
            row = cursor.fetchone()
            if row and row[0] != name:
                cursor.execute('UPDATE budget SET category = %s WHERE category = %s', (name, row[0]))
            cursor.execute('UPDATE categories SET name = %s WHERE id = %s', (name, category_id))
        if type_ is not None:
            cursor.execute('UPDATE categories SET type = %s WHERE id = %s', (type_, category_id))
        conn.commit()
    finally:
        cursor.close()
        conn.close()
