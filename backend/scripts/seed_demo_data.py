"""Seed the database with fake household-budget data for demo purposes.

Usage (run from the repo root, backend/.env must point at the demo DB):
    python -m backend.scripts.seed_demo_data
    python -m backend.scripts.seed_demo_data --reset   # wipe existing rows for the seeded months first
    python -m backend.scripts.seed_demo_data --months 12
"""
from __future__ import annotations

import argparse
import random
from datetime import date

from backend.db import budget as budget_db
from backend.db import categories as categories_db

# Fake amounts only -- no real personal data. Every value here must come from
# backend.db.budget.ALLOWED_AMOUNTS, since that's the only set of numbers the
# API will accept when this month is later edited and saved again. '収入'
# skews toward the larger choices (income), everything else toward the
# smaller ones (expense), just for a plausible-looking demo balance.
INCOME_CHOICES = [10000, 50000, 100000]
EXPENSE_CHOICES = [0, 1000, 5000, 10000]


def _months_back(n: int) -> list[str]:
    today = date.today()
    year, month = today.year, today.month
    result = []
    for _ in range(n):
        result.append(f'{year:04d}-{month:02d}-01')
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return list(reversed(result))


def seed(months: int, reset: bool, seed_value: int) -> None:
    rng = random.Random(seed_value)

    categories_db.ensure_schema()
    categories = categories_db.list_categories()
    if not categories:
        for i, name in enumerate(categories_db.DEFAULT_ORDER):
            categories_db.add_category(name, 'income' if name == '収入' else 'expense')
        categories = categories_db.list_categories()

    target_dates = _months_back(months)

    for target_date in target_dates:
        values = {
            cat['name']: rng.choice(INCOME_CHOICES if cat['type'] == 'income' else EXPENSE_CHOICES)
            for cat in categories
        }

        exists = budget_db.exists(target_date)
        if exists and not reset:
            print(f'skip {target_date} (already has data, use --reset to overwrite)')
            continue

        if exists:
            budget_db.update(target_date, values, categories)
            print(f'updated {target_date}')
        else:
            budget_db.save(target_date, values, categories)
            print(f'inserted {target_date}')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--months', type=int, default=6, help='how many months of dummy data to generate')
    parser.add_argument('--reset', action='store_true', help='overwrite months that already have data')
    parser.add_argument('--seed', type=int, default=42, help='random seed for reproducible dummy amounts')
    args = parser.parse_args()

    seed(months=args.months, reset=args.reset, seed_value=args.seed)


if __name__ == '__main__':
    main()
