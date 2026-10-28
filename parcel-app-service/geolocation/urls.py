from django.urls import path
from .views import CalculateDistanceAPIView

# Links this routing fleet to the 'geolocation' block in project urls.py
app_name = 'geolocation'

urlpatterns = [
    # API endpoint -> /api/v1/geolocation/calculate/api/
    path('calculate/api/', CalculateDistanceAPIView.as_view(), name="api_calculate_distance"),
]