import os
import uuid
from fastapi import UploadFile


async def save_or_upload_media(file: UploadFile, subfolder: str) -> str:
    """
    Save image file to Cloudinary if env credentials exist, or fallback to local disk storage.
    Returns secure URL (Cloudinary) or relative path (/uploads/<subfolder>/<uuid>.<ext>).
    """
    cloudinary_url = os.getenv("CLOUDINARY_URL")
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if cloudinary_url or (cloud_name and api_key and api_secret):
        try:
            import cloudinary
            import cloudinary.uploader

            if cloudinary_url:
                cloudinary.config(cloudinary_url=cloudinary_url)
            else:
                cloudinary.config(
                    cloud_name=cloud_name,
                    api_key=api_key,
                    api_secret=api_secret,
                    secure=True
                )

            contents = await file.read()
            res = cloudinary.uploader.upload(
                contents,
                folder=f"dineflow/{subfolder}",
                resource_type="auto"
            )
            if res and res.get("secure_url"):
                return res["secure_url"]
        except Exception as e:
            print(f"[Cloudinary Media Storage Notice] {e}")

    # Fallback to local server filesystem storage
    upload_dir = os.path.join(os.getcwd(), "uploads", subfolder)
    os.makedirs(upload_dir, exist_ok=True)
    filename_ext = os.path.splitext(file.filename or "file.png")[1] or ".png"
    unique_filename = f"{uuid.uuid4().hex}{filename_ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    file.file.seek(0)
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    return f"/uploads/{subfolder}/{unique_filename}"
