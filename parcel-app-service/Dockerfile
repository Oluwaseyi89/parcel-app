FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=parcel_app.settings
ENV C_FORCE_ROOT=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-dev \
    nginx \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/static /app/media /app/logs

# Copy nginx config
COPY nginx.conf /etc/nginx/sites-available/parcel-app
RUN ln -s /etc/nginx/sites-available/parcel-app /etc/nginx/sites-enabled/

RUN useradd -m -r django && \
    chown -R django:django /app
USER django

EXPOSE 80

COPY start-services.sh .
RUN chmod +x start-services.sh

CMD ["./start-services.sh"]