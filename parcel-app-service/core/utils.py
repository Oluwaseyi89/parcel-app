from django.contrib.gis.geoip2 import GeoIP2
# from django.contrib.gis.geoips import Ge


def get_ip_address(request):
    x_forward_for = request.META.get('HTTP_X_FORWARDED_FOR')

    if x_forward_for:
        ip = x_forward_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_geo(ip):
    g = GeoIP2()
    country = g.country(ip)
    city = g.city(ip)
    lat, lon = g.lat_lon(ip)
    return country, city, lat, lon


def get_center_coords(lat_a, lon_a, lat_b=None, lon_b=None):
    cord = (lat_a, lon_a)

    if lat_b and lon_b:
        cord = [(lat_a + lat_b) / 2, (lon_a + lon_b) / 2]
    return cord


def get_zoom(distance):
    if distance is not None:
        if distance <= 100:
            return 4.8
        elif 100 < distance <= 5000:
            return 3.2
        else:
            return 2.4
