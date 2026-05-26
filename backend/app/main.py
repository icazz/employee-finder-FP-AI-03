from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI(
    title="Employee Finder API",
    description="Backend API service for parsing CVs and Job Descriptions, and ranking candidate similarity using AI.",
    version="1.0.0"
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
