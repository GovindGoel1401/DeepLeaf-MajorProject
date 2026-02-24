from fastapi import APIRouter, UploadFile, File

from app.services.classifier import classify_rice_leaf

router = APIRouter()


@router.post("/")
async def upload_image(file: UploadFile = File(...)):
    result = classify_rice_leaf(file.filename)
    return {"filename": file.filename, "classification": result}
