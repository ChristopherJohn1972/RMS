# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'v1/properties', views.PropertyViewSet, basename='property')
router.register(r'v1/units', views.UnitViewSet, basename='unit')
router.register(r'v1/maintenance/requests', views.MaintenanceRequestViewSet, basename='maintenance')
router.register(r'v1/payments', views.PaymentViewSet, basename='payment')
router.register(r'v1/leases', views.LeaseViewSet, basename='lease')
router.register(r'v1/notifications', views.NotificationViewSet, basename='notification')
router.register(r'v1/users', views.UserViewSet, basename='user')
router.register(r'v1/documents', views.DocumentViewSet, basename='document')

urlpatterns = [
    # Health & info
    path('health/', views.health_check, name='health'),
    path('ping/', views.ping, name='ping'),
    path('v1/info/', views.api_info, name='api-info'),

    # Auth
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/profile/', views.ProfileView.as_view(), name='profile'),
    path('auth/me/', views.AuthMeView.as_view(), name='auth-me'),

    # Public endpoints
    path('properties/', views.PublicPropertyListView.as_view(), name='public-properties'),

    # Dashboard
    path('dashboard/user/', views.UserDashboardView.as_view(), name='user-dashboard'),
    path('dashboard/staff/', views.StaffDashboardView.as_view(), name='staff-dashboard'),
    path('dashboard/admin/', views.AdminDashboardView.as_view(), name='admin-dashboard'),

    # Reports
    path('reports/financial/', views.FinancialReportsView.as_view(), name='financial-reports'),

    # Tenants
    path('v1/tenants/', views.TenantListView.as_view(), name='tenant-list'),

    # Chat
    path('v1/conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('v1/conversations/<str:conversation_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('v1/conversations/<str:conversation_id>/mark_read/', views.MarkReadView.as_view(), name='mark-read'),
    path('v1/chat/tenants/', views.TenantChatListView.as_view(), name='tenant-chat-list'),

    # Router URLs
    path('', include(router.urls)),
]
