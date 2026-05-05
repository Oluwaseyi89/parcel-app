output "aurora_master_password_arn" {
  description = "Secrets Manager ARN for the Aurora master password"
  value       = aws_secretsmanager_secret.aurora_master.arn
}

output "aurora_master_password_value" {
  description = "Raw Aurora master password (used to create the cluster)"
  value       = random_password.aurora_master.result
  sensitive   = true
}

output "django_db_password_arn" {
  description = "Secrets Manager ARN for the Django DB password"
  value       = aws_secretsmanager_secret.django_db_password.arn
}

output "payment_db_password_arn" {
  description = "Secrets Manager ARN for the payment service DB password"
  value       = aws_secretsmanager_secret.payment_db_password.arn
}

output "django_secret_key_arn" {
  description = "Secrets Manager ARN for the Django SECRET_KEY"
  value       = aws_secretsmanager_secret.django_secret_key.arn
}

output "redis_auth_token_arn" {
  description = "Secrets Manager ARN for the Redis AUTH token"
  value       = aws_secretsmanager_secret.redis_auth.arn
}

output "redis_auth_token_value" {
  description = "Raw Redis AUTH token (used to create the ElastiCache cluster)"
  value       = random_password.redis_auth.result
  sensitive   = true
}

output "paystack_secret_arn" {
  description = "Secrets Manager ARN for the Paystack secret key"
  value       = aws_secretsmanager_secret.paystack_secret.arn
}

output "smtp_password_arn" {
  description = "Secrets Manager ARN for the SMTP password"
  value       = aws_secretsmanager_secret.smtp_password.arn
}
