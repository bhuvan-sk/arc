"""API smoke test using httpx AsyncClient against seeded Mongo session."""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.scripts.seed_ref_session import seed
from app.db.repository import repo


@pytest_asyncio.fixture(autouse=True)
async def seed_db():
    from app.db.client import db_client
    db_client._client = None
    await seed("sess_test_smoke")


@pytest.mark.asyncio
async def test_full_api_flow():
    sid = "sess_test_smoke"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Fetch session
        res = await client.get(f"/api/sessions/{sid}")
        assert res.status_code == 200
        data = res.json()
        assert data["unlocked_index"] == 0
        assert len(data["layers"]) == 3

        # 2. Next layer twice
        res = await client.post(f"/api/sessions/{sid}/layers/next")
        assert res.status_code == 200
        assert res.json()["unlocked_index"] == 1

        res = await client.post(f"/api/sessions/{sid}/layers/next")
        assert res.status_code == 200
        assert res.json()["unlocked_index"] == 2

        # 3. Third call is idempotent at ceiling
        res = await client.post(f"/api/sessions/{sid}/layers/next")
        assert res.status_code == 200
        assert res.json()["unlocked_index"] == 2

        # 4. Scope guard check: question about infra while unlocked_index=0
        await repo.set_unlocked(sid, 0)

        res = await client.post(
            f"/api/sessions/{sid}/chat",
            json={"question": "How does kubernetes autoscale pods?", "asked_layer_index": 0}
        )
        assert res.status_code == 200
        msg = res.json()["message"]
        assert msg["blocked"] is True
        assert msg["block"]["locked_layer_name"] == "Infra"
