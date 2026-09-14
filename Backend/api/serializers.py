# api/serializers.py
import uuid
from rest_framework import serializers
from .models import (
    User, Property, PropertyAmenity, Unit, UnitAmenity,
    Lease, MaintenanceRequest, Payment, Notification,
    Conversation, Message, Document,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['uid', 'email', 'first_name', 'last_name', 'phone', 'role', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.password_hash = password  # Hash in production
        user.save()
        return user


class PropertyAmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyAmenity
        fields = ['amenity']


class PropertySerializer(serializers.ModelSerializer):
    amenities = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = '__all__'

    def get_amenities(self, obj):
        return list(obj.amenities.values_list('amenity', flat=True))


class PropertyCreateSerializer(serializers.ModelSerializer):
    amenities = serializers.ListField(child=serializers.CharField(), required=False, default=[])

    class Meta:
        model = Property
        fields = ['name', 'address', 'city', 'state', 'zip_code', 'type',
                  'status', 'total_units', 'year_built', 'description', 'image_url', 'amenities']
        extra_kwargs = {
            'city': {'required': False, 'default': ''},
            'state': {'required': False, 'default': ''},
            'zip_code': {'required': False, 'default': ''},
            'total_units': {'required': False, 'default': 1},
            'status': {'required': False, 'default': 'available'},
        }

    def create(self, validated_data):
        amenities = validated_data.pop('amenities', [])
        if not validated_data.get('id'):
            validated_data['id'] = str(uuid.uuid4())[:128]
        property_obj = Property.objects.create(**validated_data)
        for amenity in amenities:
            PropertyAmenity.objects.create(property=property_obj, amenity=amenity)
        return property_obj


class UnitAmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitAmenity
        fields = ['amenity']


class UnitSerializer(serializers.ModelSerializer):
    amenities = serializers.SerializerMethodField()
    property_name = serializers.CharField(source='property.name', read_only=True)

    class Meta:
        model = Unit
        fields = '__all__'

    def get_amenities(self, obj):
        return list(obj.amenities.values_list('amenity', flat=True))


class UnitCreateSerializer(serializers.ModelSerializer):
    amenities = serializers.ListField(child=serializers.CharField(), required=False, default=[])

    class Meta:
        model = Unit
        fields = ['id', 'property', 'unit_number', 'type', 'bedrooms', 'bathrooms',
                  'square_feet', 'rent_amount', 'status', 'description', 'amenities']
        extra_kwargs = {
            'id': {'required': False},
        }

    def create(self, validated_data):
        amenities = validated_data.pop('amenities', [])
        if not validated_data.get('id'):
            validated_data['id'] = str(uuid.uuid4())[:128]
        unit = Unit.objects.create(**validated_data)
        for amenity in amenities:
            UnitAmenity.objects.create(unit=unit, amenity=amenity)
        return unit


class LeaseSerializer(serializers.ModelSerializer):
    tenant_name = serializers.SerializerMethodField()
    unit_number = serializers.SerializerMethodField()
    property_name = serializers.SerializerMethodField()

    class Meta:
        model = Lease
        fields = '__all__'

    def get_tenant_name(self, obj):
        try:
            return f"{obj.tenant.first_name} {obj.tenant.last_name}" if obj.tenant else ''
        except Exception:
            return ''

    def get_unit_number(self, obj):
        try:
            return obj.unit.unit_number if obj.unit else ''
        except Exception:
            return ''

    def get_property_name(self, obj):
        try:
            return obj.unit.property.name if obj.unit and obj.unit.property else ''
        except Exception:
            return ''


class MaintenanceRequestSerializer(serializers.ModelSerializer):
    tenant_name = serializers.SerializerMethodField()
    unit_number = serializers.SerializerMethodField()
    property_name = serializers.SerializerMethodField()

    class Meta:
        model = MaintenanceRequest
        fields = '__all__'
        extra_kwargs = {
            'unit': {'required': False, 'allow_null': True},
            'user': {'required': False, 'allow_null': True},
        }

    def get_tenant_name(self, obj):
        try:
            return f"{obj.user.first_name} {obj.user.last_name}" if obj.user else ''
        except Exception:
            return ''

    def get_unit_number(self, obj):
        try:
            return obj.unit.unit_number if obj.unit else ''
        except Exception:
            return ''

    def get_property_name(self, obj):
        try:
            return obj.unit.property.name if obj.unit and obj.unit.property else ''
        except Exception:
            return ''


class PaymentSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.__str__', read_only=True)
    property_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = '__all__'

    def get_property_name(self, obj):
        lease = Lease.objects.filter(tenant=obj.tenant).first()
        if lease and lease.unit and lease.unit.property:
            return lease.unit.property.name
        return ''


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


# Dashboard serializers
class UserDashboardSerializer(serializers.Serializer):
    user_id = serializers.CharField()
    total_payments = serializers.FloatField()
    payment_count = serializers.IntegerField()
    pending_requests = serializers.IntegerField()
    completed_requests = serializers.IntegerField()
    lease = serializers.DictField(allow_null=True)


class StaffDashboardSerializer(serializers.Serializer):
    total_maintenance_requests = serializers.IntegerField()
    pending_requests = serializers.IntegerField()
    in_progress_requests = serializers.IntegerField()
    total_tenants = serializers.IntegerField()


class AdminDashboardSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_properties = serializers.IntegerField()
    total_units = serializers.IntegerField()
    total_payments = serializers.IntegerField()
    total_revenue = serializers.FloatField()
    pending_maintenance = serializers.IntegerField()


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation_id', 'sender', 'sender_name', 'text', 'is_read', 'created_at']

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}" if obj.sender else ''


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'other_user', 'last_message', 'unread_count', 'updated_at']

    def get_other_user(self, obj):
        request_user_id = self.context.get('request_user_id')
        other = obj.participants.exclude(uid=request_user_id).first()
        if not other:
            return None
        lease = Lease.objects.filter(tenant=other).select_related('unit', 'unit__property').first()
        property_name = ''
        if lease and lease.unit and lease.unit.property:
            property_name = lease.unit.property.name
            if lease.unit.unit_number:
                property_name += f' {lease.unit.unit_number}'
        return {
            'uid': other.uid,
            'name': f"{other.first_name} {other.last_name}",
            'email': other.email,
            'role': other.role,
            'property': property_name,
            'avatar': (other.first_name[0] if other.first_name else other.email[0]).upper(),
        }

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if not msg:
            return None
        return {
            'text': msg.text,
            'time': msg.created_at.isoformat() if msg.created_at else '',
            'sender_id': msg.sender_id,
        }

    def get_unread_count(self, obj):
        request_user_id = self.context.get('request_user_id')
        return obj.messages.filter(is_read=False).exclude(sender_id=request_user_id).count()


class DocumentSerializer(serializers.ModelSerializer):
    uploader_name = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'name', 'file', 'file_type', 'file_size', 'category',
                  'uploaded_by', 'uploader_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'uploaded_by', 'created_at', 'updated_at']

    def get_uploader_name(self, obj):
        if obj.uploaded_by:
            return f"{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}"
        return ''
