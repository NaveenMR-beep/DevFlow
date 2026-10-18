from fastapi import FastAPI

from app.core.database import Base, engine
from app.models.user import User
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.models.project import Project
from app.api.projects import router as projects_router
from fastapi.middleware.cors import CORSMiddleware
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="DevFlow API",
    description="AI-powered software development platform",
    version="0.1.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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