from celery import shared_task

@shared_task
def process_email_queue_task(queue_id):
    from .services import EmailService
    EmailService.process_email_queue(queue_id)
