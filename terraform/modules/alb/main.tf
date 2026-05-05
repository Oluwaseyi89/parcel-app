################################################################################
# Parcel App — ALB Module
# Creates an Application Load Balancer with HTTP (and HTTPS if cert supplied).
# Target groups and listener rules are owned by the ecs_service module.
################################################################################

data "aws_region" "current" {}

resource "aws_lb" "main" {
  name               = "${var.project}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_sg_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.enable_deletion_protection

  access_logs {
    bucket  = var.access_logs_bucket
    prefix  = "${var.project}-${var.environment}-alb"
    enabled = var.access_logs_bucket != ""
  }

  tags = merge(var.tags, { Name = "${var.project}-${var.environment}-alb" })
}

# ── HTTP listener — redirect to HTTPS if cert present, else serve directly ─────
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = var.acm_certificate_arn != "" ? "redirect" : "fixed-response"

    dynamic "redirect" {
      for_each = var.acm_certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    dynamic "fixed_response" {
      for_each = var.acm_certificate_arn == "" ? [1] : []
      content {
        content_type = "application/json"
        message_body = "{\"error\":\"Not Found\"}"
        status_code  = "404"
      }
    }
  }
}

# ── HTTPS listener (only created when ACM cert is supplied) ────────────────────
resource "aws_lb_listener" "https" {
  count = var.acm_certificate_arn != "" ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "application/json"
      message_body = "{\"error\":\"Not Found\"}"
      status_code  = "404"
    }
  }
}
