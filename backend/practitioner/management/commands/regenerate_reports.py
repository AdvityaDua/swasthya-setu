from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db import transaction

from core.models import DiagnosticReport, AIInferenceResult
from ai.report_generator import generate_report


class Command(BaseCommand):
    help = 'Regenerate missing DiagnosticReport PDF files for tests.'

    def handle(self, *args, **options):
        reports = DiagnosticReport.objects.all()
        if not reports.exists():
            self.stdout.write(self.style.NOTICE('No DiagnosticReport objects found.'))
            return

        for report in reports:
            try:
                name = report.report_pdf.name if report.report_pdf else None
                exists = False
                if name:
                    try:
                        exists = report.report_pdf.storage.exists(name)
                    except Exception:
                        exists = False

                if exists:
                    self.stdout.write(self.style.SUCCESS(f'Report exists for test {report.test.id}: {name}'))
                    continue

                # Attempt to find AIInferenceResult for the test
                try:
                    ai_result = report.test.aiinferenceresult
                except AIInferenceResult.DoesNotExist:
                    ai_result = None

                if not ai_result:
                    self.stdout.write(self.style.WARNING(f'No AIInferenceResult for test {report.test.id}, skipping'))
                    continue

                # Generate PDF
                self.stdout.write(f'Generating PDF for test {report.test.id}...')
                pdf = generate_report(report.test, ai_result)

                with transaction.atomic():
                    report.report_pdf.save(f'report_{report.test.id}.pdf', pdf, save=True)
                    report.save()

                self.stdout.write(self.style.SUCCESS(f'Regenerated report for test {report.test.id}'))
            except Exception as e:
                self.stderr.write(f'Failed to regenerate report for test {report.test.id}: {e}')
