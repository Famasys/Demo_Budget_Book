import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import budget, categories
from backend.db import budget as budget_db
from backend.db import categories as categories_db
from backend.scripts.reset_demo import reset as reset_demo_data

# Public demo safeguard: whatever gets typed into the shared DB (e.g. someone
# testing with their own real numbers) is only ever visible for at most this
# long before it's wiped back to the fake seed data. Long enough that a
# normal testing session isn't interrupted, short enough to bound exposure.
DEMO_RESET_INTERVAL_SECONDS = int(os.environ.get('DEMO_RESET_INTERVAL_SECONDS', 6 * 60 * 60))


async def _periodic_demo_reset():
    while True:
        await asyncio.sleep(DEMO_RESET_INTERVAL_SECONDS)
        await asyncio.to_thread(reset_demo_data, months=6, seed_value=42)


@asynccontextmanager
async def lifespan(app: FastAPI):
    budget_db.ensure_schema()
    categories_db.ensure_schema()
    task = asyncio.create_task(_periodic_demo_reset())
    yield
    task.cancel()


app = FastAPI(title='Budget API', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://192.168.1.2:3000'],
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(budget.router)
app.include_router(categories.router)
