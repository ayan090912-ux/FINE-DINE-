import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.enums import EmployeeOnlineStatus, EmploymentStatus, UserRole
from app.schemas.employee import (
    EmployeeAuthSchema,
    EmployeeCreate,
    EmployeePasswordReset,
    EmployeeResponse,
    EmployeeStatusUpdate,
    EmployeeUpdate,
)
from app.services.employee_service import EmployeeService

router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "employees")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
):
    service = EmployeeService(db)
    emp = await service.create_employee(data)
    await db.commit()
    return emp


@router.get("", response_model=List[EmployeeResponse])
async def list_employees(
    restaurant_id: str = "dineflow",
    role: Optional[UserRole] = None,
    employment_status: Optional[EmploymentStatus] = None,
    db: AsyncSession = Depends(get_db),
):
    service = EmployeeService(db)
    return await service.list_employees(restaurant_id, role, employment_status)


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = EmployeeService(db)
    return await service.get_employee(employee_id)


@router.patch("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = EmployeeService(db)
    emp = await service.update_employee(employee_id, data)
    await db.commit()
    return emp


@router.post("/{employee_id}/reset-password", response_model=EmployeeResponse)
async def reset_employee_password(
    employee_id: str,
    data: EmployeePasswordReset,
    db: AsyncSession = Depends(get_db),
):
    service = EmployeeService(db)
    emp = await service.reset_password(employee_id, data.new_password)
    await db.commit()
    return emp


@router.post("/{employee_id}/status", response_model=EmployeeResponse)
async def set_online_status(
    employee_id: str,
    data: EmployeeStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = EmployeeService(db)
    emp = await service.set_online_status(employee_id, data.online_status)
    await db.commit()
    return emp


@router.post("/{employee_id}/photo")
async def upload_employee_photo(
    employee_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files (PNG, JPG, JPEG, WEBP) are supported.")

    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    unique_filename = f"{employee_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    photo_url = f"/uploads/employees/{unique_filename}"

    service = EmployeeService(db)
    emp = await service.update_employee(employee_id, EmployeeUpdate(photo_url=photo_url))
    await db.commit()

    return {"photo_url": photo_url, "employee": EmployeeResponse.model_validate(emp)}


@router.post("/auth", response_model=EmployeeResponse)
async def authenticate_employee(
    auth_data: EmployeeAuthSchema,
    db: AsyncSession = Depends(get_db),
):
    service = EmployeeService(db)
    emp = await service.authenticate_employee(auth_data)
    await db.commit()
    return emp


@router.post("/{employee_id}/logout", response_model=EmployeeResponse)
async def logout_employee(
    employee_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = EmployeeService(db)
    emp = await service.logout_employee(employee_id)
    await db.commit()
    return emp


@router.delete("/{employee_id}")
async def delete_employee(
    employee_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = EmployeeService(db)
    await service.delete_employee(employee_id)
    await db.commit()
    return {"message": "Employee deleted successfully.", "employee_id": employee_id}
