from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import (
    AdminUser,
    CourierUser,
    CustomerUser,
    UserSession,
    VendorUser,
)
from banking.models import CourierBankDetail, VendorBankDetail
from complaints.models import CustomerComplaint
from dispatch.models import Dispatch, DispatchItem
from order.models import Order, OrderItem
from product.models import Category, Product


class EndpointRbacMatrixTests(TestCase):
    ROLE_ANON = "anonymous"
    ROLE_CUSTOMER = "customer"
    ROLE_VENDOR = "vendor"
    ROLE_COURIER = "courier"
    ROLE_ADMIN = "admin"
    ROLE_SUPER = "super_admin"

    ALL_ROLES = {
        ROLE_ANON,
        ROLE_CUSTOMER,
        ROLE_VENDOR,
        ROLE_COURIER,
        ROLE_ADMIN,
        ROLE_SUPER,
    }

    AUTHENTICATED_ROLES = {
        ROLE_CUSTOMER,
        ROLE_VENDOR,
        ROLE_COURIER,
        ROLE_ADMIN,
        ROLE_SUPER,
    }

    ADMIN_ROLES = {ROLE_ADMIN, ROLE_SUPER}
    SUPER_ADMIN_ONLY = {ROLE_SUPER}
    VENDOR_OR_ADMIN = {ROLE_VENDOR, ROLE_ADMIN, ROLE_SUPER}
    COURIER_OR_ADMIN = {ROLE_COURIER, ROLE_ADMIN, ROLE_SUPER}
    VENDOR_ONLY = {ROLE_VENDOR}

    def setUp(self):
        self.clients = {self.ROLE_ANON: APIClient()}

        self.super_admin = AdminUser.objects.create(
            email="super@example.com",
            first_name="Super",
            last_name="Admin",
            role="super_admin",
            is_email_verified=True,
        )
        self.super_admin.set_password("StrongPassword123")
        self.super_admin.save()

        self.admin = AdminUser.objects.create(
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            role="admin",
            is_email_verified=True,
        )
        self.admin.set_password("StrongPassword123")
        self.admin.save()

        self.customer = CustomerUser.objects.create(
            email="customer@example.com",
            first_name="Customer",
            last_name="User",
            phone="08000000001",
            role="customer",
            is_email_verified=True,
        )
        self.customer.set_password("StrongPassword123")
        self.customer.save()

        self.vendor = VendorUser.objects.create(
            email="vendor@example.com",
            first_name="Vendor",
            last_name="User",
            phone="08000000002",
            business_name="Vendor Shop",
            role="vendor",
            is_email_verified=True,
            is_approved=True,
            approval_status="approved",
        )
        self.vendor.set_password("StrongPassword123")
        self.vendor.save()

        self.courier = CourierUser.objects.create(
            email="courier@example.com",
            first_name="Courier",
            last_name="User",
            phone="08000000003",
            role="courier",
            is_email_verified=True,
            is_approved=True,
            approval_status="approved",
            status="active",
        )
        self.courier.set_password("StrongPassword123")
        self.courier.save()

        self._seed_domain_data()
        self._build_role_clients()

    def _seed_domain_data(self):
        self.category = Category.objects.create(name="Electronics")
        self.product = Product.objects.create(
            vendor=self.vendor,
            category=self.category,
            name="Matrix Product",
            description="RBAC Product",
            price="1000.00",
            quantity=10,
            sku="RBAC-SKU-001",
            slug="rbac-sku-001",
            status="active",
            approval_status="approved",
        )

        self.order = Order.objects.create(
            customer=self.customer,
            status="pending",
            payment_status="pending",
            shipping_method="pickup",
            shipping_address={"street": "1 Test Street", "city": "Lagos"},
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            product_name=self.product.name,
            product_sku=self.product.sku,
            unit_price=self.product.price,
            quantity=1,
            vendor=self.vendor,
        )

        self.dispatch = Dispatch.objects.create(order=self.order)
        self.dispatch_item = DispatchItem.objects.create(
            dispatch=self.dispatch,
            order_item=self.order_item,
        )

        self.vendor_bank = VendorBankDetail.objects.create(
            bank_name="Vendor Bank",
            account_type="Savings",
            account_name="Vendor User",
            vendor_email=self.vendor.email,
            account_no="1234567890",
            added_at="2026-01-01",
            updated_at="2026-01-01",
        )
        self.courier_bank = CourierBankDetail.objects.create(
            bank_name="Courier Bank",
            account_type="Current",
            account_name="Courier User",
            courier_email=self.courier.email,
            account_no="0987654321",
            added_at="2026-01-01",
            updated_at="2026-01-01",
        )

        self.complaint = CustomerComplaint.objects.create(
            customer_email=self.customer.email,
            complaint_subject="Delayed delivery",
            courier_involved=self.courier.email,
            complaint_detail="Package was delayed",
            is_resolved=False,
            is_satisfied=False,
        )

        self.template_id = 1
        self.notification_id = 1

    def _build_role_clients(self):
        role_to_user = {
            self.ROLE_CUSTOMER: self.customer,
            self.ROLE_VENDOR: self.vendor,
            self.ROLE_COURIER: self.courier,
            self.ROLE_ADMIN: self.admin,
            self.ROLE_SUPER: self.super_admin,
        }

        for role, user in role_to_user.items():
            token = f"rbac-{role}-token"
            content_type = ContentType.objects.get_for_model(user)
            UserSession.objects.create(
                content_type=content_type,
                object_id=user.id,
                session_token=token,
                expires_at=timezone.now() + timedelta(hours=2),
            )

            client = APIClient()
            client.credentials(HTTP_X_SESSION_TOKEN=token)
            self.clients[role] = client

    def _request(self, role, method, path):
        client = self.clients[role]
        data = {}
        method = method.lower()

        if method == "get":
            return client.get(path, format="json")
        if method == "post":
            return client.post(path, data, format="json")
        if method == "patch":
            return client.patch(path, data, format="json")
        if method == "put":
            return client.put(path, data, format="json")
        if method == "delete":
            return client.delete(path, format="json")
        if method == "options":
            return client.options(path, format="json")

        raise ValueError(f"Unsupported method: {method}")

    def _assert_endpoint_access(self, endpoint):
        name = endpoint["name"]
        method = endpoint["method"]
        path = endpoint["path"]
        allowed_roles = endpoint["allowed_roles"]

        for role in sorted(self.ALL_ROLES):
            response = self._request(role, method, path)
            if role in allowed_roles:
                self.assertNotIn(
                    response.status_code,
                    {401, 403},
                    msg=f"{name}: role={role} expected allow, got {response.status_code}",
                )
            else:
                self.assertIn(
                    response.status_code,
                    {401, 403},
                    msg=f"{name}: role={role} expected deny, got {response.status_code}",
                )

    def test_rbac_matrix_for_all_routed_api_endpoints(self):
        endpoints = [
            # authentication app
            {"name": "auth_api_login", "method": "options", "path": reverse("v1:auth:admin_login"), "allowed_roles": self.ALL_ROLES},
            {"name": "auth_api_logout", "method": "options", "path": reverse("v1:auth:admin_logout"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "auth_csrf", "method": "options", "path": reverse("v1:auth:csrf_token"), "allowed_roles": self.ALL_ROLES},
            {"name": "auth_me", "method": "options", "path": reverse("v1:auth:session_me"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "auth_switch_role", "method": "options", "path": reverse("v1:auth:switch_active_role"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "auth_profile", "method": "options", "path": reverse("v1:auth:admin_profile"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "auth_change_password", "method": "options", "path": reverse("v1:auth:change_password"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "auth_dashboard_metrics", "method": "options", "path": reverse("v1:auth:admin_dashboard_metrics"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_moderation_queue", "method": "options", "path": reverse("v1:auth:admin_moderation_queue"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_moderation_action", "method": "options", "path": reverse("v1:auth:admin_moderation_action", kwargs={"queue_type": "vendors", "pk": self.vendor.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_orders_list", "method": "options", "path": reverse("v1:auth:admin_orders"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_order_detail", "method": "options", "path": reverse("v1:auth:admin_order_detail", kwargs={"pk": self.order.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_order_status_update", "method": "options", "path": reverse("v1:auth:admin_order_status_update", kwargs={"pk": self.order.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_dispatches", "method": "options", "path": reverse("v1:auth:admin_dispatches"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_dispatches_create", "method": "options", "path": reverse("v1:auth:admin_dispatches_create"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_dispatch_status_update", "method": "options", "path": reverse("v1:auth:admin_dispatch_status_update", kwargs={"pk": self.dispatch.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_dispatch_assign", "method": "options", "path": reverse("v1:auth:admin_dispatch_assign", kwargs={"pk": self.dispatch.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_dispatch_ready_orders", "method": "options", "path": reverse("v1:auth:admin_dispatch_ready_orders"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_courier_list", "method": "options", "path": reverse("v1:auth:admin_courier_list"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_complaints", "method": "options", "path": reverse("v1:auth:admin_complaints"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_complaint_detail", "method": "options", "path": reverse("v1:auth:admin_complaint_detail", kwargs={"pk": self.complaint.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_complaint_update", "method": "options", "path": reverse("v1:auth:admin_complaint_update", kwargs={"pk": self.complaint.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_banking_list", "method": "options", "path": reverse("v1:auth:admin_banking_list"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_banking_update", "method": "options", "path": reverse("v1:auth:admin_banking_update", kwargs={"account_kind": "vendor", "pk": self.vendor_bank.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_admin_list", "method": "options", "path": reverse("v1:auth:admin_list"), "allowed_roles": self.SUPER_ADMIN_ONLY},
            {"name": "auth_admin_detail", "method": "options", "path": reverse("v1:auth:admin_detail", kwargs={"pk": self.admin.id}), "allowed_roles": self.SUPER_ADMIN_ONLY},
            {"name": "auth_active_sessions", "method": "options", "path": reverse("v1:auth:active_sessions"), "allowed_roles": self.ALL_ROLES},
            {"name": "auth_mobile_login", "method": "options", "path": reverse("v1:auth:mobile_admin_login"), "allowed_roles": self.ALL_ROLES},
            {"name": "auth_customer_register", "method": "options", "path": reverse("v1:auth:customer_register"), "allowed_roles": self.ALL_ROLES},
            {"name": "auth_customer_register_mobile", "method": "options", "path": reverse("v1:auth:customer_register_mobile"), "allowed_roles": self.ALL_ROLES},
            {"name": "auth_customer_login", "method": "options", "path": reverse("v1:auth:customer_login"), "allowed_roles": self.ALL_ROLES},
            {"name": "auth_customer_login_mobile", "method": "options", "path": reverse("v1:auth:customer_login_mobile"), "allowed_roles": self.ALL_ROLES},
            {"name": "auth_customer_profile", "method": "options", "path": reverse("v1:auth:customer_profile"), "allowed_roles": self.ALL_ROLES},
            {"name": "auth_customer_profile_mobile", "method": "options", "path": reverse("v1:auth:customer_profile_mobile"), "allowed_roles": self.ALL_ROLES},
            {"name": "auth_customer_password_reset", "method": "options", "path": reverse("v1:auth:customer_password_reset"), "allowed_roles": self.ALL_ROLES},
            {"name": "auth_customer_password_reset_mobile", "method": "options", "path": reverse("v1:auth:customer_password_reset_mobile"), "allowed_roles": self.ALL_ROLES},
            {"name": "auth_customer_password_save", "method": "options", "path": reverse("v1:auth:customer_password_save"), "allowed_roles": self.ALL_ROLES},
            {"name": "auth_customer_list", "method": "options", "path": reverse("v1:auth:customer_list"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "auth_customer_detail", "method": "options", "path": reverse("v1:auth:customer_detail", kwargs={"pk": self.customer.id}), "allowed_roles": self.ADMIN_ROLES},

            # vendor app
            {"name": "vendor_register", "method": "options", "path": reverse("v1:vendors:vendor_register"), "allowed_roles": self.ALL_ROLES},
            {"name": "vendor_register_mobile", "method": "options", "path": reverse("v1:vendors:vendor_register_mobile"), "allowed_roles": self.ALL_ROLES},
            {"name": "vendor_temp_list", "method": "options", "path": reverse("v1:vendors:temp_vendor_list"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "vendor_approve", "method": "options", "path": reverse("v1:vendors:vendor_approve", kwargs={"temp_vendor_id": self.vendor.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "vendor_moderate", "method": "options", "path": reverse("v1:vendors:vendor_moderate", kwargs={"temp_vendor_id": self.vendor.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "vendor_list", "method": "options", "path": reverse("v1:vendors:vendor_list"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "vendor_login", "method": "options", "path": reverse("v1:vendors:vendor_login"), "allowed_roles": self.ALL_ROLES},
            {"name": "vendor_login_mobile", "method": "options", "path": reverse("v1:vendors:vendor_login_mobile"), "allowed_roles": self.ALL_ROLES},
            {"name": "vendor_profile", "method": "options", "path": reverse("v1:vendors:vendor_profile"), "allowed_roles": self.AUTHENTICATED_ROLES},

            # courier app
            {"name": "courier_register", "method": "options", "path": reverse("v1:couriers:courier_register"), "allowed_roles": self.ALL_ROLES},
            {"name": "courier_register_mobile", "method": "options", "path": reverse("v1:couriers:courier_register_mobile"), "allowed_roles": self.ALL_ROLES},
            {"name": "courier_temp_list", "method": "options", "path": reverse("v1:couriers:temp_courier_list"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "courier_approve", "method": "options", "path": reverse("v1:couriers:courier_approve", kwargs={"temp_courier_id": self.courier.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "courier_moderate", "method": "options", "path": reverse("v1:couriers:courier_moderate", kwargs={"temp_courier_id": self.courier.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "courier_list", "method": "options", "path": reverse("v1:couriers:courier_list"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "courier_login", "method": "options", "path": reverse("v1:couriers:courier_login"), "allowed_roles": self.ALL_ROLES},
            {"name": "courier_login_mobile", "method": "options", "path": reverse("v1:couriers:courier_login_mobile"), "allowed_roles": self.ALL_ROLES},
            {"name": "courier_profile", "method": "options", "path": reverse("v1:couriers:courier_profile"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "courier_location_update", "method": "options", "path": reverse("v1:couriers:courier_location_update"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "courier_status_update", "method": "options", "path": reverse("v1:couriers:courier_status_update"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "courier_available", "method": "options", "path": reverse("v1:couriers:available_couriers"), "allowed_roles": self.AUTHENTICATED_ROLES},

            # banking app
            {"name": "banking_vendor_save", "method": "options", "path": reverse("v1:banking:vendor_bank_save"), "allowed_roles": self.VENDOR_OR_ADMIN},
            {"name": "banking_vendor_update", "method": "options", "path": reverse("v1:banking:vendor_bank_update", kwargs={"vendor_email": self.vendor.email}), "allowed_roles": self.VENDOR_OR_ADMIN},
            {"name": "banking_vendor_get", "method": "options", "path": reverse("v1:banking:vendor_bank_get", kwargs={"vendor_email": self.vendor.email}), "allowed_roles": self.VENDOR_OR_ADMIN},
            {"name": "banking_courier_save", "method": "options", "path": reverse("v1:banking:courier_bank_save"), "allowed_roles": self.COURIER_OR_ADMIN},
            {"name": "banking_courier_update", "method": "options", "path": reverse("v1:banking:courier_bank_update", kwargs={"courier_email": self.courier.email}), "allowed_roles": self.COURIER_OR_ADMIN},
            {"name": "banking_courier_get", "method": "options", "path": reverse("v1:banking:courier_bank_get", kwargs={"courier_email": self.courier.email}), "allowed_roles": self.COURIER_OR_ADMIN},

            # complaints app
            {"name": "complaints_submit", "method": "options", "path": reverse("v1:complaints:complaint_submit"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "complaints_update", "method": "options", "path": reverse("v1:complaints:complaint_update", kwargs={"complaint_id": self.complaint.id}), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "complaints_customer", "method": "options", "path": reverse("v1:complaints:customer_complaints", kwargs={"customer_email": self.customer.email}), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "complaints_all", "method": "options", "path": reverse("v1:complaints:all_complaints"), "allowed_roles": self.ADMIN_ROLES},

            # geolocation app
            {"name": "geolocation_api_calculate", "method": "options", "path": reverse("v1:geolocation:api_calculate_distance"), "allowed_roles": self.ALL_ROLES},

            # order app
            {"name": "order_list", "method": "options", "path": reverse("v1:order:order_list"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "order_create", "method": "options", "path": reverse("v1:order:order_create"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "order_create_mobile", "method": "options", "path": reverse("v1:order:order_create_mobile"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "order_detail", "method": "options", "path": reverse("v1:order:order_detail", kwargs={"order_id": self.order.id}), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "order_status_update", "method": "options", "path": reverse("v1:order:order_status_update", kwargs={"order_id": self.order.id}), "allowed_roles": self.VENDOR_OR_ADMIN},
            {"name": "payment_register", "method": "options", "path": reverse("v1:order:payment_register"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "payment_context", "method": "options", "path": reverse("v1:order:payment_context", kwargs={"reference": "RBAC-PAY-REF"}), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "payment_internal_sync", "method": "post", "path": reverse("v1:order:payment_internal_sync", kwargs={"reference": "RBAC-PAY-REF"}), "allowed_roles": set()},
            {"name": "shipping_addresses", "method": "options", "path": reverse("v1:order:shipping_addresses"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "vendor_orders", "method": "options", "path": reverse("v1:order:vendor_orders"), "allowed_roles": self.VENDOR_OR_ADMIN},
            {"name": "courier_orders", "method": "options", "path": reverse("v1:order:courier_orders"), "allowed_roles": self.COURIER_OR_ADMIN},
            {"name": "order_stats", "method": "options", "path": reverse("v1:order:order_stats"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "order_legacy_create", "method": "options", "path": reverse("v1:order:order_create_legacy"), "allowed_roles": self.AUTHENTICATED_ROLES},

            # product app
            {"name": "product_list", "method": "options", "path": reverse("v1:product:product_list"), "allowed_roles": self.ALL_ROLES},
            {"name": "product_detail", "method": "options", "path": reverse("v1:product:product_detail", kwargs={"product_id": self.product.id}), "allowed_roles": self.ALL_ROLES},
            {"name": "product_create", "method": "options", "path": reverse("v1:product:product_create"), "allowed_roles": self.VENDOR_OR_ADMIN},
            {"name": "product_create_mobile", "method": "options", "path": reverse("v1:product:product_create_mobile"), "allowed_roles": self.VENDOR_OR_ADMIN},
            {"name": "product_temp_list", "method": "options", "path": reverse("v1:product:temp_product_list"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "product_approval", "method": "options", "path": reverse("v1:product:product_approval", kwargs={"temp_product_id": self.product.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "product_moderate", "method": "options", "path": reverse("v1:product:product_moderate", kwargs={"temp_product_id": self.product.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "vendor_products", "method": "options", "path": reverse("v1:product:vendor_products"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "product_update", "method": "options", "path": reverse("v1:product:product_update", kwargs={"product_id": self.product.id}), "allowed_roles": self.VENDOR_OR_ADMIN},
            {"name": "product_update_mobile", "method": "options", "path": reverse("v1:product:product_update_mobile", kwargs={"product_id": self.product.id}), "allowed_roles": self.VENDOR_OR_ADMIN},
            {"name": "category_list", "method": "options", "path": reverse("v1:product:category_list"), "allowed_roles": self.ALL_ROLES},
            {"name": "category_create", "method": "options", "path": reverse("v1:product:category_create"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "inventory_status", "method": "options", "path": reverse("v1:product:inventory_status"), "allowed_roles": self.VENDOR_OR_ADMIN},
            {"name": "product_upload_legacy", "method": "options", "path": reverse("v1:product:product_upload_legacy"), "allowed_roles": self.VENDOR_OR_ADMIN},
            {"name": "product_approve_legacy", "method": "options", "path": reverse("v1:product:product_approve_legacy"), "allowed_roles": self.ADMIN_ROLES},

            # dispatch app
            {"name": "dispatch_list", "method": "options", "path": reverse("v1:dispatch:dispatch_list"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "dispatch_create", "method": "options", "path": reverse("v1:dispatch:dispatch_create"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "dispatch_detail", "method": "options", "path": reverse("v1:dispatch:dispatch_detail", kwargs={"dispatch_id": self.dispatch.id}), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "dispatch_assign", "method": "options", "path": reverse("v1:dispatch:dispatch_assign", kwargs={"dispatch_id": self.dispatch.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "dispatch_status_update", "method": "options", "path": reverse("v1:dispatch:dispatch_status_update", kwargs={"dispatch_id": self.dispatch.id}), "allowed_roles": self.COURIER_OR_ADMIN},
            {"name": "dispatch_optimize_route", "method": "options", "path": reverse("v1:dispatch:dispatch_optimize_route", kwargs={"dispatch_id": self.dispatch.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "dispatch_ready_orders", "method": "options", "path": reverse("v1:dispatch:ready_orders"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "dispatch_vendor_items", "method": "options", "path": reverse("v1:dispatch:vendor_dispatch_items"), "allowed_roles": self.VENDOR_ONLY},
            {"name": "dispatch_item_update", "method": "options", "path": reverse("v1:dispatch:dispatch_item_update", kwargs={"item_id": self.dispatch_item.id}), "allowed_roles": self.VENDOR_OR_ADMIN},
            {"name": "dispatch_courier_location", "method": "options", "path": reverse("v1:dispatch:courier_location_update"), "allowed_roles": self.COURIER_OR_ADMIN},
            {"name": "dispatch_stats", "method": "options", "path": reverse("v1:dispatch:dispatch_stats"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "dispatch_legacy_ready", "method": "options", "path": reverse("v1:dispatch:legacy_ready_orders"), "allowed_roles": self.ADMIN_ROLES},

            # email_service app
            {"name": "email_send_test", "method": "options", "path": reverse("v1:email:send_test_email"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "email_templates", "method": "options", "path": reverse("v1:email:email_templates"), "allowed_roles": self.ADMIN_ROLES},

            # messaging app
            {"name": "messaging_templates", "method": "options", "path": reverse("v1:messaging:template_list"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "messaging_template_detail", "method": "options", "path": reverse("v1:messaging:template_detail", kwargs={"template_id": self.template_id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "messaging_template_preview", "method": "options", "path": reverse("v1:messaging:template_preview", kwargs={"template_id": self.template_id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "messaging_emails", "method": "options", "path": reverse("v1:messaging:email_list"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "messaging_send_confirmation", "method": "options", "path": reverse("v1:messaging:send_order_confirmation", kwargs={"order_id": self.order.id}), "allowed_roles": self.ADMIN_ROLES},
            {"name": "messaging_bulk_email", "method": "options", "path": reverse("v1:messaging:bulk_email"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "messaging_notifications", "method": "options", "path": reverse("v1:messaging:notification_list"), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "messaging_notification_detail", "method": "options", "path": reverse("v1:messaging:notification_detail", kwargs={"notification_id": self.notification_id}), "allowed_roles": self.AUTHENTICATED_ROLES},
            {"name": "messaging_smtp_settings", "method": "options", "path": reverse("v1:messaging:smtp_settings"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "messaging_stats", "method": "options", "path": reverse("v1:messaging:email_stats"), "allowed_roles": self.ADMIN_ROLES},
            {"name": "messaging_legacy_send", "method": "options", "path": reverse("v1:messaging:legacy_send_email"), "allowed_roles": self.ADMIN_ROLES},
        ]

        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint["name"]):
                self._assert_endpoint_access(endpoint)