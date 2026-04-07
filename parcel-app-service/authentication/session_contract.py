from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Literal

from django.conf import settings
from django.http import HttpResponse

SessionRole = Literal["customer", "vendor", "courier", "admin"]

AUTH_SESSION_COOKIE = "auth_session"
LEGACY_ADMIN_SESSION_COOKIE = "admin_session"

ROLE_MARKER_COOKIES: Dict[SessionRole, str] = {
    "customer": "logcus",
    "vendor": "logvend",
    "courier": "logcour",
    "admin": "logadmin",
}


@dataclass(frozen=True)
class SessionContract:
    session_cookie_name: str = AUTH_SESSION_COOKIE
    max_age_seconds: int = 8 * 60 * 60


def _cookie_kwargs(max_age: int | None = None, http_only: bool = True) -> dict:
    return {
        "max_age": max_age,
        "httponly": http_only,
        "secure": not settings.DEBUG,
        "samesite": "Lax",
        "path": "/",
    }


def attach_session_cookies(response: HttpResponse, *, session_token: str, role: SessionRole) -> HttpResponse:
    response.set_cookie(AUTH_SESSION_COOKIE, session_token, **_cookie_kwargs(max_age=SessionContract().max_age_seconds))

    # Keep legacy admin cookie for backward compatibility.
    if role == "admin":
        response.set_cookie(
            LEGACY_ADMIN_SESSION_COOKIE,
            session_token,
            **_cookie_kwargs(max_age=SessionContract().max_age_seconds),
        )

    for marker_role, marker_cookie in ROLE_MARKER_COOKIES.items():
        if marker_role == role:
            response.set_cookie(marker_cookie, "1", **_cookie_kwargs(max_age=SessionContract().max_age_seconds, http_only=False))
        else:
            response.delete_cookie(marker_cookie, path="/")

    return response


def clear_session_cookies(response: HttpResponse) -> HttpResponse:
    response.delete_cookie(AUTH_SESSION_COOKIE, path="/")
    response.delete_cookie(LEGACY_ADMIN_SESSION_COOKIE, path="/")

    for marker_cookie in ROLE_MARKER_COOKIES.values():
        response.delete_cookie(marker_cookie, path="/")

    return response
