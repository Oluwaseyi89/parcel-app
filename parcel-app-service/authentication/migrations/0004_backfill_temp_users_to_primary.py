from django.db import migrations


def _map_temp_status(temp_status):
    if temp_status == 'approved':
        return 'approved'
    if temp_status == 'rejected':
        return 'rejected'
    return 'pending'


def backfill_temp_users_to_primary(apps, schema_editor):
    VendorUser = apps.get_model('authentication', 'VendorUser')
    TempVendorUser = apps.get_model('authentication', 'TempVendorUser')
    CourierUser = apps.get_model('authentication', 'CourierUser')
    TempCourierUser = apps.get_model('authentication', 'TempCourierUser')

    # Backfill vendors from TempVendorUser into VendorUser if missing.
    for temp_vendor in TempVendorUser.objects.all().iterator():
        existing = VendorUser.objects.filter(email=temp_vendor.email).first()
        mapped_status = _map_temp_status(getattr(temp_vendor, 'status', 'pending'))

        if existing:
            updates = []
            if not existing.submitted_at and temp_vendor.created_at:
                existing.submitted_at = temp_vendor.created_at
                updates.append('submitted_at')
            if mapped_status != 'pending' and not existing.reviewed_at and temp_vendor.updated_at:
                existing.reviewed_at = temp_vendor.updated_at
                updates.append('reviewed_at')
            if not existing.is_email_verified and temp_vendor.is_email_verified:
                existing.is_email_verified = True
                updates.append('is_email_verified')
            if existing.approval_status == 'pending' and mapped_status in ['approved', 'rejected']:
                existing.approval_status = mapped_status
                existing.is_approved = mapped_status == 'approved'
                existing.status = 'active' if mapped_status == 'approved' else 'inactive'
                updates.extend(['approval_status', 'is_approved', 'status'])
            if updates:
                existing.save(update_fields=list(set(updates)))
            continue

        VendorUser.objects.create(
            email=temp_vendor.email,
            password=temp_vendor.password,
            is_active=temp_vendor.is_active,
            is_email_verified=temp_vendor.is_email_verified,
            created_at=temp_vendor.created_at,
            updated_at=temp_vendor.updated_at,
            last_login=temp_vendor.last_login,
            first_name=temp_vendor.first_name,
            last_name=temp_vendor.last_name,
            phone=temp_vendor.phone,
            business_name=temp_vendor.business_name,
            business_country=temp_vendor.business_country,
            business_state=temp_vendor.business_state,
            business_street=temp_vendor.business_street,
            business_category=temp_vendor.business_category,
            cac_reg_no=temp_vendor.cac_reg_no,
            nin=temp_vendor.nin,
            photo=temp_vendor.photo,
            role='vendor',
            is_approved=mapped_status == 'approved',
            approval_status=mapped_status,
            rejection_reason=getattr(temp_vendor, 'rejection_reason', ''),
            submitted_at=temp_vendor.created_at,
            reviewed_at=temp_vendor.updated_at if mapped_status != 'pending' else None,
            approved_by=temp_vendor.approved_by,
            approved_at=temp_vendor.approved_at,
            status='active' if mapped_status == 'approved' else 'inactive',
        )

    # Backfill couriers from TempCourierUser into CourierUser if missing.
    for temp_courier in TempCourierUser.objects.all().iterator():
        existing = CourierUser.objects.filter(email=temp_courier.email).first()
        mapped_status = _map_temp_status(getattr(temp_courier, 'status', 'pending'))

        if existing:
            updates = []
            if not existing.submitted_at and temp_courier.created_at:
                existing.submitted_at = temp_courier.created_at
                updates.append('submitted_at')
            if mapped_status != 'pending' and not existing.reviewed_at and temp_courier.updated_at:
                existing.reviewed_at = temp_courier.updated_at
                updates.append('reviewed_at')
            if not existing.is_email_verified and temp_courier.is_email_verified:
                existing.is_email_verified = True
                updates.append('is_email_verified')
            if existing.approval_status == 'pending' and mapped_status in ['approved', 'rejected']:
                existing.approval_status = mapped_status
                existing.is_approved = mapped_status == 'approved'
                existing.status = 'active' if mapped_status == 'approved' else 'inactive'
                updates.extend(['approval_status', 'is_approved', 'status'])
            if updates:
                existing.save(update_fields=list(set(updates)))
            continue

        CourierUser.objects.create(
            email=temp_courier.email,
            password=temp_courier.password,
            is_active=temp_courier.is_active,
            is_email_verified=temp_courier.is_email_verified,
            created_at=temp_courier.created_at,
            updated_at=temp_courier.updated_at,
            last_login=temp_courier.last_login,
            first_name=temp_courier.first_name,
            last_name=temp_courier.last_name,
            phone=temp_courier.phone,
            business_country=temp_courier.business_country,
            business_state=temp_courier.business_state,
            business_street=temp_courier.business_street,
            cac_reg_no=temp_courier.cac_reg_no,
            nin=temp_courier.nin,
            photo=temp_courier.photo,
            role='courier',
            is_approved=mapped_status == 'approved',
            approval_status=mapped_status,
            rejection_reason=getattr(temp_courier, 'rejection_reason', ''),
            submitted_at=temp_courier.created_at,
            reviewed_at=temp_courier.updated_at if mapped_status != 'pending' else None,
            approved_by=temp_courier.approved_by,
            approved_at=temp_courier.approved_at,
            vehicle_type=temp_courier.vehicle_type,
            vehicle_registration=temp_courier.vehicle_registration,
            service_area=temp_courier.service_area,
            status='active' if mapped_status == 'approved' else 'inactive',
        )


def noop_reverse(apps, schema_editor):
    # Intentional no-op reverse: this migration only backfills missing primary rows.
    return


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_courieruser_approval_status_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_temp_users_to_primary, noop_reverse),
    ]
