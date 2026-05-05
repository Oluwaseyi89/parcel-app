locals {
  tags = merge(var.common_tags, {
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "Terraform"
  })

  # API routing patterns from CloudFront to ALB
  api_path_patterns = ["/api/*", "/auth/*", "/admin/*"]
}

# ── Base Infrastructure (always on) ────────────────────────────────────────────
module "networking" {
  source = "../../modules/networking"

  project              = var.project
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  single_nat_gateway   = var.single_nat_gateway
  enable_flow_logs     = true
  tags                 = local.tags
}

module "security_groups" {
  source = "../../modules/security_groups"

  project     = var.project
  environment = var.environment
  vpc_id      = module.networking.vpc_id
  tags        = local.tags
}

module "ecr" {
  source = "../../modules/ecr"

  project     = var.project
  environment = var.environment
  tags        = local.tags
}

module "ecs_cluster" {
  source = "../../modules/ecs_cluster"

  project                   = var.project
  environment               = var.environment
  enable_container_insights = true
  tags                      = local.tags
}

module "alb" {
  source = "../../modules/alb"

  project                    = var.project
  environment                = var.environment
  vpc_id                     = module.networking.vpc_id
  alb_sg_id                  = module.security_groups.alb_sg_id
  public_subnet_ids          = module.networking.public_subnet_ids
  acm_certificate_arn        = var.acm_certificate_arn
  enable_deletion_protection = false
  access_logs_bucket         = ""
  tags                       = local.tags
}

module "secrets" {
  source = "../../modules/secrets"

  project                     = var.project
  environment                 = var.environment
  recovery_window_in_days     = 0
  paystack_secret_placeholder = "REPLACE_WITH_REAL_PAYSTACK_SECRET_KEY"
  smtp_password_placeholder   = "REPLACE_WITH_REAL_SMTP_PASSWORD"
  tags                        = local.tags
}

# ── Data Tier (toggle independently) ───────────────────────────────────────────
module "aurora" {
  count  = var.enable_aurora ? 1 : 0
  source = "../../modules/aurora"

  project                 = var.project
  environment             = var.environment
  private_subnet_ids      = module.networking.private_subnet_ids
  aurora_sg_id            = module.security_groups.aurora_sg_id
  database_name           = var.aurora_database_name
  master_username         = var.aurora_master_username
  master_password         = module.secrets.aurora_master_password_value
  serverless_min_capacity = var.aurora_min_capacity
  serverless_max_capacity = var.aurora_max_capacity
  instance_count          = 1
  deletion_protection     = false
  skip_final_snapshot     = true
  backup_retention_days   = 3
  tags                    = local.tags
}

module "elasticache" {
  count  = var.enable_redis ? 1 : 0
  source = "../../modules/elasticache"

  project                 = var.project
  environment             = var.environment
  private_subnet_ids      = module.networking.private_subnet_ids
  redis_sg_id             = module.security_groups.redis_sg_id
  node_type               = var.redis_node_type
  num_cache_nodes         = var.redis_num_nodes
  auth_token              = module.secrets.redis_auth_token_value
  snapshot_retention_days = 1
  apply_immediately       = true
  tags                    = local.tags
}

# Temporary broad IAM policy for app services; tighten later by ARN/resource.
resource "aws_iam_policy" "app_runtime" {
  name        = "${var.project}-${var.environment}-app-runtime"
  description = "Runtime access for app tasks: S3, SQS, secrets read"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = "*"
      }
    ]
  })

  tags = local.tags
}

# ── App Services (independent toggles) ─────────────────────────────────────────
module "django_api" {
  count  = var.enable_backend_api ? 1 : 0
  source = "../../modules/ecs_service"

  project            = var.project
  environment        = var.environment
  name               = "django-api"
  cluster_id         = module.ecs_cluster.cluster_id
  cluster_name       = module.ecs_cluster.cluster_name
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  security_group_ids = [module.security_groups.ecs_tasks_sg_id]
  image_uri          = "${module.ecr.django_repo_url}:${var.django_image_tag}"

  cpu            = var.django_cpu
  memory         = var.django_memory
  container_port = 8000
  desired_count  = var.django_desired_count

