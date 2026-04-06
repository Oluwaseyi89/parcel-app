# courier/urls.py
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    TempCourierRegistrationView, CourierApprovalView, TempCourierListView,
    CourierListView, CourierLoginView, CourierProfileView,
    CourierLocationUpdateView, CourierStatusUpdateView, AvailableCouriersView,
    activate_courier, courier_reset
)

urlpatterns = [
    # Courier Registration & Activation
    path('register/', TempCourierRegistrationView.as_view(), name="courier_register"),
    path('register/mobile/', csrf_exempt(TempCourierRegistrationView.as_view()), name="courier_register_mobile"),
    path('activate/<uidb64>/<token>/', activate_courier, name="courier_activate"),
    
    # Courier Management (Admin only)
    path('temp/list/', TempCourierListView.as_view(), name="temp_courier_list"),
    path('approve/<int:temp_courier_id>/', CourierApprovalView.as_view(), name="courier_approve"),
    path('moderate/<int:temp_courier_id>/', CourierApprovalView.as_view(), name="courier_moderate"),
    path('list/', CourierListView.as_view(), name="courier_list"),
    
    # Courier Authentication
    path('login/', CourierLoginView.as_view(), name="courier_login"),
    path('login/mobile/', csrf_exempt(CourierLoginView.as_view()), name="courier_login_mobile"),
    path('profile/', CourierProfileView.as_view(), name="courier_profile"),
    
    # Courier Operations
    path('location/update/', CourierLocationUpdateView.as_view(), name="courier_location_update"),
    path('status/update/', CourierStatusUpdateView.as_view(), name="courier_status_update"),
    path('available/', AvailableCouriersView.as_view(), name="available_couriers"),
    
    # Password Reset
    path('password-reset/<uidb64>/<token>/', courier_reset, name="courier_password_reset"),
]














# from django.urls import path
# from django.views.decorators.csrf import csrf_exempt
# from .views import (
#     TempCourierViews, CourierViews, DelTempCourierViews,
#     GetTempCourierViews, GetCourierViews, CourierLoginViews,
#     CourierResetViews, CourierSaveResetViews, activate_courier,
#     courier_reset
# )

# urlpatterns = [
#     # Temporary Courier Registration
#     path('temp/register/', TempCourierViews.as_view(), name="temp_courier_register"),
#     path('temp/register/mobile/', csrf_exempt(TempCourierViews.as_view()), name="temp_courier_register_mobile"),
#     path('temp/list/', GetTempCourierViews.as_view(), name="temp_courier_list"),
#     path('temp/delete/<int:id>/', DelTempCourierViews.as_view(), name="temp_courier_delete"),
    
#     # Courier Management
#     path('approve/', CourierViews.as_view(), name="courier_approve"),
#     path('list/', GetCourierViews.as_view(), name="courier_list"),
    
#     # Courier Authentication
#     path('login/', CourierLoginViews.as_view(), name="courier_login"),
#     path('login/mobile/', csrf_exempt(CourierLoginViews.as_view()), name="courier_login_mobile"),
    
#     # Password Reset
#     path('reset/request/', CourierResetViews.as_view(), name="courier_reset_request"),
#     path('reset/save/', CourierSaveResetViews.as_view(), name="courier_reset_save"),
    
#     # Activation
#     path('activate/<uidb64>/<token>/', activate_courier, name="courier_activate"),
#     path('password-reset/<uidb64>/<token>/', courier_reset, name="courier_password_reset"),
# ]