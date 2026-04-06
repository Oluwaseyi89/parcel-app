# authentication/urls.py
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    home, base, super_admin_login, super_admin_dashboard,
    AdminLoginView, AdminLogoutView, AdminProfileView, 
    ChangePasswordView, AdminUserListView, AdminCustomerListView, staff_reg_page,
    staff_login, desk_login, desk_login_external, reg_staff,
    # Add customer views
    CustomerRegistrationView, CustomerLoginView, CustomerProfileView,
    activate_customer, customer_reset, dev_verify_email
)
from .views import CustomerResetView, CustomerSaveResetView  # You'll need to create these

urlpatterns = [
    # Main pages
    path('', home, name="home"),
    path('base/', base, name="base"),
    
    # Template-based admin views (legacy)
    path('super_admin/', super_admin_login, name="super_admin_login"),
    path('admin_dashboard/', super_admin_dashboard, name="admin_dashboard"),
    path('staff_reg_page/', staff_reg_page, name="staff_reg_page"),
    path('staff_login/', staff_login, name="staff_login"),
    path('desk_login/', desk_login, name="desk_login"),
    path('desk_login_ext/<str:email>/<str:password>/', desk_login_external, name="desk_login_ext"),
    path('reg_staff/', reg_staff, name="reg_staff"),
    
    # API Authentication Endpoints
    path('api/login/', AdminLoginView.as_view(), name="admin_login"),
    path('api/logout/', AdminLogoutView.as_view(), name="admin_logout"),
    path('api/profile/', AdminProfileView.as_view(), name="admin_profile"),
    path('api/change-password/', ChangePasswordView.as_view(), name="change_password"),
    
    # Admin Management (super admin only)
    path('api/admins/', AdminUserListView.as_view(), name="admin_list"),
    path('api/admins/<int:pk>/', AdminUserListView.as_view(), name="admin_detail"),
    
    # Session management
    path('api/sessions/active/', csrf_exempt(AdminLoginView.as_view()), name="active_sessions"),
    
    # Legacy mobile endpoints with csrf exempt
    path('api/mobile/login/', csrf_exempt(AdminLoginView.as_view()), name="mobile_admin_login"),
    
    # ==================== CUSTOMER ENDPOINTS ====================
    # Customer Registration & Activation
    path('customer/register/', CustomerRegistrationView.as_view(), name="customer_register"),
    path('customer/register/mobile/', csrf_exempt(CustomerRegistrationView.as_view()), name="customer_register_mobile"),
    path('customer/activate/<uidb64>/<token>/', activate_customer, name="activate_customer"),
    path('dev/verify-email/<str:role>/<uidb64>/<token>/', dev_verify_email, name='dev_verify_email'),
    
    # Customer Authentication
    path('customer/login/', CustomerLoginView.as_view(), name="customer_login"),
    path('customer/login/mobile/', csrf_exempt(CustomerLoginView.as_view()), name="customer_login_mobile"),
    
    # Customer Profile
    path('customer/profile/', CustomerProfileView.as_view(), name="customer_profile"),
    path('customer/profile/mobile/', csrf_exempt(CustomerProfileView.as_view()), name="customer_profile_mobile"),
    
    # Password Reset
    path('customer/password/reset/', CustomerResetView.as_view(), name="customer_password_reset"),
    path('customer/password/reset/mobile/', csrf_exempt(CustomerResetView.as_view()), name="customer_password_reset_mobile"),
    path('customer/password/reset/<uidb64>/<token>/', customer_reset, name="customer_reset_confirm"),
    path('customer/password/save/', CustomerSaveResetView.as_view(), name="customer_password_save"),
    
    # Customer Management (Admin only - optional)
    path('api/customers/', AdminCustomerListView.as_view(), name="customer_list"),
    path('api/customers/<int:pk>/', AdminCustomerListView.as_view(), name="customer_detail"),
]



















# from django.urls import path
# from django.views.decorators.csrf import csrf_exempt
# from .views import (
#     home, base, super_admin_login, super_admin_dashboard,
#     AdminLoginView, AdminLogoutView, AdminProfileView, 
#     ChangePasswordView, AdminUserListView, staff_reg_page,
#     staff_login, desk_login, desk_login_external, reg_staff
# )

# urlpatterns = [
#     # Main pages
#     path('', home, name="home"),
#     path('base/', base, name="base"),
    
#     # Template-based admin views (legacy)
#     path('super_admin/', super_admin_login, name="super_admin_login"),
#     path('admin_dashboard/', super_admin_dashboard, name="admin_dashboard"),
#     path('staff_reg_page/', staff_reg_page, name="staff_reg_page"),
#     path('staff_login/', staff_login, name="staff_login"),
#     path('desk_login/', desk_login, name="desk_login"),
#     path('desk_login_ext/<str:email>/<str:password>/', desk_login_external, name="desk_login_ext"),
#     path('reg_staff/', reg_staff, name="reg_staff"),
    
#     # API Authentication Endpoints
#     path('api/login/', AdminLoginView.as_view(), name="admin_login"),
#     path('api/logout/', AdminLogoutView.as_view(), name="admin_logout"),
#     path('api/profile/', AdminProfileView.as_view(), name="admin_profile"),
#     path('api/change-password/', ChangePasswordView.as_view(), name="change_password"),
    
#     # Admin Management (super admin only)
#     path('api/admins/', AdminUserListView.as_view(), name="admin_list"),
#     path('api/admins/<int:pk>/', AdminUserListView.as_view(), name="admin_detail"),
    
#     # Session management
#     path('api/sessions/active/', csrf_exempt(AdminLoginView.as_view()), name="active_sessions"),
    
#     # Legacy mobile endpoints with csrf exempt
#     path('api/mobile/login/', csrf_exempt(AdminLoginView.as_view()), name="mobile_admin_login"),
# ]

