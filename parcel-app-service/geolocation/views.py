from geopy.distance import geodesic
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import DistanceCalculationSerializer


class CalculateDistanceAPIView(APIView):
    """Geodesic distance in kilometres between two coordinate pairs."""

    def post(self, request):
        serializer = DistanceCalculationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        origin = (data['origin_lat'], data['origin_lng'])
        destination = (data['destination_lat'], data['destination_lng'])
        return Response({
            "status": "success",
            "data": {
                "origin": {"lat": origin[0], "lng": origin[1]},
                "destination": {"lat": destination[0], "lng": destination[1]},
                "distance_km": round(geodesic(origin, destination).km, 2),
            }
        })
