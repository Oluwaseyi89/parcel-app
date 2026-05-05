################################################################################
# Parcel App — Generic ECS Fargate Service Module
#
# Reused for: django-api, celery-worker, celery-beat, payment-service
# Features:
#   - IAM execution + task roles
#   - CloudWatch log group
#   - Optional ALB target group + listener rule
#   - Optional FARGATE_SPOT capacity
#   - Optional CPU/memory autoscaling
################################################################################

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  full_name                = "${var.project}-${var.environment}-${var.name}"
  create_alb_listener_rule = var.container_port != null && (length(var.alb_path_patterns) > 0 || length(var.alb_host_headers) > 0)
  target_group_name_prefix = substr(replace("${var.environment}${var.name}", "-", ""), 0, 6)
}

# ── CloudWatch Log Group ───────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "this" {
  name              = "/ecs/${local.full_name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

# ── IAM — Task Execution Role (ECS agent rights: pull image, read secrets) ─────
resource "aws_iam_role" "execution" {
  name = "${local.full_name}-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Allow task execution role to read Secrets Manager secrets
resource "aws_iam_role_policy" "execution_secrets" {
  name = "read-secrets"
  role = aws_iam_role.execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue", "ssm:GetParameters"]
      Resource = ["arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${var.project}/${var.environment}/*"]
    }]
  })
}

# ── IAM — Task Role (application rights: S3, SQS, X-Ray) ─────────────────────
resource "aws_iam_role" "task" {
  name = "${local.full_name}-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })

  tags = var.tags
}

# X-Ray daemon permission
resource "aws_iam_role_policy_attachment" "task_xray" {
  role       = aws_iam_role.task.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# Attach any additional task role policies passed from the caller
resource "aws_iam_role_policy_attachment" "task_extra" {
  count      = length(var.task_role_policy_arns)
  role       = aws_iam_role.task.name
  policy_arn = var.task_role_policy_arns[count.index]
}

# ── ECS Task Definition ────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "this" {
  family                   = local.full_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = var.name
      image     = var.image_uri
      essential = true

      portMappings = var.container_port != null ? [
        { containerPort = var.container_port, protocol = "tcp" }
      ] : []

      command = length(var.command) > 0 ? var.command : null

      environment = var.environment_variables

      secrets = var.secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.this.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = var.name
        }
      }

      healthCheck = var.container_port != null ? {
        command     = ["CMD-SHELL", "curl -sf http://localhost:${var.container_port}${var.health_check_path} || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      } : null

      readonlyRootFilesystem = false
      stopTimeout            = 30
    }
  ])

  tags = var.tags
}

# ── ALB Target Group (created only when container_port is set) ─────────────────
resource "aws_lb_target_group" "this" {
  count = var.container_port != null ? 1 : 0

  name_prefix = local.target_group_name_prefix
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = var.health_check_path
    matcher             = var.health_check_matcher
  }

  deregistration_delay = 30

  tags = merge(var.tags, { Name = "${local.full_name}-tg" })

  lifecycle {
    create_before_destroy = true
  }
}

# ── ALB Listener Rule (only when both port and listener ARN are provided) ───────
resource "aws_lb_listener_rule" "this" {
  count = local.create_alb_listener_rule ? 1 : 0

  listener_arn = var.alb_listener_arn
  priority     = var.alb_listener_rule_priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this[0].arn
  }

  dynamic "condition" {
    for_each = length(var.alb_path_patterns) > 0 ? [1] : []
    content {
      path_pattern {
        values = var.alb_path_patterns
      }
    }
  }

  dynamic "condition" {
    for_each = length(var.alb_host_headers) > 0 ? [1] : []
    content {
      host_header {
        values = var.alb_host_headers
      }
    }
  }
}

# ── ECS Service ────────────────────────────────────────────────────────────────
resource "aws_ecs_service" "this" {
  name            = local.full_name
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.this.arn
  desired_count   = var.desired_count

  capacity_provider_strategy {
    capacity_provider = var.use_spot ? "FARGATE_SPOT" : "FARGATE"
    weight            = 100
    base              = var.use_spot ? 0 : 1
  }

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = var.assign_public_ip
  }

  dynamic "load_balancer" {
    for_each = local.create_alb_listener_rule ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.this[0].arn
      container_name   = var.name
      container_port   = var.container_port
    }
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  enable_execute_command = var.enable_execute_command

  depends_on = [
    aws_iam_role_policy_attachment.execution_managed,
    aws_lb_listener_rule.this,
  ]

  lifecycle {
    # Allow external changes to desired_count (autoscaling) without drift
    ignore_changes = [desired_count, task_definition]
  }

  tags = var.tags
}

# ── Application Auto Scaling ───────────────────────────────────────────────────
resource "aws_appautoscaling_target" "this" {
  count = var.enable_autoscaling ? 1 : 0

  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${var.cluster_name}/${aws_ecs_service.this.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  count = var.enable_autoscaling ? 1 : 0

  name               = "${local.full_name}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.this[0].resource_id
  scalable_dimension = aws_appautoscaling_target.this[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.this[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = var.autoscaling_cpu_target
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

resource "aws_appautoscaling_policy" "memory" {
  count = var.enable_autoscaling ? 1 : 0

  name               = "${local.full_name}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.this[0].resource_id
  scalable_dimension = aws_appautoscaling_target.this[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.this[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = var.autoscaling_memory_target
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
  }
}
