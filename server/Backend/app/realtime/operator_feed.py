import queue
import threading
from dataclasses import dataclass
from uuid import uuid4

from app.realtime.events import OperatorRealtimeEvent


@dataclass(slots=True)
class OperatorFeedSubscription:
    subscription_id: str
    event_queue: queue.Queue[OperatorRealtimeEvent]


class OperatorFeedRegistry:
    def __init__(self) -> None:
        self._subscriptions: dict[str, queue.Queue[OperatorRealtimeEvent]] = {}
        self._lock = threading.Lock()

    def subscribe(self) -> OperatorFeedSubscription:
        subscription_id = str(uuid4())
        event_queue: queue.Queue[OperatorRealtimeEvent] = queue.Queue(maxsize=256)
        with self._lock:
            self._subscriptions[subscription_id] = event_queue
        return OperatorFeedSubscription(subscription_id=subscription_id, event_queue=event_queue)

    def unsubscribe(self, subscription_id: str) -> None:
        with self._lock:
            self._subscriptions.pop(subscription_id, None)

    def publish(self, event: OperatorRealtimeEvent) -> None:
        with self._lock:
            queues = list(self._subscriptions.values())
        for event_queue in queues:
            if event_queue.full():
                try:
                    event_queue.get_nowait()
                except queue.Empty:
                    pass
            try:
                event_queue.put_nowait(event)
            except queue.Full:
                continue


operator_feed = OperatorFeedRegistry()
