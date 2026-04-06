"""parcel_app URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('authentication.urls')),  # New authentication app
    path('vendors/', include('vendor.urls')),      # Vendors app
    path('couriers/', include('courier.urls')),    # Couriers app
    path('banking/', include('banking.urls')),      # Banking app
    path('complaints/', include('complaints.urls')), # Complaints app
    path('geolocation/', include('geolocation.urls')), # Geolocation app
    path('order/', include('order.urls')), # Order app
    path('product/', include('product.urls')), # Product app
    path('dispatch/', include('dispatch.urls')), # Dispatch app
    # Cart app intentionally not routed: current web/mobile clients use local cart state,
    # and backend cart endpoints remain disabled until the module is adopted end-to-end.
    # path('customers/', include('customer.urls')), # Customer app
    path('email/', include('email_service.urls')), # Email app
    path('messaging/', include('messaging.urls')), # Messaging app







   
    
    # Keep main entry point (optional)
    path('', include('authentication.urls')),  # Home page redirects to auth
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)





# from django.conf import settings
# from django.conf.urls.static import static
# from django.contrib import admin
# from django.urls import path, include

# urlpatterns = [
#     path('admin/', admin.site.urls),
#     path('parcel_backends/', include('parcel_backends.urls')),
#     path('parcel_product/', include('parcel_product.urls')),
#     path('parcel_message/', include('parcel_message.urls')),
#     path('parcel_order/', include('parcel_order.urls')),
#     path('parcel_dispatch/', include('parcel_dispatch.urls')),
#     path('parcel_customer/', include('parcel_customer.urls')),
# ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
