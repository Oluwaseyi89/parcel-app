###############################################################################
# Root variables for environment orchestration
# Design goal: independent deployment through feature flags
###############################################################################

variable "project" {
  description = "Project name prefix for resource naming"
  type        = string
  default     = "parcel-app"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "availability_zones" {
  description = "AZs used for subnet layout"
  type        = list(string)
  default     = ["eu-west-1a", "eu-west-1b"]
}

# ── Network ────────────────────────────────────────────────────────────────────
variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "single_nat_gateway" {
  description = "Use one NAT gateway for cost-saving in dev"
  type        = bool
  default     = true
}

# ── Feature Flags (Independent Deployment Switches) ───────────────────────────
variable "enable_frontend_web" {
  description = "Deploy Next.js static export bucket + CloudFront"
  type        = bool
  default     = true
}

variable "enable_frontend_admin" {
  description = "Deploy admin static bucket + CloudFront"
  type        = bool
  default     = true
}

variable "enable_backend_api" {
  description = "Deploy Django API ECS service"
  type        = bool
  default     = true
}

variable "enable_payment_service" {
  description = "Deploy Spring payment ECS service"
  type        = bool
  default     = true
}

variable "enable_celery_worker" {
  description = "Deploy Celery worker ECS service"
  type        = bool
  default     = true
}

variable "enable_celery_beat" {
  description = "Deploy Celery beat ECS service"
  type        = bool
  default     = true
}

variable "enable_aurora" {
  description = "Deploy Aurora PostgreSQL cluster"
  type        = bool
  default     = true
}

variable "enable_redis" {
  description = "Deploy ElastiCache Redis"
  type        = bool
  default     = true
}

variable "enable_sqs" {
  description = "Deploy SQS Celery queue"
  type        = bool
  default     = true
}

variable "enable_monitoring" {
  description = "Deploy CloudWatch alarms/dashboard/X-Ray"
  type        = bool
  default     = true
}

# ── Ingress / TLS ─────────────────────────────────────────────────────────────
variable "acm_certificate_arn" {
  description = "ACM cert ARN for ALB HTTPS. Empty means HTTP-only ALB."
  type        = string
  default     = ""
}

variable "cloudfront_acm_certificate_arn" {
  description = "ACM cert ARN in us-east-1 for CloudFront aliases"
  type        = string
  default     = ""
}

variable "waf_web_acl_arn" {
  description = "Optional WAF Web ACL ARN for CloudFront"
  type        = string
  default     = ""
}

variable "domain_web_aliases" {
  description = "Custom domains for web distribution"
  type        = list(string)
  default     = []
}

variable "domain_admin_aliases" {
  description = "Custom domains for admin distribution"
  type        = list(string)
  default     = []
}

# ── Container Images ──────────────────────────────────────────────────────────
variable "django_image_tag" {
  description = "Tag to deploy from ECR for django/celery image"
  type        = string
  default     = "latest"
}

variable "payment_image_tag" {
  description = "Tag to deploy from ECR for payment service"
  type        = string
  default     = "latest"
}

# ── Service Sizing ────────────────────────────────────────────────────────────
variable "django_cpu" {
  type    = number
  default = 512
}

variable "django_memory" {
  type    = number
  default = 1024
}

variable "payment_cpu" {
  type    = number
  default = 512
}

variable "payment_memory" {
  type    = number
  default = 1024
}

variable "worker_cpu" {
  type    = number
  default = 512
}

variable "worker_memory" {
  type    = number
  default = 1024
}

# ── Desired Counts ────────────────────────────────────────────────────────────
variable "django_desired_count" {
  type    = number
  default = 1
}

variable "payment_desired_count" {
  type    = number
  default = 1
}

variable "worker_desired_count" {
  type    = number
  default = 1
}

variable "beat_desired_count" {
  type    = number
  default = 1
}

# ── Data Layer Settings ───────────────────────────────────────────────────────
variable "aurora_database_name" {
  type    = string
  default = "parcel_db"
}

variable "aurora_master_username" {
  type    = string
  default = "parcel_admin"
}

variable "aurora_min_capacity" {
  type    = number
  default = 0.5
}

variable "aurora_max_capacity" {
  type    = number
  default = 2
}

variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
}

variable "redis_num_nodes" {
  type    = number
  default = 1
}

# ── Misc ──────────────────────────────────────────────────────────────────────
variable "alarm_email" {
  description = "Email for alarm notifications"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "Extra tags to merge into all resources"
  type        = map(string)
  default = {
    Owner = "portfolio"
    Stack = "parcel-app"
  }
}
