from django.db import migrations
from django.utils.text import slugify


def _map_temp_status(temp_status):
    if temp_status == 'approved':
        return 'approved'
    if temp_status == 'rejected':
        return 'rejected'
    if temp_status == 'requires_changes':
        return 'changes_requested'
    return 'pending'


def _unique_slug(Product, base_slug):
    slug = base_slug or 'product'
    candidate = slug
    counter = 2
    while Product.objects.filter(slug=candidate).exists():
        candidate = f"{slug}-{counter}"
        counter += 1
    return candidate


def _unique_sku(Product, raw_sku, temp_id):
    base = raw_sku or f"TMP-PROD-{temp_id}"
    candidate = base
    counter = 2
    while Product.objects.filter(sku=candidate).exists():
        candidate = f"{base}-{counter}"
        counter += 1
    return candidate


def backfill_temp_products_to_primary(apps, schema_editor):
    Product = apps.get_model('product', 'Product')
    TempProduct = apps.get_model('product', 'TempProduct')

    for temp_product in TempProduct.objects.all().iterator():
        existing = Product.objects.filter(vendor_id=temp_product.vendor_id, sku=temp_product.sku).first()
        mapped_status = _map_temp_status(temp_product.status)

        if existing:
            updates = []
            if existing.approval_status == 'pending' and mapped_status in ['approved', 'rejected', 'changes_requested']:
                existing.approval_status = mapped_status
                updates.append('approval_status')
            if mapped_status != 'pending' and not existing.reviewed_at and temp_product.updated_at:
                existing.reviewed_at = temp_product.updated_at
                updates.append('reviewed_at')
            if not existing.submitted_at and temp_product.created_at:
                existing.submitted_at = temp_product.created_at
                updates.append('submitted_at')
            if not existing.rejection_reason and temp_product.rejection_reason:
                existing.rejection_reason = temp_product.rejection_reason
                updates.append('rejection_reason')
            if updates:
                existing.save(update_fields=list(set(updates)))
            continue

        name_slug = slugify(temp_product.name)[:180] or f"product-{temp_product.id}"
        slug = _unique_slug(Product, name_slug)
        sku = _unique_sku(Product, temp_product.sku, temp_product.id)

        Product.objects.create(
            vendor_id=temp_product.vendor_id,
            name=temp_product.name,
            description=temp_product.description,
            model=temp_product.model,
            brand=temp_product.brand,
            category_id=temp_product.category_id,
            price=temp_product.price,
            quantity=temp_product.quantity,
            discount_percentage=temp_product.discount_percentage,
            main_image=temp_product.image,
            image_url=temp_product.image_url,
            sku=sku,
            weight=temp_product.weight,
            dimensions=temp_product.dimensions,
            slug=slug,
            status='active' if mapped_status == 'approved' else 'archived',
            approval_status=mapped_status,
            rejection_reason=temp_product.rejection_reason,
            submitted_at=temp_product.created_at,
            reviewed_at=temp_product.updated_at if mapped_status != 'pending' else None,
            approved_by=None,
            approved_at=temp_product.updated_at if mapped_status == 'approved' else None,
            created_at=temp_product.created_at,
            updated_at=temp_product.updated_at,
            published_at=temp_product.updated_at if mapped_status == 'approved' else None,
        )


def noop_reverse(apps, schema_editor):
    # Intentional no-op reverse: this migration only backfills missing primary rows.
    return


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0002_product_approval_status_product_rejection_reason_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_temp_products_to_primary, noop_reverse),
    ]
