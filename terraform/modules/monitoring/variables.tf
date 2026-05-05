variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  description = "AWS region (used in dashboard JSON)"
  type        = string
}

variable "alarm_email" {
  description = "Email address to receive CloudWatch alarm notifications"
  type        = string
  default     = ""
}

variable "ecs_cluster_name" {
  description = "ECS cluster name (for metric dimensions)"
  type        = string
  default     = ""
}

variable "ecs_service_names" {
  description = "Set of ECS service names to create CPU/memory alarms for"
  type        = set(string)
  default     = []
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix (e.g. app/my-alb/abc123). Leave empty to skip ALB alarms."
  type        = string
  default     = ""
}

variable "aurora_cluster_id" {
  description = "Aurora cluster identifier. Leave empty to skip Aurora alarms."
  type        = string
  default     = ""
}

variable "cpu_alarm_threshold" {
  description = "CPU utilisation % to trigger alarm"
  type        = number
  default     = 80
}

variable "memory_alarm_threshold" {
  description = "Memory utilisation % to trigger alarm"
  type        = number
  default     = 85
}

variable "alb_5xx_threshold" {
  description = "Number of ALB 5xx errors per minute to trigger alarm"
  type        = number
  default     = 10
}

variable "tags" {
  type    = map(string)
  default = {}
}
