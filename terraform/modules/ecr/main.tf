################################################################################
# Parcel App — ECR Module
# Creates: ECR repositories for all containerised services
# Repos: django (shared with celery), payment-service (Spring Boot)
################################################################################

resource "aws_ecr_repository" "django" {
  name                 = "${var.project}-${var.environment}-django"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, { Name = "${var.project}-${var.environment}-django" })
}

resource "aws_ecr_repository" "payment" {
  name                 = "${var.project}-${var.environment}-payment"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, { Name = "${var.project}-${var.environment}-payment" })
}

# ── Lifecycle Policies — keep last N images ────────────────────────────────────
resource "aws_ecr_lifecycle_policy" "django" {
  repository = aws_ecr_repository.django.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last ${var.keep_image_count} tagged images"
      selection = {
        tagStatus     = "tagged"
        tagPrefixList = ["v", "latest", "release"]
        countType     = "imageCountMoreThan"
        countNumber   = var.keep_image_count
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "payment" {
  repository = aws_ecr_repository.payment.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last ${var.keep_image_count} tagged images"
      selection = {
        tagStatus     = "tagged"
        tagPrefixList = ["v", "latest", "release"]
        countType     = "imageCountMoreThan"
        countNumber   = var.keep_image_count
      }
      action = { type = "expire" }
    }]
  })
}
