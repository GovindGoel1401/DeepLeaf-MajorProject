from fastapi import FastAPI

from app.routes.upload import router as upload_router
from app.routes.weather import router as weather_router
from app.routes.advisory import router as advisory_router

app = FastAPI(title="RiceCare AI Backend", version="0.1.0")

app.include_router(upload_router, prefix="/upload", tags=["upload"])
app.include_router(weather_router, prefix="/weather", tags=["weather"])
app.include_router(advisory_router, prefix="/advisory", tags=["advisory"])


@app.get("/")
def root():
    return {"message": "RiceCare AI backend is running"}
