from app.db.base import Base
from app.domains.access import models as access_models  # noqa: F401
from app.domains.commands import models as command_models  # noqa: F401
from app.domains.auth import models as auth_models  # noqa: F401
from app.domains.integrations.external_api import models as external_api_models  # noqa: F401
from app.domains.integrations.telegram import models as telegram_models  # noqa: F401
from app.domains.groups import models as group_models  # noqa: F401
from app.domains.notifications import models as notification_models  # noqa: F401
from app.domains.profile import models as profile_models  # noqa: F401
from app.domains.results import models as result_models  # noqa: F401
from app.domains.tasks import models as task_models  # noqa: F401
from app.domains.machines import models as machine_models  # noqa: F401
from app.domains.users import models as user_models  # noqa: F401
