import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Preload embedding models or check api configuration at startup.
    """
    try:
        from app.ai.embedder import get_embedding_mode, _get_st_model  # noqa: PLC0415
        mode = get_embedding_mode()
        logger.info("Starting up with embedding mode: %s", mode)
        if mode == "sentence-transformers":
            logger.info("Preloading local sentence-transformers model...")
            _get_st_model()  # warms the lru_cache
            logger.info("Local sentence-transformers model loaded successfully.")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Lifespan startup initialization failed: %s", exc)
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
