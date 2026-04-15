from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from django.middleware.csrf import CsrfViewMiddleware

from .models import UserSession


EXPLICIT_CSRF_EXEMPT_URL_NAMES = {
    "active_sessions",
    "mobile_admin_login",
    "customer_register_mobile",
    "customer_login_mobile",
    "customer_profile_mobile",
    "customer_password_reset_mobile",
    "vendor_register_mobile",
    "vendor_login_mobile",
    "courier_register_mobile",
    "courier_login_mobile",
    "order_create_mobile",
    "product_create_mobile",
    "product_update_mobile",
}


class CSRFCheck(CsrfViewMiddleware):
    def _reject(self, request, reason):
        return reason


class SessionTokenAuthentication(authentication.BaseAuthentication):
    """Authenticate users using a shared session token across user models."""

    def authenticate(self, request):
        token, source = self._extract_session_token(request)
        if not token:
            return None

        try:
            session = UserSession.objects.get(session_token=token, is_active=True)
        except UserSession.DoesNotExist:
            raise AuthenticationFailed("Invalid session token.")

        if session.is_expired():
            session.invalidate()
            raise AuthenticationFailed("Session token has expired.")

        user = session.user
        if user is None:
            session.invalidate()
            raise AuthenticationFailed("Session user could not be resolved.")

        if hasattr(user, "is_active") and not user.is_active:
            session.invalidate()
            raise AuthenticationFailed("User account is inactive.")

        # Enforce CSRF only for cookie-authenticated unsafe methods, except for
        # routes explicitly declared csrf_exempt in the URLconf for mobile/API
        # compatibility.
        if (
            source == "cookie"
            and request.method not in {"GET", "HEAD", "OPTIONS", "TRACE"}
            and not self._is_explicitly_csrf_exempt(request)
        ):
            self.enforce_csrf(request)

        return (user, session)

    def enforce_csrf(self, request):
        check = CSRFCheck(lambda req: None)
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise AuthenticationFailed(f"CSRF Failed: {reason}")

    def _is_explicitly_csrf_exempt(self, request):
        raw_request = getattr(request, "_request", request)
        resolver_match = getattr(raw_request, "resolver_match", None)
        if not resolver_match:
            return False
        return resolver_match.url_name in EXPLICIT_CSRF_EXEMPT_URL_NAMES

    def _extract_session_token(self, request):
        auth_header = authentication.get_authorization_header(request).decode("utf-8").strip()
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() in {"token", "bearer", "session"}:
                return parts[1], "header"
            # Backward compatibility for raw token in Authorization header
            if len(parts) == 1:
                return parts[0], "header"

        header_token = request.headers.get("X-Session-Token")
        if header_token:
            return header_token.strip(), "header"

        cookie_token = (
            request.COOKIES.get("auth_session")
            or request.COOKIES.get("admin_session")
            or request.COOKIES.get("session_token")
        )
        if cookie_token:
            return cookie_token.strip(), "cookie"

        return None, None
