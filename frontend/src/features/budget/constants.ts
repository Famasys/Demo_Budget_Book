// Keep in sync with backend/db/categories.py ALLOWED_CATEGORY_NAMES.
// Category names are the only free-text field in this app, so restricting
// them to this fixed list makes it structurally impossible to register a
// real name or other personal info as a category. Deliberately kept to just
// the default set -- no extra "spare" names -- to keep the surface area small.
export const ALLOWED_CATEGORY_NAMES = [
  '収入', '家賃', '水道代', '電気代', 'ガス代', '固定光代',
  '携帯代1', '携帯代2', 'クレジットカード1', 'クレジットカード2',
  '後払い', '共済', 'その他',
]

// Keep in sync with backend/db/budget.py ALLOWED_AMOUNTS.
// Deliberately a short, obviously-fake set shared by every field (not a
// realistic per-category range) — too coarse to approximate any real figure.
export const ALLOWED_AMOUNTS = [0, 1000, 5000, 10000, 50000, 100000]

// Keep in sync with backend/db/budget.py ALLOWED_DATES.
// The demo dataset is capped to exactly these 6 months -- no new month can
// ever be added, so the dataset can't grow beyond what was seeded.
export const ALLOWED_DATES = [
  '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01',
]

export const monthLabel = (date: string) => {
  const [y, m] = date.split('-')
  return `${y}年${Number(m)}月`
}
