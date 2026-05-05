output "django_repo_url" {
  description = "Full ECR repository URL for the Django/Celery image"
  value       = aws_ecr_repository.django.repository_url
}

output "django_repo_name" {
  description = "ECR repository name for Django"
  value       = aws_ecr_repository.django.name
}

output "payment_repo_url" {
  description = "Full ECR repository URL for the Spring Boot payment image"
  value       = aws_ecr_repository.payment.repository_url
}

output "payment_repo_name" {
  description = "ECR repository name for the payment service"
  value       = aws_ecr_repository.payment.name
}
