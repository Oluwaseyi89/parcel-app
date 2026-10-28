import logging

from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    """Render every API error in the standard envelope.

    Shape: {"status": "error", "message": "<human readable>", "errors": {...}}
    "errors" is only present for validation failures and maps field -> messages.
    """
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception. Let Django's debug page show it in development.
        if settings.DEBUG:
            return None
        logger.exception("Unhandled API exception", exc_info=exc)
        return Response(
            {"status": "error", "message": "An unexpected error occurred."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(exc, ValidationError):
        errors = response.data if isinstance(response.data, dict) else {"non_field_errors": response.data}
        response.data = {
            "status": "error",
            "message": _first_message(errors) or "Invalid input.",
            "errors": errors,
        }
    else:
        detail = response.data.get("detail") if isinstance(response.data, dict) else response.data
        response.data = {
            "status": "error",
            "message": str(detail) if detail else "Request failed.",
        }

    return response


def _first_message(errors):
    """Depth-first search for the first error string, for a top-level summary message."""
    if isinstance(errors, dict):
        for value in errors.values():
            message = _first_message(value)
            if message:
                return message
    elif isinstance(errors, list):
        for value in errors:
            message = _first_message(value)
            if message:
                return message
    elif errors:
        return str(errors)
    return None