  health_check_path    = "/"
  health_check_matcher = "200-499"

  alb_listener_arn           = module.alb.https_listener_arn
  alb_listener_rule_priority = 100
  alb_path_patterns          = ["/api/*", "/auth/*", "/admin/*"]

  environment_variables = [
    { name = "DJANGO_SETTINGS_MODULE", value = "parcel_app.settings" },
    { name = "DATABASE_HOST", value = var.enable_aurora ? module.aurora[0].cluster_endpoint : "" },
    { name = "DATABASE_PORT", value = "5432" },
    { name = "DATABASE_NAME", value = var.aurora_database_name },
    { name = "DATABASE_USER", value = var.aurora_master_username },
    { name = "REDIS_URL", value = var.enable_redis ? "redis://:${module.secrets.redis_auth_token_value}@${module.elasticache[0].primary_endpoint}:6379/0" : "" },
    { name = "CELERY_BROKER_URL", value = var.enable_redis ? "redis://:${module.secrets.redis_auth_token_value}@${module.elasticache[0].primary_endpoint}:6379/0" : "" },
    { name = "CELERY_RESULT_BACKEND", value = var.enable_redis ? "redis://:${module.secrets.redis_auth_token_value}@${module.elasticache[0].primary_endpoint}:6379/0" : "" },
    { name = "AWS_STORAGE_BUCKET_NAME", value = var.enable_frontend_web ? module.web_frontend_bucket[0].bucket_id : "" },
    { name = "USE_S3", value = "True" },
    { name = "DEBUG", value = "False" },
  ]

  secrets = [
    { name = "DATABASE_PASSWORD", valueFrom = module.secrets.django_db_password_arn },
    { name = "SECRET_KEY", valueFrom = module.secrets.django_secret_key_arn },
    { name = "EMAIL_HOST_PASSWORD", valueFrom = module.secrets.smtp_password_arn },
  ]

  task_role_policy_arns = [aws_iam_policy.app_runtime.arn]

  enable_execute_command    = true
  use_spot                  = false
  enable_autoscaling        = true
  autoscaling_min_capacity  = 1
  autoscaling_max_capacity  = 3
  autoscaling_cpu_target    = 70
  autoscaling_memory_target = 75

  tags = local.tags
}

module "payment_service" {
  count  = var.enable_payment_service ? 1 : 0
  source = "../../modules/ecs_service"

  project            = var.project
  environment        = var.environment
  name               = "payment-service"
  cluster_id         = module.ecs_cluster.cluster_id
  cluster_name       = module.ecs_cluster.cluster_name
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  security_group_ids = [module.security_groups.ecs_tasks_sg_id]
  image_uri          = "${module.ecr.payment_repo_url}:${var.payment_image_tag}"

  cpu            = var.payment_cpu
  memory         = var.payment_memory
  container_port = 8080
  desired_count  = var.payment_desired_count

  health_check_path    = "/home"
  health_check_matcher = "200-399"

  alb_listener_arn           = module.alb.https_listener_arn
  alb_listener_rule_priority = 110
  alb_path_patterns          = ["/payments/*", "/paystack/*"]

  environment_variables = [
    { name = "SPRING_PROFILES_ACTIVE", value = "prod" },
    { name = "DB_HOST", value = var.enable_aurora ? module.aurora[0].cluster_endpoint : "" },
    { name = "DB_PORT", value = "5432" },
    { name = "POSTGRES_DB", value = var.aurora_database_name },
    { name = "POSTGRES_USER", value = var.aurora_master_username },
  ]

  secrets = [
    { name = "POSTGRES_PASSWORD", valueFrom = module.secrets.payment_db_password_arn },
    { name = "PAYSTACK_SECRET_KEY", valueFrom = module.secrets.paystack_secret_arn },
  ]

  task_role_policy_arns = [aws_iam_policy.app_runtime.arn]

  enable_execute_command   = true
  use_spot                 = false
  enable_autoscaling       = true
  autoscaling_min_capacity = 1
  autoscaling_max_capacity = 2

  tags = local.tags
}

