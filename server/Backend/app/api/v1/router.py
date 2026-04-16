from fastapi import APIRouter

from app.api.v1.access import router as access_router
from app.api.v1.agent import router as agent_router
from app.api.v1.auth import router as auth_router
from app.api.v1.commands import router as commands_router
from app.api.v1.community import router as community_router
from app.api.v1.external import router as external_router
from app.api.v1.groups import router as groups_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.invites import router as invites_router
from app.api.v1.machines import router as machines_router
from app.api.v1.metrics import router as metrics_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.public import router as public_router
from app.api.v1.publications import router as publications_router
from app.api.v1.profile import router as profile_router
from app.api.v1.realtime import router as realtime_router
from app.api.v1.reports import router as reports_router
from app.api.v1.results import router as results_router
from app.api.v1.tasks import router as tasks_router

v1_router = APIRouter()
v1_router.include_router(auth_router)
v1_router.include_router(public_router)
v1_router.include_router(community_router)
v1_router.include_router(publications_router)
v1_router.include_router(profile_router)
v1_router.include_router(notifications_router)
v1_router.include_router(groups_router)
v1_router.include_router(machines_router)
v1_router.include_router(access_router)
v1_router.include_router(invites_router)
v1_router.include_router(agent_router)
v1_router.include_router(commands_router)
v1_router.include_router(tasks_router)
v1_router.include_router(results_router)
v1_router.include_router(metrics_router)
v1_router.include_router(realtime_router)
v1_router.include_router(reports_router)
v1_router.include_router(external_router)
v1_router.include_router(integrations_router)
