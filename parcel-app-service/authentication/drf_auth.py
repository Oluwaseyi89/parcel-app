from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

from .models import UserSession


class SessionTokenAuthentication(authentication.BaseAuthentication):
    """Authenticate users using a shared session token across user models."""

    def authenticate(self, request):
        token = self._extract_session_token(request)
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

        return (user, session)

    def _extract_session_token(self, request):
        auth_header = authentication.get_authorization_header(request).decode("utf-8").strip()
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() in {"token", "bearer", "session"}:
                return parts[1]
            # Backward compatibility for raw token in Authorization header
            if len(parts) == 1:
                return parts[0]

        header_token = request.headers.get("X-Session-Token")
        if header_token:
            return header_token.strip()

        cookie_token = (
            request.COOKIES.get("auth_session")
            or request.COOKIES.get("admin_session")
            or request.COOKIES.get("session_token")
        )
        if cookie_token:
            return cookie_token.strip()

        return None
