# api/views.py
import uuid
import logging
from datetime import datetime
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    User, Property, PropertyAmenity, Unit, UnitAmenity,
    Lease, MaintenanceRequest, Payment, Notification,
    Conversation, Message, Document,
)
from .serializers import (
    UserSerializer, UserCreateSerializer,
    PropertySerializer, PropertyCreateSerializer,
    UnitSerializer, UnitCreateSerializer,
    LeaseSerializer, MaintenanceRequestSerializer,
    PaymentSerializer, NotificationSerializer,
    UserDashboardSerializer, StaffDashboardSerializer, AdminDashboardSerializer,
    ConversationSerializer, MessageSerializer, DocumentSerializer,
)

logger = logging.getLogger(__name__)


# ========================
# HEALTH CHECK
# ========================

@api_view(['GET'])
def health_check(request):
    return Response({
        "status": "healthy",
        "service": "Rental Management System",
        "version": "1.0.0",
    })


@api_view(['GET'])
def ping(request):
    return Response({"ping": "pong"})


@api_view(['GET'])
def api_info(request):
    return Response({
        "api_version": "v1",
        "service": "Rental Management System",
        "ping": "/api/ping/",
        "endpoints": {
            "auth": {
                "login": "POST /api/auth/login",
                "register": "POST /api/auth/register",
                "profile": "GET /api/auth/profile",
                "me": "GET /api/auth/me",
            },
            "dashboard": {
                "user": "/api/dashboard/user",
                "staff": "/api/dashboard/staff",
                "admin": "/api/dashboard/admin",
            },
            "properties": "/api/v1/properties",
            "maintenance": "/api/v1/maintenance/requests",
            "payments": "/api/v1/payments",
            "tenants": "/api/v1/tenants",
        }
    })


# ========================
# AUTH ENDPOINTS
# ========================

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(View):
    def post(self, request):
        import json
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return JsonResponse({"detail": "Email and password required"}, status=400)

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return JsonResponse({"detail": "Invalid credentials"}, status=401)

            if user.password_hash != password:
                return JsonResponse({"detail": "Invalid credentials"}, status=401)

            if user.role == 'tenant' and not user.account_id:
                last_tenant = User.objects.filter(role='tenant', account_id__isnull=False).order_by('-account_id').first()
                if last_tenant:
                    try:
                        last_num = int(last_tenant.account_id.replace('TN', ''))
                        user.account_id = f'TN{last_num + 1:03d}'
                    except (ValueError, AttributeError):
                        user.account_id = f'TN{User.objects.filter(role="tenant").count():03d}'
                else:
                    user.account_id = 'TN001'
                user.save(update_fields=['account_id'])

            return JsonResponse({
                "access_token": f"token_{user.uid}",
                "token_type": "bearer",
                "expires_in": 3600,
                "refresh_token": f"refresh_{user.uid}",
                "user_id": user.uid,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "account_id": user.account_id or '',
                "phone": user.phone or '',
            })
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid JSON"}, status=400)

    def get(self, request):
        return JsonResponse({
            "message": "Please use POST /api/auth/login with email and password",
            "required_fields": {"email": "string", "password": "string"}
        })


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(View):
    def post(self, request):
        import json
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            phone = data.get('phone')
            apartment = data.get('apartment', '')
            house_number = data.get('house_number', '')

            if not all([email, password, first_name, last_name]):
                return JsonResponse({"detail": "Missing required fields"}, status=400)

            if User.objects.filter(email=email).exists():
                return JsonResponse({"detail": "Email already registered"}, status=400)

            uid = str(uuid.uuid4())
            last_tenant = User.objects.filter(role='tenant').order_by('-created_at').first()
            if last_tenant and last_tenant.account_id:
                try:
                    last_num = int(last_tenant.account_id.replace('TN', ''))
                    new_account_id = f'TN{last_num + 1:03d}'
                except (ValueError, AttributeError):
                    new_account_id = f'TN{User.objects.filter(role="tenant").count() + 1:03d}'
            else:
                new_account_id = f'TN{User.objects.filter(role="tenant").count() + 1:03d}'

            user = User.objects.create(
                uid=uid, account_id=new_account_id,
                email=email, first_name=first_name,
                last_name=last_name, phone=phone, role='tenant',
                password_hash=password,
                apartment=apartment, house_number=house_number,
            )

            return JsonResponse({
                "access_token": f"token_{uid}",
                "token_type": "bearer",
                "expires_in": 3600,
                "refresh_token": f"refresh_{uid}",
                "user_id": uid,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "role": "tenant",
                "account_id": new_account_id,
                "phone": phone or '',
            }, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid JSON"}, status=400)


class ProfileView(APIView):
    def get(self, request):
        uid = request.GET.get('uid')
        if not uid:
            return Response({"detail": "uid parameter required"}, status=400)
        try:
            user = User.objects.get(uid=uid)
            return Response(UserSerializer(user).data)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)