module "sqs" {
  count  = var.enable_sqs ? 1 : 0
  source = "../../modules/sqs"

  project     = var.project
  environment = var.environment

  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400
  max_receive_count          = 5

  allowed_role_arns = compact([
    try(module.django_api[0].task_role_arn, ""),
    try(module.celery_worker[0].task_role_arn, ""),
    try(module.celery_beat[0].task_role_arn, ""),
  ])

  tags = local.tags
}

module "celery_worker" {
  count  = var.enable_celery_worker ? 1 : 0
  source = "../../modules/ecs_service"

  project            = var.project
  environment        = var.environment
  name               = "celery-worker"
  cluster_id         = module.ecs_cluster.cluster_id
  cluster_name       = module.ecs_cluster.cluster_name
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  security_group_ids = [module.security_groups.ecs_tasks_sg_id]
  image_uri          = "${module.ecr.django_repo_url}:${var.django_image_tag}"

  cpu            = var.worker_cpu
  memory         = var.worker_memory
  container_port = null
  desired_count  = var.worker_desired_count

  command = ["celery", "-A", "parcel_app", "worker", "--loglevel=info"]

  environment_variables = [
    { name = "DJANGO_SETTINGS_MODULE", value = "parcel_app.settings" },
    { name = "DATABASE_HOST", value = var.enable_aurora ? module.aurora[0].cluster_endpoint : "" },
    { name = "DATABASE_PORT", value = "5432" },
    { name = "DATABASE_NAME", value = var.aurora_database_name },
    { name = "DATABASE_USER", value = var.aurora_master_username },
    { name = "REDIS_URL", value = var.enable_redis ? "redis://:${module.secrets.redis_auth_token_value}@${module.elasticache[0].primary_endpoint}:6379/0" : "" },
    { name = "CELERY_BROKER_URL", value = var.enable_redis ? "redis://:${module.secrets.redis_auth_token_value}@${module.elasticache[0].primary_endpoint}:6379/0" : "" },
    { name = "CELERY_RESULT_BACKEND", value = var.enable_redis ? "redis://:${module.secrets.redis_auth_token_value}@${module.elasticache[0].primary_endpoint}:6379/0" : "" },
    { name = "CELERY_QUEUE_URL", value = var.enable_sqs ? module.sqs[0].queue_url : "" },
  ]

  secrets = [
    { name = "DATABASE_PASSWORD", valueFrom = module.secrets.django_db_password_arn },
    { name = "SECRET_KEY", valueFrom = module.secrets.django_secret_key_arn },
  ]

  task_role_policy_arns  = [aws_iam_policy.app_runtime.arn]
  use_spot               = true
  enable_execute_command = true
  enable_autoscaling     = false

  tags = local.tags
}

module "celery_beat" {
  count  = var.enable_celery_beat ? 1 : 0
  source = "../../modules/ecs_service"

  project            = var.project
  environment        = var.environment
  name               = "celery-beat"
  cluster_id         = module.ecs_cluster.cluster_id
  cluster_name       = module.ecs_cluster.cluster_name
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  security_group_ids = [module.security_groups.ecs_tasks_sg_id]
  image_uri          = "${module.ecr.django_repo_url}:${var.django_image_tag}"

  cpu            = var.worker_cpu
  memory         = var.worker_memory
  container_port = null
  desired_count  = var.beat_desired_count

  command = ["celery", "-A", "parcel_app", "beat", "--loglevel=info"]

  environment_variables = [
    { name = "DJANGO_SETTINGS_MODULE", value = "parcel_app.settings" },
    { name = "DATABASE_HOST", value = var.enable_aurora ? module.aurora[0].cluster_endpoint : "" },
    { name = "DATABASE_PORT", value = "5432" },
    { name = "DATABASE_NAME", value = var.aurora_database_name },
    { name = "DATABASE_USER", value = var.aurora_master_username },
    { name = "REDIS_URL", value = var.enable_redis ? "redis://:${module.secrets.redis_auth_token_value}@${module.elasticache[0].primary_endpoint}:6379/0" : "" },
    { name = "CELERY_BROKER_URL", value = var.enable_redis ? "redis://:${module.secrets.redis_auth_token_value}@${module.elasticache[0].primary_endpoint}:6379/0" : "" },
    { name = "CELERY_RESULT_BACKEND", value = var.enable_redis ? "redis://:${module.secrets.redis_auth_token_value}@${module.elasticache[0].primary_endpoint}:6379/0" : "" },
    { name = "CELERY_QUEUE_URL", value = var.enable_sqs ? module.sqs[0].queue_url : "" },
  ]

