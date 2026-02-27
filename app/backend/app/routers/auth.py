from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..auth import create_access_token, get_current_admin, verify_credentials

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest):
    if not verify_credentials(data.username, data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos.",
        )
    token = create_access_token(subject=data.username)
    return TokenResponse(access_token=token)


@router.get("/verify")
def verify_token(_admin: str = Depends(get_current_admin)):
    return {"valid": True}