class AuthMeView(APIView):
    def get(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        uid = None
        if auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')
            if token.startswith('token_'):
                uid = token.replace('token_', '')
        if not uid:
            uid = request.query_params.get('uid')
        if not uid:
            return Response({"detail": "Authentication required"}, status=401)
        try:
            user = User.objects.get(uid=uid)
            return Response(UserSerializer(user).data)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)


# ========================
# PROPERTY ENDPOINTS
# ========================

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return PropertyCreateSerializer
        return PropertySerializer

    def create(self, request, *args, **kwargs):
        name = request.data.get('name', '').strip()
        address = request.data.get('address', '').strip()
        if name and address:
            existing = Property.objects.filter(name__iexact=name, address__iexact=address).first()
            if existing:
                return Response({"detail": "A property with this name and address already exists"}, status=400)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not serializer.validated_data.get('id'):
            serializer.validated_data['id'] = str(uuid.uuid4())[:128]
        instance = serializer.save()
        output = PropertySerializer(instance)
        return Response(output.data, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        qs = super().get_queryset()
        city = self.request.query_params.get('city')
        search = self.request.query_params.get('search')
        if city:
            qs = qs.filter(city__iexact=city)
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(address__icontains=search))
        return qs


class PublicPropertyListView(APIView):
    def get(self, request):
        qs = Property.objects.all()
        city = request.query_params.get('city')
        search = request.query_params.get('search')
        if city:
            qs = qs.filter(city__iexact=city)
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(address__icontains=search))
        serializer = PropertySerializer(qs, many=True)
        return Response(serializer.data)


