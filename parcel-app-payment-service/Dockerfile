# Multi-stage build: compile and package the application
FROM gradle:8.6-jdk17 AS builder

WORKDIR /app

# Copy project files
COPY . .

# Build the application (skip tests for faster builds)
RUN gradle clean bootJar -x test

# Runtime stage: minimal image with just JRE
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Create non-root user for security
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

# Expose the port Spring Boot runs on (default 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/home || exit 1

# Run the application with production profile
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
