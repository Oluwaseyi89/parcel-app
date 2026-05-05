################################################################################
# Parcel App — SQS Module
# Queue for Celery task dispatch + a dead-letter queue for failed tasks
################################################################################

resource "aws_sqs_queue" "dlq" {
  name                      = "${var.project}-${var.environment}-celery-dlq"
  message_retention_seconds = 1209600 # 14 days

  kms_master_key_id                 = "alias/aws/sqs"
  kms_data_key_reuse_period_seconds = 300

  tags = merge(var.tags, { Name = "${var.project}-${var.environment}-celery-dlq" })
}

resource "aws_sqs_queue" "main" {
  name                       = "${var.project}-${var.environment}-celery"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  receive_wait_time_seconds  = 20 # long polling — reduces empty receives

  kms_master_key_id                 = "alias/aws/sqs"
  kms_data_key_reuse_period_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(var.tags, { Name = "${var.project}-${var.environment}-celery" })
}

# ── IAM policy document for ECS tasks to send/receive from queue ───────────────
resource "aws_sqs_queue_policy" "main" {
  queue_url = aws_sqs_queue.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowECSAccess"
      Effect = "Allow"
      Principal = {
        AWS = var.allowed_role_arns
      }
      Action   = ["sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
      Resource = aws_sqs_queue.main.arn
    }]
  })
}
