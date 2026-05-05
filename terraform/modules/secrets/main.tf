################################################################################
# Parcel App — Secrets Manager Module
# Generates random passwords + creates Secrets Manager entries.
# No external reference to Aurora endpoint — host is passed as plain env var.
################################################################################

terraform {
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

locals {
  prefix = "${var.project}/${var.environment}"
  rwd    = var.recovery_window_in_days
}

# ── Aurora master password ─────────────────────────────────────────────────────
resource "random_password" "aurora_master" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "aurora_master" {
  name                    = "${local.prefix}/aurora-master-password"
  description             = "Aurora PostgreSQL master password"
  recovery_window_in_days = local.rwd
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "aurora_master" {
  secret_id     = aws_secretsmanager_secret.aurora_master.id
  secret_string = random_password.aurora_master.result
}

# ── Django application DB password ────────────────────────────────────────────
resource "random_password" "django_db" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "django_db_password" {
  name                    = "${local.prefix}/django-db-password"
  description             = "Django PostgreSQL user password"
  recovery_window_in_days = local.rwd
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "django_db_password" {
  secret_id     = aws_secretsmanager_secret.django_db_password.id
  secret_string = random_password.django_db.result
}

# ── Payment service DB password ───────────────────────────────────────────────
resource "random_password" "payment_db" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "payment_db_password" {
  name                    = "${local.prefix}/payment-db-password"
  description             = "Payment service PostgreSQL user password"
  recovery_window_in_days = local.rwd
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "payment_db_password" {
  secret_id     = aws_secretsmanager_secret.payment_db_password.id
  secret_string = random_password.payment_db.result
}

# ── Django SECRET_KEY ──────────────────────────────────────────────────────────
resource "random_password" "django_secret_key" {
  length  = 50
  special = true
}

resource "aws_secretsmanager_secret" "django_secret_key" {
  name                    = "${local.prefix}/django-secret-key"
  description             = "Django SECRET_KEY setting"
  recovery_window_in_days = local.rwd
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "django_secret_key" {
  secret_id     = aws_secretsmanager_secret.django_secret_key.id
  secret_string = random_password.django_secret_key.result
}

# ── Redis AUTH token ──────────────────────────────────────────────────────────
resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "redis_auth" {
  name                    = "${local.prefix}/redis-auth-token"
  description             = "ElastiCache Redis AUTH token"
  recovery_window_in_days = local.rwd
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id     = aws_secretsmanager_secret.redis_auth.id
  secret_string = random_password.redis_auth.result
}

# ── Paystack secret key (placeholder — update in AWS Console after deploy) ─────
resource "aws_secretsmanager_secret" "paystack_secret" {
  name                    = "${local.prefix}/paystack-secret-key"
  description             = "Paystack secret key — update manually via AWS Console"
  recovery_window_in_days = local.rwd
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "paystack_secret" {
  secret_id     = aws_secretsmanager_secret.paystack_secret.id
  secret_string = var.paystack_secret_placeholder
}

# ── SMTP password (placeholder — update in AWS Console after deploy) ───────────
resource "aws_secretsmanager_secret" "smtp_password" {
  name                    = "${local.prefix}/smtp-password"
  description             = "SMTP provider password — update manually"
  recovery_window_in_days = local.rwd
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "smtp_password" {
  secret_id     = aws_secretsmanager_secret.smtp_password.id
  secret_string = var.smtp_password_placeholder
}
