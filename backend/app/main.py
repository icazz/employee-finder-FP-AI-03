import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Preload the sentence-transformers model at startup so the first
    /analyze request does not trigger a slow lazy download/load.
    """
    logger.info("Preloading sentence-transformers model...")
    try:
        from app.ai.embedder import get_embedding_mode, _get_st_model  # noqa: PLC0415
        _get_st_model()  # warms the lru_cache — downloads model if not cached
        logger.info("Embedding mode ready: %s", get_embedding_mode())
    except Exception as exc:  # noqa: BLE001
        logger.warning("Model preload failed (will use TF-IDF fallback): %s", exc)
    yield
    # (shutdown logic here if needed)


app = FastAPI(
    title="Employee Finder API",
    description="Backend API service for parsing CVs and Job Descriptions, and ranking candidate similarity using AI.",
    version="1.0.0",
    lifespan=lifespan,
)

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Nginx handles proxying; but allow all for container-to-container ease
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "Welcome to Employee Finder API",
        "docs_url": "/docs",
        "status": "active"
    }
