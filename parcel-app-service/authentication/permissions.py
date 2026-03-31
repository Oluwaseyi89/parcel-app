from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'super_admin'

class IsAdminOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['super_admin', 'admin']
    
class IsVendorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['vendor', 'admin', 'super_admin']
    
    def has_object_permission(self, request, view, obj):
        # Vendor can only access their own products
        if request.user.role == 'vendor':
            if hasattr(obj, 'vendor'):
                return obj.vendor == request.user
        return True

class IsVendor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'vendor'
    
class IsCourierOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['courier', 'admin', 'super_admin']

class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'customer'