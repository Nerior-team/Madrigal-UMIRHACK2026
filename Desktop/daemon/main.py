from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from predict_mv_daemon.daemon_main import main


if __name__ == "__main__":
    raise SystemExit(main())
