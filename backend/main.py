import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from backend.app.database import init_db
from backend.app.routers.courses_router import router as courses_router
from backend.app.routers.sessions_router import router as sessions_router
from backend.app.routers.reflections_router import router as reflections_router
from backend.app.routers.logs_router import router as logs_router
from backend.app.routers.news_router import router as news_router
from backend.app.routers.dashboard_router import router as dashboard_router

app = FastAPI(
    title="Corporate Startup Tutor API",
    description="Multi-Subject AI Continuous Assessment Tutor Platform",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

# Include REST routers
app.include_router(courses_router)
app.include_router(dashboard_router)
app.include_router(sessions_router)
app.include_router(reflections_router)
app.include_router(logs_router)
app.include_router(news_router)

@app.get("/api/health")
def health_check():
    return {
        "platform": "Corporate Startup Tutor Multi-Subject Platform",
        "supported_courses": [
            {"id": 1, "code": "ENT 3805", "name": "Designing Corporate Startup Synergies"},
            {"id": 2, "code": "ENG 4101", "name": "Engineering Philosophy of Technology"}
        ],
        "status": "online"
    }

# Static Frontend Mounting
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
FRONTEND_SRC = os.path.join(BASE_DIR, "frontend")

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")
    @app.get("/{full_path:path}")
    def serve_react(full_path: str):
        target = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(target) and os.path.isfile(target):
            return FileResponse(target)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
elif os.path.exists(FRONTEND_SRC):
    app.mount("/static", StaticFiles(directory=FRONTEND_SRC), name="static")
    @app.get("/")
    def read_root():
        index_file = os.path.join(FRONTEND_SRC, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse({"status": "Backend running"})
