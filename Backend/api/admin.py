# api/admin.py
from django.contrib import admin
from .models import (
    User, Property, PropertyAmenity, Unit, UnitAmenity,
    Lease, MaintenanceRequest, Payment, Notification
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['uid', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering = ['-created_at']


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'city', 'type', 'total_units', 'created_at']
    list_filter = ['type', 'city']
    search_fields = ['name', 'address']


@admin.register(PropertyAmenity)
class PropertyAmenityAdmin(admin.ModelAdmin):
    list_display = ['property', 'amenity']
    list_filter = ['property']


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['id', 'property', 'unit_number', 'bedrooms', 'bathrooms', 'rent_amount', 'status']
    list_filter = ['status', 'property', 'type']
    search_fields = ['unit_number']


@admin.register(UnitAmenity)
class UnitAmenityAdmin(admin.ModelAdmin):
    list_display = ['unit', 'amenity']
    list_filter = ['unit']


@admin.register(Lease)
class LeaseAdmin(admin.ModelAdmin):
    list_display = ['id', 'tenant', 'unit', 'start_date', 'end_date', 'rent_amount', 'status']
    list_filter = ['status', 'start_date']
    search_fields = ['tenant__email', 'tenant__first_name', 'tenant__last_name']


@admin.register(MaintenanceRequest)
class MaintenanceRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'issue', 'unit', 'user', 'urgency', 'status', 'created_at']
    list_filter = ['status', 'urgency', 'created_at']
    search_fields = ['issue', 'description']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'tenant', 'amount', 'payment_method', 'reference', 'status', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['reference', 'tenant__email']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'type', 'is_read', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['title', 'message']
