variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "keep_image_count" {
  description = "Number of tagged images to retain per repository"
  type        = number
  default     = 5
}

variable "tags" {
  type    = map(string)
  default = {}
}
