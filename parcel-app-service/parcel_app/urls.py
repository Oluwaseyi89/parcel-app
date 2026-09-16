"""
Project-Level URL Configuration for Parcel Application Engine
Implements clean API Namespace Versioning to preserve backward compatibility.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

# ------------------------------------------------------------------------------
# API VERSION 1 (v1) ENDPOINT FLEET
# ------------------------------------------------------------------------------
v1_api_patterns = [
    path('auth/', include(('authentication.urls', 'authentication'), namespace='auth')),
    path('vendors/', include(('vendor.urls', 'vendor'), namespace='vendors')),
    path('couriers/', include(('courier.urls', 'courier'), namespace='couriers')),
    path('banking/', include(('banking.urls', 'banking'), namespace='banking')),
    path('complaints/', include(('complaints.urls', 'complaints'), namespace='complaints')),
    path('geolocation/', include(('geolocation.urls', 'geolocation'), namespace='geolocation')),
    path('order/', include(('order.urls', 'order'), namespace='order')),
    path('product/', include(('product.urls', 'product'), namespace='product')),
    path('dispatch/', include(('dispatch.urls', 'dispatch'), namespace='dispatch')),
    path('email/', include(('email_service.urls', 'email_service'), namespace='email')),
    path('messaging/', include(('messaging.urls', 'messaging'), namespace='messaging')),
    
    # Cart and Customers apps can be instantly attached here when adopted end-to-end:
    # path('cart/', include(('cart.urls', 'cart'), namespace='cart')),
    # path('customers/', include(('customer.urls', 'customer'), namespace='customers')),
]

# ------------------------------------------------------------------------------
# GLOBAL ROUTING MATRIX
# ------------------------------------------------------------------------------
urlpatterns = [
    # Core Django Management Dashboard Portal
    path('admin/', admin.site.urls),
    
    # Namespaced V1 API Base Mount Point
    # All sub-routes become accessible via: /api/v1/<endpoint>/
    path('api/v1/', include((v1_api_patterns, 'v1'), namespace='v1')),
    
    # Baseline Entry Fallback / Root landing path
    path('', include('authentication.urls')),
]

# Append Static/Media Asset handling loops
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)