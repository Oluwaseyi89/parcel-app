from django.urls import path
from .views import calculate_distance_view, CalculateDistanceAPIView

# Links this routing fleet to the 'geolocation' block in project urls.py
app_name = 'geolocation'

urlpatterns = [
    # Template-based view
    path('calculate/', calculate_distance_view, name="calculate_distance"),
    
    # API endpoint -> /api/v1/geolocation/calculate/api/
    path('calculate/api/', CalculateDistanceAPIView.as_view(), name="api_calculate_distance"),
]