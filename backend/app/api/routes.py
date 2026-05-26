import io
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.config import settings
from app.services.file_parser import build_csv

router = APIRouter(prefix="/api/v1")
_csv_store: io.StringIO | None = None

class ParseResponse(BaseModel):
    filenames: list[str]
    total_files: int
    message: str

def _validate_upload(upload: UploadFile) -> None:
    filename = upload.filename or "unnamed"
    ext = filename.rsplit(".", 1)[-1].lower()

    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=415,
            detail=(
                f"'{filename}': unsupported type '.{ext}'. "
                f"Allowed: {settings.allowed_extensions}"
            ),
        )

async def _read_upload(upload: UploadFile) -> tuple[str, bytes]:
    _validate_upload(upload)

    filename = upload.filename or "unnamed"
    file_bytes = await upload.read()

    if len(file_bytes) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"'{filename}' is too large. Max size: {settings.max_file_size_mb} MB",
        )

    return filename, file_bytes

@router.post("/documents/parse", response_model=ParseResponse)
async def parse_uploaded_files(
    uploads: list[UploadFile] = File(...),
) -> ParseResponse:
    global _csv_store

    if not uploads:
        raise HTTPException(status_code=400, detail="No files were uploaded.")

    files: list[tuple[str, bytes]] = []
    errors: list[str] = []

    for upload in uploads:
        try:
            files.append(await _read_upload(upload))
        except HTTPException as exc:
            errors.append(exc.detail)

    if errors:
        raise HTTPException(status_code=422, detail=errors)

    try:
        _csv_store = build_csv(files)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    filenames = [f[0] for f in files]

    return ParseResponse(
        filenames=filenames,
        total_files=len(files),
        message=f"Parsed {len(files)} file(s) and stored in memory.",
    )

@router.get("/documents/csv")
async def get_csv() -> StreamingResponse:
    if _csv_store is None:
        raise HTTPException(status_code=404, detail="No CSV in memory. Upload files first.")

    _csv_store.seek(0)

    return StreamingResponse(
        iter([_csv_store.read()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=documents.csv"},
    )


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}