# ========================
# UNIT ENDPOINTS
# ========================

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return UnitCreateSerializer
        return UnitSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if not data.get('id'):
            data['id'] = str(uuid.uuid4())[:128]
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(UnitSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save()

    def get_queryset(self):
        qs = super().get_queryset()
        property_id = self.request.query_params.get('property_id')
        unit_status = self.request.query_params.get('status')
        if property_id:
            qs = qs.filter(property_id=property_id)
        if unit_status:
            qs = qs.filter(status=unit_status)
        return qs


# ========================
# MAINTENANCE ENDPOINTS
# ========================

class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRequest.objects.all()
    serializer_class = MaintenanceRequestSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if not data.get('id'):
            data['id'] = str(uuid.uuid4())[:128]

        account_id = data.get('account_id', '').strip()
        logger.error(f"Maintenance create: account_id='{account_id}', data keys={list(data.keys())}")
        if account_id:
            tenant = User.objects.filter(account_id=account_id, role='tenant').first()
            if not tenant:
                available = list(User.objects.filter(role='tenant').values_list('account_id', flat=True))
                logger.error(f"Tenant not found for account_id='{account_id}'. Available: {available}")
                return Response({"detail": f"Tenant with Account ID '{account_id}' not found. Available IDs: {available}"}, status=400)
            data['user'] = tenant.uid
        else:
            return Response({"detail": "Account ID is required"}, status=400)

        last_ticket = MaintenanceRequest.objects.order_by('-created_at').first()
        if last_ticket and last_ticket.ticket_number:
            try:
                last_num = int(last_ticket.ticket_number.replace('MNT-', ''))
                data['ticket_number'] = f'MNT-{last_num + 1:04d}'
            except (ValueError, AttributeError):
                data['ticket_number'] = f'MNT-{MaintenanceRequest.objects.count() + 1:04d}'
        else:
            data['ticket_number'] = f'MNT-{MaintenanceRequest.objects.count() + 1:04d}'

        data.setdefault('status', 'pending')

        logger.error(f"Maintenance final data keys={list(data.keys())}, user={data.get('user')}, ticket={data.get('ticket_number')}")
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            logger.error(f"Maintenance validation errors: {serializer.errors}, data={data}")
            return Response(serializer.errors, status=400)
        self.perform_create(serializer)
        return Response(MaintenanceRequestSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save()

    def get_queryset(self):
        qs = super().get_queryset()
        tenant_id = self.request.query_params.get('tenant_id')
        req_status = self.request.query_params.get('status')
        if tenant_id:
            qs = qs.filter(user_id=tenant_id)
        if req_status:
            qs = qs.filter(status=req_status)
        return qs

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        req = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            req.status = new_status
            if new_status == 'completed':
                req.completed_at = datetime.now()
            req.save()
            return Response(MaintenanceRequestSerializer(req).data)
        return Response({"detail": "Status required"}, status=400)


# ========================
# PAYMENT ENDPOINTS
# ========================

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if not data.get('id'):
            data['id'] = str(uuid.uuid4())[:128]
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(PaymentSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save()

    def get_queryset(self):
        qs = super().get_queryset()
        tenant_id = self.request.query_params.get('tenant_id')
        pay_status = self.request.query_params.get('status')
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        if pay_status:
            qs = qs.filter(status=pay_status)
        return qs

    @action(detail=True, methods=['patch'])
    def mark_paid(self, request, pk=None):
        payment = self.get_object()
        payment.status = 'paid'
        payment.paid_at = datetime.now()
        payment.save()
        return Response(PaymentSerializer(payment).data)


# ========================
# TENANT ENDPOINTS
# ========================

class TenantListView(APIView):
    def get(self, request):
        property_id = request.query_params.get('property_id')
        unit_id = request.query_params.get('unit_id')

        tenants = User.objects.filter(role='tenant')
        result = []
        for tenant in tenants:
            entry = UserSerializer(tenant).data
            lease = Lease.objects.filter(tenant=tenant).select_related('unit', 'unit__property').first()
            if lease:
                try:
                    property_name = lease.unit.property.name if lease.unit and lease.unit.property else ''
                    unit_number = lease.unit.unit_number if lease.unit else ''
                except Exception:
                    property_name = ''
                    unit_number = ''
                entry['lease'] = {
                    'unit_id': lease.unit_id,
                    'start_date': str(lease.start_date),
                    'end_date': str(lease.end_date),
                    'rent_amount': float(lease.rent_amount),
                    'property_name': property_name,
                    'unit_number': unit_number,
                }
                if unit_id and lease.unit_id != unit_id:
                    continue
            result.append(entry)
        return Response(result)


# ========================
# LEASE ENDPOINTS
# ========================

class LeaseViewSet(viewsets.ModelViewSet):
    queryset = Lease.objects.all()
    serializer_class = LeaseSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if not data.get('id'):
            data['id'] = str(uuid.uuid4())[:128]
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(LeaseSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save()

    def get_queryset(self):
        qs = super().get_queryset()
        tenant_id = self.request.query_params.get('tenant_id')
        lease_status = self.request.query_params.get('status')
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        if lease_status:
            qs = qs.filter(status=lease_status)
        return qs


# ========================
# USER ENDPOINTS
# ========================

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'uid'

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        return qs


# ========================
# NOTIFICATION ENDPOINTS
# ========================

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if not data.get('id'):
            data['id'] = str(uuid.uuid4())[:128]
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(NotificationSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save()

    def get_queryset(self):
        qs = super().get_queryset()
        user_id = self.request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        user_id = request.data.get('user_id') or request.query_params.get('user_id')
        qs = Notification.objects.filter(is_read=False)
        if user_id:
            qs = qs.filter(user_id=user_id)
        count = qs.update(is_read=True)
        return Response({"marked": count})

    @action(detail=False, methods=['get', 'put'])
    def notification_settings(self, request):
        if request.method == 'GET':
            return Response({
                "email": True, "sms": True, "push": True,
                "rent_due": True, "payment_received": True,
                "maintenance_update": True, "lease_renewal": True,
            })
        data = request.data
        return Response(data)

    @action(detail=False, methods=['post'])
    def send(self, request):
        user = _resolve_user_from_request(request)
        if not user or user.role == 'tenant':
            return Response({"detail": "Only admin and staff can send notifications"}, status=403)
        notif_type = request.data.get('type', 'email')
        subject = request.data.get('subject', '')
        message = request.data.get('message', '')
        recipient_type = request.data.get('recipientType', 'all')
        users = User.objects.all()
        if recipient_type == 'tenants':
            users = users.filter(role='tenant')
        created = 0
        for u in users:
            Notification.objects.create(user=u, message=f"{subject}: {message}" if subject else message)
            created += 1
        return Response({"sent": created, "type": notif_type})


# ========================
# DASHBOARD ENDPOINTS
# ========================

class UserDashboardView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"detail": "user_id required"}, status=400)

        payments = Payment.objects.filter(tenant_id=user_id)
        maintenance = MaintenanceRequest.objects.filter(user_id=user_id)
        lease = Lease.objects.filter(tenant_id=user_id).first()

        total_payments = payments.aggregate(total=Sum('amount'))['total'] or 0

        data = {
            "user_id": user_id,
            "total_payments": float(total_payments),
            "payment_count": payments.count(),
            "pending_requests": maintenance.filter(status='pending').count(),
            "completed_requests": maintenance.filter(status='completed').count(),
            "lease": {
                "unit_id": lease.unit_id,
                "rent_amount": float(lease.rent_amount),
                "end_date": str(lease.end_date),
                "property_name": lease.unit.property.name if lease.unit and lease.unit.property else '',
                "unit_number": lease.unit.unit_number if lease.unit else '',
            } if lease else None,
        }
        return Response(data)


class StaffDashboardView(APIView):
    def get(self, request):
        data = {
            "total_maintenance_requests": MaintenanceRequest.objects.count(),
            "pending_requests": MaintenanceRequest.objects.filter(status='pending').count(),
            "in_progress_requests": MaintenanceRequest.objects.filter(status='in_progress').count(),
            "total_tenants": User.objects.filter(role='tenant').count(),
        }
        return Response(data)


class AdminDashboardView(APIView):
    def get(self, request):
        paid_total = Payment.objects.filter(status='paid').aggregate(
            total=Sum('amount'))['total'] or 0

        data = {
            "total_users": User.objects.count(),
            "total_properties": Property.objects.count(),
            "total_units": Unit.objects.count(),
            "total_payments": Payment.objects.count(),
            "total_revenue": float(paid_total),
            "pending_maintenance": MaintenanceRequest.objects.filter(status='pending').count(),
        }
        return Response(data)


# ========================
# FINANCIAL REPORTS
# ========================

class FinancialReportsView(APIView):
    def get(self, request):
        from django.db.models.functions import TruncMonth
        from datetime import timedelta

        period = request.query_params.get('period', 'monthly')
        months = 12 if period == 'yearly' else 6 if period == 'quarterly' else 5
        cutoff = datetime.now() - timedelta(days=months * 31)

        paid_payments = Payment.objects.filter(status='paid', created_at__gte=cutoff)
        pending_payments = Payment.objects.filter(status='pending')
        overdue_payments = Payment.objects.filter(status='overdue')

        total_income = float(paid_payments.aggregate(total=Sum('amount'))['total'] or 0)
        total_pending = float(pending_payments.aggregate(total=Sum('amount'))['total'] or 0)
        total_overdue = float(overdue_payments.aggregate(total=Sum('amount'))['total'] or 0)

        monthly_income = (
            paid_payments
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(total=Sum('amount'))
            .order_by('month')
        )

        monthly_overdue = (
            overdue_payments
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(total=Sum('amount'))
            .order_by('month')
        )

        income_data = []
        for entry in monthly_income:
            label = entry['month'].strftime('%b %Y') if entry['month'] else 'Unknown'
            income_data.append({'label': label, 'amount': float(entry['total'])})

        expense_data = []
        for entry in monthly_overdue:
            label = entry['month'].strftime('%b %Y') if entry['month'] else 'Unknown'
            expense_data.append({'label': label, 'amount': float(entry['total'])})

        total_units = Unit.objects.count()
        avg_revenue = total_income / total_units if total_units > 0 else 0
        total_outstanding = total_pending + total_overdue
        total_revenue = total_income + total_outstanding
        collection_rate = round((total_income / total_revenue * 100), 1) if total_revenue > 0 else 100
        expense_ratio = round((total_overdue / total_income * 100), 1) if total_income > 0 else 0

        data = {
            'income': {
                'total': total_income,
                'data': income_data,
            },
            'expenses': {
                'total': total_overdue,
                'data': expense_data,
            },
            'outstanding': {
                'total': total_outstanding,
                'count': pending_payments.count() + overdue_payments.count(),
            },
            'total_units': total_units,
            'collection_rate': collection_rate,
            'expense_ratio': expense_ratio,
        }
        return Response(data)


# ========================
# DOCUMENT ENDPOINTS
# ========================

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def create(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        if not file:
            return Response({"detail": "No file provided"}, status=400)
        data = {
            'id': str(uuid.uuid4())[:128],
            'name': request.data.get('name', file.name),
            'file': file,
            'file_type': file.content_type or '',
            'file_size': file.size,
            'category': request.data.get('category', 'other'),
        }
        user = _resolve_user_from_request(request)
        if user:
            data['uploaded_by'] = user.uid
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        doc = self.get_object()
        from django.http import FileResponse
        try:
            return FileResponse(doc.file.open('rb'), as_attachment=True, filename=doc.name)
        except Exception:
            return Response({"detail": "File not found"}, status=404)

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(name__icontains=search)
        return qs


# ========================
# CHAT ENDPOINTS
# ========================

def _resolve_user_from_request(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    uid = None
    if auth_header.startswith('Token '):
        token = auth_header.split(' ', 1)[1] if ' ' in auth_header else ''
        if token.startswith('token_'):
            uid = token[6:]  # remove 'token_' prefix
    if not uid:
        uid = request.query_params.get('user_id') or request.data.get('sender_id')
    if not uid:
        logger.error(f"Chat auth failed: header='{auth_header}'")
        return None
    try:
        return User.objects.get(uid=uid)
    except User.DoesNotExist:
        logger.error(f"Chat auth failed: user not found for uid='{uid}'")
        return None


class ConversationListView(APIView):
    def get(self, request):
        current_user = _resolve_user_from_request(request)
        if not current_user:
            return Response({"detail": "Authentication required"}, status=401)
        convos = Conversation.objects.filter(participants=current_user)
        serializer = ConversationSerializer(
            convos, many=True, context={'request_user_id': current_user.uid}
        )
        return Response(serializer.data)

    def post(self, request):
        current_user = _resolve_user_from_request(request)
        if not current_user:
            return Response({"detail": "Authentication required"}, status=401)
        other_uid = request.data.get('user_id')
        if not other_uid:
            return Response({"detail": "user_id required"}, status=400)
        try:
            other_user = User.objects.get(uid=other_uid)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)
        existing = Conversation.objects.filter(participants=current_user).filter(participants=other_user).first()
        if existing:
            serializer = ConversationSerializer(
                existing, context={'request_user_id': current_user.uid}
            )
            return Response(serializer.data)
        convo = Conversation.objects.create(id=str(uuid.uuid4())[:128])
        convo.participants.add(current_user, other_user)
        serializer = ConversationSerializer(
            convo, context={'request_user_id': current_user.uid}
        )
        return Response(serializer.data, status=201)


class MessageListView(APIView):
    def get(self, request, conversation_id):
        current_user = _resolve_user_from_request(request)
        if not current_user:
            return Response({"detail": "Authentication required"}, status=401)
        try:
            convo = Conversation.objects.get(id=conversation_id, participants=current_user)
        except Conversation.DoesNotExist:
            return Response({"detail": "Conversation not found"}, status=404)
        messages = convo.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, conversation_id):
        current_user = _resolve_user_from_request(request)
        if not current_user:
            return Response({"detail": "Authentication required"}, status=401)
        try:
            convo = Conversation.objects.get(id=conversation_id, participants=current_user)
        except Conversation.DoesNotExist:
            return Response({"detail": "Conversation not found"}, status=404)
        text = request.data.get('text', '').strip()
        if not text:
            return Response({"detail": "Message text required"}, status=400)
        msg = Message.objects.create(
            id=str(uuid.uuid4())[:128],
            conversation=convo,
            sender=current_user,
            text=text,
        )
        convo.save()
        serializer = MessageSerializer(msg)
        return Response(serializer.data, status=201)


class MarkReadView(APIView):
    def post(self, request, conversation_id):
        current_user = _resolve_user_from_request(request)
        if not current_user:
            return Response({"detail": "Authentication required"}, status=401)
        try:
            convo = Conversation.objects.get(id=conversation_id, participants=current_user)
        except Conversation.DoesNotExist:
            return Response({"detail": "Conversation not found"}, status=404)
        count = convo.messages.filter(is_read=False).exclude(sender=current_user).update(is_read=True)
        return Response({"marked": count})


class TenantChatListView(APIView):
    def get(self, request):
        tenants = User.objects.filter(role='tenant')
        result = []
        for t in tenants:
            lease = Lease.objects.filter(tenant=t).select_related('unit', 'unit__property').first()
            property_name = ''
            if lease and lease.unit and lease.unit.property:
                property_name = lease.unit.property.name
                if lease.unit.unit_number:
                    property_name += f' {lease.unit.unit_number}'
            result.append({
                'uid': t.uid,
                'name': f"{t.first_name} {t.last_name}",
                'email': t.email,
                'role': t.role,
                'property': property_name,
                'avatar': (t.first_name[0] if t.first_name else t.email[0]).upper(),
            })
        return Response(result)
