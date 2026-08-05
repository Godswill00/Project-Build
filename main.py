"""Top-level ASGI import shim.

Railway/uvicorn sometimes runs with the project root on PATH and expects
`main:app` to be importable. This file re-exports the FastAPI `app`
from the `Backend` package so both `Backend.main:app` and `main:app`
work the same.
"""

from Backend.main import app  # re-export app for uvicorn

print("[root] main module imported — re-exported Backend.main:app")