  secrets = [
    { name = "DATABASE_PASSWORD", valueFrom = module.secrets.django_db_password_arn },
    { name = "SECRET_KEY", valueFrom = module.secrets.django_secret_key_arn },
  ]

  task_role_policy_arns  = [aws_iam_policy.app_runtime.arn]
  use_spot               = true
  enable_execute_command = true
  enable_autoscaling     = false

  tags = local.tags
}

# ── Frontends (S3 + CloudFront) ───────────────────────────────────────────────
module "web_frontend_bucket" {
  count  = var.enable_frontend_web ? 1 : 0
  source = "../../modules/s3_frontend"

  project     = var.project
  environment = var.environment
  app_name    = "web"
  tags        = local.tags
}

module "web_cloudfront" {
  count  = var.enable_frontend_web ? 1 : 0
  source = "../../modules/cloudfront"

  project                        = var.project
  environment                    = var.environment
  app_name                       = "web"
  s3_bucket_id                   = module.web_frontend_bucket[0].bucket_id
  s3_bucket_arn                  = module.web_frontend_bucket[0].bucket_arn
  s3_bucket_regional_domain_name = module.web_frontend_bucket[0].bucket_regional_domain_name
  alb_dns_name                   = module.alb.alb_dns_name
  api_path_patterns              = local.api_path_patterns
  domain_aliases                 = var.domain_web_aliases
  acm_certificate_arn            = var.cloudfront_acm_certificate_arn
  waf_web_acl_arn                = var.waf_web_acl_arn
  tags                           = local.tags
}

module "admin_frontend_bucket" {
  count  = var.enable_frontend_admin ? 1 : 0
  source = "../../modules/s3_frontend"

  project     = var.project
  environment = var.environment
  app_name    = "admin"
  tags        = local.tags
}

module "admin_cloudfront" {
  count  = var.enable_frontend_admin ? 1 : 0
  source = "../../modules/cloudfront"

  project                        = var.project
  environment                    = var.environment
  app_name                       = "admin"
  s3_bucket_id                   = module.admin_frontend_bucket[0].bucket_id
  s3_bucket_arn                  = module.admin_frontend_bucket[0].bucket_arn
  s3_bucket_regional_domain_name = module.admin_frontend_bucket[0].bucket_regional_domain_name
  alb_dns_name                   = module.alb.alb_dns_name
  api_path_patterns              = local.api_path_patterns
  domain_aliases                 = var.domain_admin_aliases
  acm_certificate_arn            = var.cloudfront_acm_certificate_arn
  waf_web_acl_arn                = var.waf_web_acl_arn
  tags                           = local.tags
}

# ── Monitoring (optional) ──────────────────────────────────────────────────────
module "monitoring" {
  count  = var.enable_monitoring ? 1 : 0
  source = "../../modules/monitoring"

  project          = var.project
  environment      = var.environment
  aws_region       = var.aws_region
  alarm_email      = var.alarm_email
  ecs_cluster_name = module.ecs_cluster.cluster_name
  ecs_service_names = toset(compact([
    try(module.django_api[0].service_name, ""),
    try(module.payment_service[0].service_name, ""),
    try(module.celery_worker[0].service_name, ""),
    try(module.celery_beat[0].service_name, ""),
  ]))
  alb_arn_suffix    = replace(module.alb.alb_arn, "arn:aws:elasticloadbalancing:${var.aws_region}:${data.aws_caller_identity.current.account_id}:loadbalancer/", "")
  aurora_cluster_id = var.enable_aurora ? module.aurora[0].cluster_identifier : ""
  tags              = local.tags
}

data "aws_caller_identity" "current" {}
