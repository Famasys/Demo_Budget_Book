"""Wipe all budget data, drop non-generic categories, and reseed with fake demo data.

Use this once when preparing the demo copy of the app (separate from the real
household budget hosted on Xserver): it removes any category that isn't part
of the generic default set and repopulates the DB with fake numbers only.

Usage (run from the repo root):
    python -m backend.scripts.reset_demo
    python -m backend.scripts.reset_demo --months 12
"""
from __future__ import annotations

import argparse

from backend.db import budget as budget_db
from backend.db import categories as categories_db
from backend.scripts.seed_demo_data import seed


def reset(months: int, seed_value: int) -> None:
    categories_db.ensure_schema()

    budget_db.delete_all()
    print('cleared all budget rows')

    keep = set(categories_db.DEFAULT_ORDER)
    for cat in categories_db.list_categories():
        if cat['name'] not in keep:
            categories_db.delete_category(cat['id'])
            print(f"removed category: {cat['name']}")

    if not categories_db.list_categories():
        for i, name in enumerate(categories_db.DEFAULT_ORDER):
            categories_db.add_category(name, 'income' if name == '収入' else 'expense')

    seed(months=months, reset=True, seed_value=seed_value)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--months', type=int, default=6, help='how many months of dummy data to generate')
    parser.add_argument('--seed', type=int, default=42, help='random seed for reproducible dummy amounts')
    args = parser.parse_args()

    reset(months=args.months, seed_value=args.seed)


if __name__ == '__main__':
    main()
