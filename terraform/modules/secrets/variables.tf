variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "recovery_window_in_days" {
  description = "Days before secret is permanently deleted after destroy (0 = immediate)"
  type        = number
  default     = 0 # set to 7+ for prod
}

variable "paystack_secret_placeholder" {
  description = "Initial placeholder value. Replace in AWS Console with real key."
  type        = string
  sensitive   = true
  default     = "REPLACE_WITH_REAL_PAYSTACK_SECRET_KEY"
}

variable "smtp_password_placeholder" {
  description = "Initial placeholder value. Replace in AWS Console with real password."
  type        = string
  sensitive   = true
  default     = "REPLACE_WITH_REAL_SMTP_PASSWORD"
}

variable "tags" {
  type    = map(string)
  default = {}
}
