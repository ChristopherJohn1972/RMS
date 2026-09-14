# api/models.py
from django.db import models


class User(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('tenant', 'Tenant'),
    ]

    uid = models.CharField(max_length=128, primary_key=True)
    account_id = models.CharField(max_length=16, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=128)
    last_name = models.CharField(max_length=128)
    phone = models.CharField(max_length=32, blank=True, null=True)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default='tenant')
    apartment = models.CharField(max_length=128, blank=True, null=True)
    house_number = models.CharField(max_length=64, blank=True, null=True)
    emergency_contact = models.CharField(max_length=255, blank=True, null=True)
    move_in_date = models.CharField(max_length=32, blank=True, null=True)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"


class Property(models.Model):
    TYPE_CHOICES = [
        ('apartment', 'Apartment'),
        ('house', 'House'),
        ('condo', 'Condo'),
        ('townhouse', 'Townhouse'),
        ('commercial', 'Commercial'),
        ('studio', 'Studio'),
        ('office', 'Office'),
        ('vehicle', 'Vehicle'),
        ('equipment', 'Equipment'),
    ]
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Maintenance'),
    ]

    id = models.CharField(max_length=128, primary_key=True)
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=512)
    city = models.CharField(max_length=128, db_index=True, blank=True, default='')
    state = models.CharField(max_length=128, blank=True, null=True)
    zip_code = models.CharField(max_length=32, blank=True, null=True)
    type = models.CharField(max_length=32, choices=TYPE_CHOICES, default='apartment')
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='available')
    total_units = models.IntegerField(default=1)
    year_built = models.IntegerField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    image_url = models.CharField(max_length=512, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'properties'
        ordering = ['name']

    def __str__(self):
        return self.name


class PropertyAmenity(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='amenities')
    amenity = models.CharField(max_length=128)

    class Meta:
        db_table = 'property_amenities'
        unique_together = ('property', 'amenity')

    def __str__(self):
        return f"{self.property.name} - {self.amenity}"


class Unit(models.Model):
    TYPE_CHOICES = [
        ('apartment', 'Apartment'),
        ('house', 'House'),
        ('condo', 'Condo'),
        ('townhouse', 'Townhouse'),
    ]
    STATUS_CHOICES = [
        ('vacant', 'Vacant'),
        ('occupied', 'Occupied'),
        ('under_maintenance', 'Under Maintenance'),
        ('reserved', 'Reserved'),
    ]

    id = models.CharField(max_length=128, primary_key=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='units')
    unit_number = models.CharField(max_length=64)
    type = models.CharField(max_length=32, choices=TYPE_CHOICES, default='apartment')
    bedrooms = models.IntegerField()
    bathrooms = models.FloatField()
    square_feet = models.IntegerField()
    rent_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='vacant')
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'units'
        ordering = ['unit_number']

    def __str__(self):
        return f"{self.property.name} - {self.unit_number}"


class UnitAmenity(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='amenities')
    amenity = models.CharField(max_length=128)

    class Meta:
        db_table = 'unit_amenities'
        unique_together = ('unit', 'amenity')

    def __str__(self):
        return f"{self.unit} - {self.amenity}"


class Lease(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('terminated', 'Terminated'),
    ]

    id = models.CharField(max_length=128, primary_key=True)
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leases')
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    rent_amount = models.DecimalField(max_digits=12, decimal_places=2)
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_due_day = models.IntegerField(default=1)
    late_fee = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'leases'
        ordering = ['-created_at']

    def __str__(self):
        return f"Lease {self.id} - {self.tenant}"


class MaintenanceRequest(models.Model):
    URGENCY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
        ('critical', 'Critical'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.CharField(max_length=128, primary_key=True)
    ticket_number = models.CharField(max_length=16, unique=True, blank=True, null=True)
    account_id = models.CharField(max_length=16, blank=True, null=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, null=True, blank=True, related_name='maintenance_requests')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='maintenance_requests')
    issue = models.CharField(max_length=512)
    description = models.TextField()
    urgency = models.CharField(max_length=16, choices=URGENCY_CHOICES, default='medium')
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending')
    assigned_to = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'maintenance_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.issue} ({self.status})"


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.CharField(max_length=128, primary_key=True)
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=64)
    reference = models.CharField(max_length=255)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateField(blank=True, null=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    description = models.CharField(max_length=512, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.reference} - {self.amount}"


class Notification(models.Model):
    id = models.CharField(max_length=128, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=32, default='info')
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=512, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']


class Conversation(models.Model):
    id = models.CharField(max_length=128, primary_key=True)
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']

    def __str__(self):
        return f"Conversation {self.id}"


class Message(models.Model):
    id = models.CharField(max_length=128, primary_key=True)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender} in {self.conversation}"
