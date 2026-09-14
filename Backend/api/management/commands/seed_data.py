# api/management/commands/seed_data.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime
from api.models import (
    User, Property, PropertyAmenity, Unit, UnitAmenity,
    Lease, MaintenanceRequest, Payment
)


class Command(BaseCommand):
    help = 'Seed the database with sample data (use --force to overwrite existing data)'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Force re-seed even if data exists')

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        if User.objects.exists() and not options['force']:
            self.stdout.write(self.style.WARNING("Database already has data. Use --force to re-seed."))
            return

        if options['force']:
            self.stdout.write("Clearing existing data...")
            MaintenanceRequest.objects.all().delete()
            Payment.objects.all().delete()
            Lease.objects.all().delete()
            UnitAmenity.objects.all().delete()
            Unit.objects.all().delete()
            PropertyAmenity.objects.all().delete()
            Property.objects.all().delete()
            User.objects.all().delete()

        # Users (passwords default to 'password123' for all seeded accounts)
        users = [
            User(uid="admin_001", email="admin@example.com", first_name="System",
                 last_name="Admin", phone="+254700000000", role="admin",
                 password_hash="password123"),
            User(uid="staff_001", email="staff@example.com", first_name="Staff",
                 last_name="Member", phone="+254711111111", role="staff",
                 password_hash="password123"),
            User(uid="tenant_001", email="tenant@example.com", first_name="John",
                 last_name="Doe", phone="+254722222222", role="tenant",
                 apartment="Unit 4B", house_number="123",
                 password_hash="password123"),
            User(uid="tenant_002", email="jane@example.com", first_name="Jane",
                 last_name="Smith", phone="+254733333333", role="tenant",
                 apartment="Unit 2A", house_number="456",
                 password_hash="password123"),
        ]
        User.objects.bulk_create(users)

        # Properties
        prop1 = Property(id="prop_001", name="Sunrise Apartments",
                         address="123 Main Street, Westlands", city="Nairobi",
                         state="Nairobi", zip_code="00100", type="apartment",
                         total_units=10, description="Modern apartment complex")
        prop2 = Property(id="prop_002", name="Green Valley Houses",
                         address="456 Riverside Drive, Karen", city="Nairobi",
                         state="Nairobi", zip_code="00500", type="house",
                         total_units=4, description="Spacious family homes")
        Property.objects.bulk_create([prop1, prop2])

        # Property Amenities
        amenities = [
            PropertyAmenity(property=prop1, amenity="Swimming Pool"),
            PropertyAmenity(property=prop1, amenity="Gym"),
            PropertyAmenity(property=prop1, amenity="24/7 Security"),
            PropertyAmenity(property=prop1, amenity="Parking"),
            PropertyAmenity(property=prop2, amenity="Garden"),
            PropertyAmenity(property=prop2, amenity="Parking (2 cars)"),
            PropertyAmenity(property=prop2, amenity="Security"),
            PropertyAmenity(property=prop2, amenity="Maid's Quarters"),
        ]
        PropertyAmenity.objects.bulk_create(amenities)

        # Units
        units = [
            Unit(id="unit_001", property=prop1, unit_number="4B", type="apartment",
                 bedrooms=2, bathrooms=1.5, square_feet=850, rent_amount=35000, status="occupied"),
            Unit(id="unit_002", property=prop1, unit_number="2A", type="apartment",
                 bedrooms=1, bathrooms=1, square_feet=550, rent_amount=22000, status="occupied"),
            Unit(id="unit_003", property=prop1, unit_number="3C", type="apartment",
                 bedrooms=2, bathrooms=2, square_feet=900, rent_amount=38000, status="vacant"),
            Unit(id="unit_004", property=prop2, unit_number="H1", type="house",
                 bedrooms=4, bathrooms=3, square_feet=2200, rent_amount=85000, status="vacant"),
        ]
        Unit.objects.bulk_create(units)

        unit1 = units[0]
        unit4 = units[3]

        # Unit Amenities
        unit_amenities = [
            UnitAmenity(unit=unit1, amenity="Balcony"),
            UnitAmenity(unit=unit1, amenity="Air Conditioning"),
            UnitAmenity(unit=unit4, amenity="Garden"),
            UnitAmenity(unit=unit4, amenity="Garage"),
        ]
        UnitAmenity.objects.bulk_create(unit_amenities)

        # Leases
        tenant1 = User.objects.get(uid="tenant_001")
        tenant2 = User.objects.get(uid="tenant_002")

        Lease.objects.bulk_create([
            Lease(id="lease_001", tenant=tenant1, unit=unit1,
                  start_date="2025-01-01", end_date="2025-12-31",
                  rent_amount=35000, security_deposit=70000, payment_due_day=1),
            Lease(id="lease_002", tenant=tenant2, unit=units[1],
                  start_date="2025-03-01", end_date="2026-02-28",
                  rent_amount=22000, security_deposit=44000, payment_due_day=1),
        ])

        # Payments
        Payment.objects.bulk_create([
            Payment(id="pay_001", tenant=tenant1, amount=35000,
                    payment_method="mpesa", reference="MPESA-001", status="paid",
                    paid_at=timezone.make_aware(datetime(2025, 1, 5, 10, 30, 0))),
            Payment(id="pay_002", tenant=tenant1, amount=35000,
                    payment_method="mpesa", reference="MPESA-002", status="paid",
                    paid_at=timezone.make_aware(datetime(2025, 2, 4, 14, 20, 0))),
            Payment(id="pay_003", tenant=tenant2, amount=22000,
                    payment_method="bank_transfer", reference="BANK-001", status="paid",
                    paid_at=timezone.make_aware(datetime(2025, 3, 5, 9, 0, 0))),
            Payment(id="pay_004", tenant=tenant2, amount=22000,
                    payment_method="bank_transfer", reference="BANK-002", status="pending"),
        ])

        # Maintenance Requests
        MaintenanceRequest.objects.bulk_create([
            MaintenanceRequest(id="maint_001", unit=unit1, user=tenant1,
                               issue="Leaky faucet", description="Kitchen faucet drips constantly",
                               urgency="medium", status="pending"),
            MaintenanceRequest(id="maint_002", unit=units[1], user=tenant2,
                               issue="Broken window", description="Living room window won't close",
                               urgency="high", status="in_progress"),
        ])

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
        self.stdout.write(f"  Users:          {User.objects.count()}")
        self.stdout.write(f"  Properties:     {Property.objects.count()}")
        self.stdout.write(f"  Units:          {Unit.objects.count()}")
        self.stdout.write(f"  Leases:         {Lease.objects.count()}")
        self.stdout.write(f"  Payments:       {Payment.objects.count()}")
        self.stdout.write(f"  Maintenance:    {MaintenanceRequest.objects.count()}")
