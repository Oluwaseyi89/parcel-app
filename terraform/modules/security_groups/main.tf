################################################################################
# Parcel App — Security Groups Module
# Creates SGs for: ALB, ECS tasks, Aurora, Redis
################################################################################

# ── ALB Security Group ─────────────────────────────────────────────────────────
resource "aws_security_group" "alb" {
  name        = "${var.project}-${var.environment}-sg-alb"
  description = "Allow HTTP/HTTPS inbound to the Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.project}-${var.environment}-sg-alb" })

  lifecycle {
    create_before_destroy = true
  }
}

# ── ECS Tasks Security Group ───────────────────────────────────────────────────
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project}-${var.environment}-sg-ecs-tasks"
  description = "Allow traffic from ALB to ECS Fargate tasks"
  vpc_id      = var.vpc_id

  # Django / Gunicorn
  ingress {
    description     = "From ALB to Django (port 8000)"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Spring Boot payment service
  ingress {
    description     = "From ALB to Spring Boot (port 8080)"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Next.js (if running as ECS service in future)
  ingress {
    description     = "From ALB to Next.js (port 3000)"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound traffic to ECR, Secrets Manager, S3, SQS, and external APIs"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.project}-${var.environment}-sg-ecs-tasks" })

  lifecycle {
    create_before_destroy = true
  }
}

# ── Aurora PostgreSQL Security Group ──────────────────────────────────────────
resource "aws_security_group" "aurora" {
  name        = "${var.project}-${var.environment}-sg-aurora"
  description = "Allow PostgreSQL access from ECS tasks only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.project}-${var.environment}-sg-aurora" })

  lifecycle {
    create_before_destroy = true
  }
}

# ── ElastiCache Redis Security Group ──────────────────────────────────────────
resource "aws_security_group" "redis" {
  name        = "${var.project}-${var.environment}-sg-redis"
  description = "Allow Redis access from ECS tasks only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis from ECS tasks (with TLS on 6380)"
    from_port       = 6379
    to_port         = 6380
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.project}-${var.environment}-sg-redis" })

  lifecycle {
    create_before_destroy = true
  }
}
