variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights for the ECS cluster"
  type        = bool
  default     = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
