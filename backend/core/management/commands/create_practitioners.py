from django.core.management.base import BaseCommand
from core.models import User, PractitionerProfile
from decimal import Decimal


class Command(BaseCommand):
    help = 'Create sample practitioners in the database'

    def handle(self, *args, **options):
        practitioners_data = [
            {
                'name': 'Dr. Rajesh Kumar',
                'phone': '9876543210',
                'email': 'rajesh.kumar@diagnostic.com',
                'designation': 'Senior Radiologist',
                'center_name': 'Apollo Diagnostic Center - Delhi',
                'center_location': 'Connaught Place, New Delhi, India',
                'experience_years': 12,
                'services_offered': ['TB', 'BREAST_CANCER'],
                'latitude': Decimal('28.6295'),
                'longitude': Decimal('77.1895'),
            },
            {
                'name': 'Dr. Priya Sharma',
                'phone': '9876543211',
                'email': 'priya.sharma@diagnostic.com',
                'designation': 'Pathologist',
                'center_name': 'Max Healthcare Diagnostic - Mumbai',
                'center_location': 'Bandra West, Mumbai, India',
                'experience_years': 8,
                'services_offered': ['TB', 'BREAST_CANCER'],
                'latitude': Decimal('19.0596'),
                'longitude': Decimal('72.8295'),
            },
            {
                'name': 'Dr. Amit Patel',
                'phone': '9876543212',
                'email': 'amit.patel@diagnostic.com',
                'designation': 'Chief Technologist',
                'center_name': 'Fortis Diagnostic Center - Bangalore',
                'center_location': 'Koramangala, Bangalore, India',
                'experience_years': 10,
                'services_offered': ['TB'],
                'latitude': Decimal('12.9352'),
                'longitude': Decimal('77.6245'),
            },
            {
                'name': 'Dr. Anjali Singh',
                'phone': '9876543213',
                'email': 'anjali.singh@diagnostic.com',
                'designation': 'Radiologic Technologist',
                'center_name': 'Care Diagnostic Center - Hyderabad',
                'center_location': 'HITEC City, Hyderabad, India',
                'experience_years': 7,
                'services_offered': ['BREAST_CANCER'],
                'latitude': Decimal('17.3850'),
                'longitude': Decimal('78.4867'),
            },
            {
                'name': 'Dr. Vikram Reddy',
                'phone': '9876543214',
                'email': 'vikram.reddy@diagnostic.com',
                'designation': 'Medical Imaging Specialist',
                'center_name': 'Manipal Diagnostic Center - Chennai',
                'center_location': 'Alwarpet, Chennai, India',
                'experience_years': 9,
                'services_offered': ['TB', 'BREAST_CANCER'],
                'latitude': Decimal('13.0029'),
                'longitude': Decimal('80.2545'),
            },
            {
                'name': 'Dr. Neha Desai',
                'phone': '9876543215',
                'email': 'neha.desai@diagnostic.com',
                'designation': 'Lab Director',
                'center_name': 'Narayana Diagnostic Center - Pune',
                'center_location': 'Viman Nagar, Pune, India',
                'experience_years': 11,
                'services_offered': ['TB'],
                'latitude': Decimal('18.5912'),
                'longitude': Decimal('73.9220'),
            },
        ]

        created_count = 0
        skipped_count = 0

        for practitioner in practitioners_data:
            # Check if user already exists
            if User.objects.filter(phone=practitioner['phone']).exists():
                self.stdout.write(
                    self.style.WARNING(f"Skipped: {practitioner['name']} (phone already exists)")
                )
                skipped_count += 1
                continue

            # Create user
            user = User.objects.create_user(
                phone=practitioner['phone'],
                password='TestPassword123!@#',
                full_name=practitioner['name'],
                email=practitioner['email'],
                role='PRACTITIONER',
            )

            # Create practitioner profile
            PractitionerProfile.objects.create(
                user=user,
                designation=practitioner['designation'],
                diagnostic_center_name=practitioner['center_name'],
                center_location=practitioner['center_location'],
                experience_years=practitioner['experience_years'],
                services_offered=practitioner['services_offered'],
                latitude=practitioner['latitude'],
                longitude=practitioner['longitude'],
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Created: {practitioner['name']} at {practitioner['center_name']}"
                )
            )
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✓ Successfully created {created_count} practitioners. Skipped {skipped_count}."
            )
        )
