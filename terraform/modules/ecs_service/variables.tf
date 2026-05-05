variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "name" {
  description = "Short service name used in resource names (e.g. 'django-api', 'celery-worker')"
  type        = string
}

variable "cluster_id" {
  description = "ECS cluster ID"
  type        = string
}

variable "cluster_name" {
  description = "ECS cluster name (needed for autoscaling resource_id)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the target group"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for the ECS tasks"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs to attach to ECS tasks"
  type        = list(string)
}

variable "image_uri" {
  description = "Full container image URI (e.g. ECR URL:tag)"
  type        = string
}

variable "cpu" {
  description = "ECS task CPU units (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "memory" {
  description = "ECS task memory in MiB"
  type        = number
  default     = 1024
}

variable "container_port" {
  description = "Port exposed by the container. Set null for worker processes."
  type        = number
  default     = null
}

variable "desired_count" {
  description = "Desired number of running tasks"
  type        = number
  default     = 1
}

variable "health_check_path" {
  description = "HTTP path for ALB and ECS task health checks"
  type        = string
  default     = "/health/"
}

variable "health_check_matcher" {
  description = "HTTP status codes considered healthy"
  type        = string
  default     = "200-299"
}

variable "assign_public_ip" {
  description = "Assign public IP to ECS tasks (needed without NAT gateway)"
  type        = bool
  default     = false
}

variable "environment_variables" {
  description = "Plain-text environment variables injected into the container"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "secrets" {
  description = "Secrets from Secrets Manager or SSM Parameter Store injected as env vars"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

variable "command" {
  description = "Override the Docker CMD. Leave empty to use the image default."
  type        = list(string)
  default     = []
}

variable "use_spot" {
  description = "Use FARGATE_SPOT capacity provider (cost-saving, can be interrupted)"
  type        = bool
  default     = false
}

variable "alb_listener_arn" {
  description = "ALB listener ARN to attach a listener rule. Set null to skip."
  type        = string
  default     = null
}

variable "alb_listener_rule_priority" {
  description = "Priority of the ALB listener rule (lower = higher priority, 1-50000)"
  type        = number
  default     = 100
}

variable "alb_path_patterns" {
  description = "URL path patterns for ALB routing (e.g. ['/api/*', '/auth/*'])"
  type        = list(string)
  default     = []
}

variable "alb_host_headers" {
  description = "Host header values for ALB routing (e.g. ['api.example.com'])"
  type        = list(string)
  default     = []
}

variable "task_role_policy_arns" {
  description = "Additional IAM managed policy ARNs to attach to the task role"
  type        = list(string)
  default     = []
}

variable "enable_execute_command" {
  description = "Enable ECS Exec for interactive debugging (dev only)"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "enable_autoscaling" {
  description = "Enable CPU/memory-based autoscaling"
  type        = bool
  default     = false
}

variable "autoscaling_min_capacity" {
  type    = number
  default = 1
}

variable "autoscaling_max_capacity" {
  type    = number
  default = 4
}

variable "autoscaling_cpu_target" {
  description = "Target CPU utilisation % for autoscaling"
  type        = number
  default     = 70
}

variable "autoscaling_memory_target" {
  description = "Target memory utilisation % for autoscaling"
  type        = number
  default     = 75
}

variable "tags" {
  type    = map(string)
  default = {}
}
