from django.shortcuts import render
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import folium
from rest_framework.views import APIView
from rest_framework.response import Response
from .forms import MeasurementModelForm
from .models import Measurement
from core.utils import get_ip_address, get_geo, get_zoom, get_center_coords

def calculate_distance_view(request):
    distance = 0
    destination = None
    form = MeasurementModelForm(request.POST or None)
    geolocator = Nominatim(user_agent='parcel_backends')

    ip_ = get_ip_address(request)
    print(ip_)
    ip = '197.210.76.118'
    print(ip)
    country, city, lat, lon = get_geo(ip)
    location = geolocator.geocode(city)
    print(location)

    l_lat = lat
    l_lon = lon
    pointA = (l_lat, l_lon)
    print(pointA)

    m = folium.Map(width=800, height=500, location=get_center_coords(l_lat, l_lon), zoom_start=get_zoom(distance))
    folium.Marker([l_lat, l_lon], tooltip='click here for more', popup=city['city'],
                  icon=folium.Icon(color='purple')).add_to(m)

    if form.is_valid():
        instance = form.save(commit=False)
        destination_ = form.cleaned_data.get('destination')
        print(destination_)
        destination = geolocator.geocode(destination_)
        print(destination)

        d_lat = destination.latitude
        d_lon = destination.longitude
        pointB = (d_lat, d_lon)
        print(pointB)

        distance = round(geodesic(pointA, pointB).km, 2)

        m = folium.Map(width=800, height=500, location=get_center_coords(l_lat, l_lon, d_lat, d_lon),
                       zoom_start=get_zoom(distance))

        folium.Marker([l_lat, l_lon], tooltip='click here for more', popup=city['city'],
                      icon=folium.Icon(color='purple')).add_to(m)
        folium.Marker([d_lat, d_lon], tooltip='click here for more', popup=destination,
                      icon=folium.Icon(color='red')).add_to(m)

        line = folium.PolyLine(locations=[pointA, pointB], weight=5, color='blue')
        m.add_child(line)

        instance.location = 'Gonin-Gora Kaduna'
        instance.destination = destination
        instance.distance = distance
        instance.save()

    m = m._repr_html_()

    ctx = {
        "distance": distance,
        "destination": destination,
        "form": form,
        "map": m
    }
    return render(request, "parcel_backends/geolocator.html", ctx)

class CalculateDistanceAPIView(APIView):
    def post(self, request):
        # API version of distance calculation
        # Implement as needed
        pass