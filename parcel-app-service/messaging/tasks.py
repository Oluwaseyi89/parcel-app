from celery import shared_task
from .models import EmailQueue

@shared_task
def process_email_queue_task(queue_id):
    from .services import EmailService
    queue = EmailQueue.objects.get(id=queue_id)
    EmailService.process_queue(queue)