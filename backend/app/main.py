import os

from fastapi import FastAPI

from app.core.database import Base, engine
from app.models.user import User
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.models.project import Project
from app.api.projects import router as projects_router
from fastapi.middleware.cors import CORSMiddleware
from app.models import user, project
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="DevFlow API",
    description="AI-powered software development platform",
    version="0.1.0"
)

cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://dev-flow-h95h.vercel.app",
    "https://dev-flow-nu-ruby.vercel.app",
]
cors_origins.extend(
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(projects_router)

@app.get("/")
def root():
    return {
        "message": "Welcome to DevFlow API",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }