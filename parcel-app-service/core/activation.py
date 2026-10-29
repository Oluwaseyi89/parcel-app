from django.http import HttpResponseRedirect
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

from core.frontend import frontend_url
from core.tokens import account_activation_token


def activate_from_email_link(model, uidb64, token, role, on_activate=None):
    """Verify an account from its emailed activation link, then redirect to the web app.

    Redirects to {FRONTEND_URL}/verify-email?status=<success|already-verified|invalid>&role=<role>.
    on_activate(user) may set extra fields before saving and must return their names.
    """
    try:
        user = model.objects.get(pk=force_str(urlsafe_base64_decode(uidb64)))
    except (TypeError, ValueError, OverflowError, model.DoesNotExist):
        user = None

    if user is None:
        status = 'invalid'
    elif user.is_email_verified:
        # The token hashes is_email_verified, so it no longer validates once used; a second
        # click on the same link should not look like an error.
        status = 'already-verified'
    elif not account_activation_token.check_token(user, token):
        status = 'invalid'
    else:
        user.is_email_verified = True
        update_fields = ['is_email_verified', *(on_activate(user) if on_activate else [])]
        user.save(update_fields=update_fields)
        status = 'success'

    return HttpResponseRedirect(frontend_url('/verify-email', status=status, role=role))
