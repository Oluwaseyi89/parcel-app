from django.urls import path
from .views import calculate_distance_view, CalculateDistanceAPIView

urlpatterns = [
    # Template-based view
    path('calculate/', calculate_distance_view, name="calculate_distance"),
    
    # API endpoint
    path('api/calculate/', CalculateDistanceAPIView.as_view(), name="api_calculate_distance"),
]