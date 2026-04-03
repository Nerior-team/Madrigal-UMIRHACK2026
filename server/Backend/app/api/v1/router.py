from fastapi import APIRouter

from app.api.v1.access import router as access_router
from app.api.v1.agent import router as agent_router
from app.api.v1.auth import router as auth_router
from app.api.v1.invites import router as invites_router
from app.api.v1.machines import router as machines_router

v1_router = APIRouter()
v1_router.include_router(auth_router)
v1_router.include_router(machines_router)
v1_router.include_router(access_router)
v1_router.include_router(invites_router)
v1_router.include_router(agent_router)
