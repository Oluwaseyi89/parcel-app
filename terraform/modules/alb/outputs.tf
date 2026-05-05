output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "DNS name of the ALB (use in Route53 or CloudFront ALB origin)"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Route53 hosted zone ID for the ALB (for alias records)"
  value       = aws_lb.main.zone_id
}

output "http_listener_arn" {
  description = "ARN of the HTTP listener"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "ARN of the active listener — HTTPS if cert provided, else HTTP"
  value       = var.acm_certificate_arn != "" ? aws_lb_listener.https[0].arn : aws_lb_listener.http.arn
}
