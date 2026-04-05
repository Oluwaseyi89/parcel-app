from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError

from authentication.models import CourierUser, VendorUser
from product.models import Product


class Command(BaseCommand):
    help = (
        "Copy legacy local media files into the active Django storage backend "
        "(for example, S3 when USE_S3=True)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--local-media-root",
            type=str,
            default="",
            help="Absolute path to legacy local media root. Defaults to <BASE_DIR>/media.",
        )
        parser.add_argument(
            "--only",
            nargs="+",
            choices=["vendor", "courier", "product"],
            default=["vendor", "courier", "product"],
            help="Select which model groups to backfill.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Optional max number of records to process per selected group.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview what would be copied without writing to storage or DB.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Re-upload even when the target file already exists in storage.",
        )

    def handle(self, *args, **options):
        local_media_root = options["local_media_root"]
        dry_run = options["dry_run"]
        force = options["force"]
        selected_groups = set(options["only"])
        limit = options["limit"]

        root_path = Path(local_media_root).expanduser() if local_media_root else Path(settings.BASE_DIR) / "media"
        if not root_path.exists() or not root_path.is_dir():
            raise CommandError(f"Local media root not found or not a directory: {root_path}")

        self.stdout.write(self.style.NOTICE(f"Using local media root: {root_path}"))
        self.stdout.write(self.style.NOTICE(f"Dry run: {dry_run}"))

        targets = []
        if "vendor" in selected_groups:
            targets.append(("vendor", VendorUser.objects.order_by("id"), "photo"))
        if "courier" in selected_groups:
            targets.append(("courier", CourierUser.objects.order_by("id"), "photo"))
        if "product" in selected_groups:
            targets.append(("product", Product.objects.order_by("id"), "main_image"))

        total_stats = {
            "processed": 0,
            "copied": 0,
            "would_copy": 0,
            "skipped_empty": 0,
            "skipped_missing_local": 0,
            "skipped_existing_remote": 0,
            "skipped_external_url": 0,
            "errors": 0,
        }

        for label, queryset, field_name in targets:
            self.stdout.write(self.style.NOTICE(f"\nProcessing group: {label}"))

            stats = self._process_group(
                queryset=queryset,
                field_name=field_name,
                local_root=root_path,
                dry_run=dry_run,
                force=force,
                limit=limit,
            )

            for key, value in stats.items():
                total_stats[key] += value

            self.stdout.write(
                " ".join(
                    [
                        f"processed={stats['processed']}",
                        f"copied={stats['copied']}",
                        f"would_copy={stats['would_copy']}",
                        f"skipped_empty={stats['skipped_empty']}",
                        f"skipped_missing_local={stats['skipped_missing_local']}",
                        f"skipped_existing_remote={stats['skipped_existing_remote']}",
                        f"skipped_external_url={stats['skipped_external_url']}",
                        f"errors={stats['errors']}",
                    ]
                )
            )

        self.stdout.write(self.style.NOTICE("\nSummary:"))
        self.stdout.write(
            " ".join(
                [
                    f"processed={total_stats['processed']}",
                    f"copied={total_stats['copied']}",
                    f"would_copy={total_stats['would_copy']}",
                    f"skipped_empty={total_stats['skipped_empty']}",
                    f"skipped_missing_local={total_stats['skipped_missing_local']}",
                    f"skipped_existing_remote={total_stats['skipped_existing_remote']}",
                    f"skipped_external_url={total_stats['skipped_external_url']}",
                    f"errors={total_stats['errors']}",
                ]
            )
        )

        if total_stats["errors"]:
            raise CommandError("Completed with errors. See output above.")

        self.stdout.write(self.style.SUCCESS("Backfill completed."))

    def _process_group(self, queryset, field_name, local_root, dry_run, force, limit):
        stats = {
            "processed": 0,
            "copied": 0,
            "would_copy": 0,
            "skipped_empty": 0,
            "skipped_missing_local": 0,
            "skipped_existing_remote": 0,
            "skipped_external_url": 0,
            "errors": 0,
        }

        if limit and limit > 0:
            queryset = queryset[:limit]

        for obj in queryset.iterator():
            stats["processed"] += 1

            file_field = getattr(obj, field_name, None)
            if not file_field or not getattr(file_field, "name", ""):
                stats["skipped_empty"] += 1
                continue

            file_name = file_field.name

            if file_name.startswith("http://") or file_name.startswith("https://"):
                stats["skipped_external_url"] += 1
                continue

            local_file_path = local_root / file_name
            if not local_file_path.exists():
                stats["skipped_missing_local"] += 1
                self.stderr.write(
                    f"Missing local file for {obj.__class__.__name__}(id={obj.id}): {local_file_path}"
                )
                continue

            try:
                remote_exists = file_field.storage.exists(file_name)
            except Exception as exc:
                stats["errors"] += 1
                self.stderr.write(
                    f"Storage check failed for {obj.__class__.__name__}(id={obj.id}, file={file_name}): {exc}"
                )
                continue

            if remote_exists and not force:
                stats["skipped_existing_remote"] += 1
                continue

            if dry_run:
                stats["would_copy"] += 1
                continue

            try:
                if remote_exists and force:
                    file_field.storage.delete(file_name)

                with local_file_path.open("rb") as fh:
                    file_field.save(file_name, File(fh), save=False)

                obj.save(update_fields=[field_name])
                stats["copied"] += 1
            except Exception as exc:
                stats["errors"] += 1
                self.stderr.write(
                    f"Copy failed for {obj.__class__.__name__}(id={obj.id}, file={file_name}): {exc}"
                )

        return stats
