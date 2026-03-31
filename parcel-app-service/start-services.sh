#!/bin/bash

# Script to start Django and Celery services in production

# Set default values
GUNICORN_WORKERS=${GUNICORN_WORKERS:-3}
GUNICORN_PORT=${GUNICORN_PORT:-8080}
GUNICORN_BIND=${GUNICORN_BIND:-0.0.0.0:${GUNICORN_PORT}}

# Function to wait for database to be ready
wait_for_db() {
    echo "Waiting for PostgreSQL to be ready..."
    while ! python manage.py check --database default > /dev/null 2>&1; do
        echo "Database not ready, waiting 5 seconds..."
        sleep 5
    done
    echo "Database is ready!"
}

# Function to wait for Redis to be ready
wait_for_redis() {
    echo "Waiting for Redis to be ready..."
    while ! python -c "import redis; redis.Redis.from_url('$REDIS_URL').ping()" > /dev/null 2>&1; do
        echo "Redis not ready, waiting 3 seconds..."
        sleep 3
    done
    echo "Redis is ready!"
}

# Function to run migrations
run_migrations() {
    echo "Running database migrations..."
    python manage.py migrate --noinput
}

# Function to collect static files
collect_static() {
    echo "Collecting static files..."
    python manage.py collectstatic --noinput --clear
}

# Function to create log directory
setup_logging() {
    mkdir -p /app/logs
    touch /app/logs/celery-worker.log /app/logs/celery-beat.log /app/logs/gunicorn.log
    chmod 644 /app/logs/*.log
}

# Function to start Celery worker
start_celery_worker() {
    echo "Starting Celery worker..."
    celery -A parcel_app worker \
        --loglevel=info \
        --logfile=/app/logs/celery-worker.log \
        --hostname=worker@%h \
        --max-tasks-per-child=100 \
        --concurrency=4 &
    CELERY_WORKER_PID=$!
    echo "Celery worker started with PID: $CELERY_WORKER_PID"
}

# Function to start Celery beat
start_celery_beat() {
    echo "Starting Celery beat..."
    celery -A parcel_app beat \
        --loglevel=info \
        --logfile=/app/logs/celery-beat.log \
        --scheduler=django_celery_beat.schedulers:DatabaseScheduler \
        --pidfile=/tmp/celerybeat.pid &
    CELERY_BEAT_PID=$!
    echo "Celery beat started with PID: $CELERY_BEAT_PID"
}

# Function to start Django application with Gunicorn
start_django() {
    echo "Starting Django application with Gunicorn..."
    echo "Gunicorn binding to: $GUNICORN_BIND"
    echo "Number of workers: $GUNICORN_WORKERS"
    
    gunicorn parcel_app.wsgi:application \
        --bind $GUNICORN_BIND \
        --workers $GUNICORN_WORKERS \
        --worker-class sync \
        --access-logfile /app/logs/gunicorn-access.log \
        --error-logfile /app/logs/gunicorn-error.log \
        --log-level info \
        --timeout 120 \
        --max-requests 1000 \
        --max-requests-jitter 100 &
    GUNICORN_PID=$!
    echo "Gunicorn started with PID: $GUNICORN_PID"
}

# Function to check if services are running
check_services() {
    echo "Checking if services are running..."
    sleep 5
    
    # Check Gunicorn
    if kill -0 $GUNICORN_PID 2>/dev/null; then
        echo "✓ Gunicorn is running (PID: $GUNICORN_PID)"
    else
        echo "✗ Gunicorn failed to start"
        return 1
    fi
    
    # Check Celery worker
    if kill -0 $CELERY_WORKER_PID 2>/dev/null; then
        echo "✓ Celery worker is running (PID: $CELERY_WORKER_PID)"
    else
        echo "✗ Celery worker failed to start"
        return 1
    fi
    
    # Check Celery beat
    if kill -0 $CELERY_BEAT_PID 2>/dev/null; then
        echo "✓ Celery beat is running (PID: $CELERY_BEAT_PID)"
    else
        echo "✗ Celery beat failed to start"
        return 1
    fi
    
    echo "All services are running successfully!"
    return 0
}

# Function to graceful shutdown
graceful_shutdown() {
    echo "Initiating graceful shutdown..."
    
    # Stop Gunicorn
    if [ ! -z "$GUNICORN_PID" ]; then
        echo "Stopping Gunicorn (PID: $GUNICORN_PID)..."
        kill -TERM $GUNICORN_PID
    fi
    
    # Stop Celery beat
    if [ ! -z "$CELERY_BEAT_PID" ]; then
        echo "Stopping Celery beat (PID: $CELERY_BEAT_PID)..."
        kill -TERM $CELERY_BEAT_PID
    fi
    
    # Stop Celery worker
    if [ ! -z "$CELERY_WORKER_PID" ]; then
        echo "Stopping Celery worker (PID: $CELERY_WORKER_PID)..."
        kill -TERM $CELERY_WORKER_PID
    fi
    
    # Wait for all processes to finish
    wait
    echo "All services stopped gracefully."
    exit 0
}

# Main execution
main() {
    echo "Starting Parcel App Services..."
    
    # Setup logging
    setup_logging
    
    # Wait for dependencies
    wait_for_db
    wait_for_redis
    
    # Run setup tasks
    run_migrations
    collect_static
    
    # Start services
    start_celery_worker
    start_celery_beat
    start_django
    
    # Verify services started correctly
    if check_services; then
        echo "Application startup completed successfully!"
        echo "Django is running on port $GUNICORN_PORT"
        echo "Celery worker and beat are running"
    else
        echo "Application startup failed!"
        graceful_shutdown
    fi
}

# Set up signal handlers for graceful shutdown
trap graceful_shutdown SIGTERM SIGINT SIGQUIT

# Run main function
main

# Wait for all background processes and keep container running
echo "Container is running. Press Ctrl+C to stop."
wait