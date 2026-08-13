"""Tests for export generation (PDF and DOCX)."""
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.scripts.seed_ref_session import seed


@pytest_asyncio.fixture(autouse=True)
async def seed_db():
    from app.db.client import db_client
    db_client._client = None
    await seed("sess_test_export")


@pytest.mark.asyncio
async def test_pdf_and_docx_export():
    sid = "sess_test_export"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Generate DOCX export
        res_docx = await client.post(f"/api/sessions/{sid}/export", json={"format": "docx"})
        assert res_docx.status_code == 200
        eid_docx = res_docx.json()["export_id"]
        assert res_docx.json()["status"] == "ready"

        # Download DOCX export file
        res_file_docx = await client.get(f"/api/sessions/{sid}/exports/{eid_docx}")
        assert res_file_docx.status_code == 200
        assert len(res_file_docx.content) > 0

        # 2. Generate PDF export
        res_pdf = await client.post(f"/api/sessions/{sid}/export", json={"format": "pdf"})
        assert res_pdf.status_code == 200
        eid_pdf = res_pdf.json()["export_id"]
        assert res_pdf.json()["status"] == "ready"

        # Download PDF export file
        res_file_pdf = await client.get(f"/api/sessions/{sid}/exports/{eid_pdf}")
        assert res_file_pdf.status_code == 200
        assert len(res_file_pdf.content) > 0
        assert res_file_pdf.content.startswith(b"%PDF")
