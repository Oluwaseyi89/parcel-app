variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "visibility_timeout_seconds" {
  description = "Seconds a message is hidden after being received (should be >= max task execution time)"
  type        = number
  default     = 300
}

variable "message_retention_seconds" {
  description = "How long SQS retains unprocessed messages (seconds)"
  type        = number
  default     = 86400 # 1 day
}

variable "max_receive_count" {
  description = "Max times a message is received before being sent to DLQ"
  type        = number
  default     = 5
}

variable "allowed_role_arns" {
  description = "IAM role ARNs allowed to send/receive messages (ECS task roles)"
  type        = list(string)
  default     = ["*"]
}

variable "tags" {
  type    = map(string)
  default = {}
}
