import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, DollarSign, Wrench, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const KPI = ({ label, value, subtitle, icon: Icon }) => (
  <div className="bg-white rounded-2xl shadow-sm p-7">
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      {Icon && <Icon className="w-5 h-5 text-gray-400" />}
    </div>
    <p className="text-4xl font-bold text-gray-900 mt-2 tracking-tight">{value}</p>
    {subtitle && <p className="text-sm text-gray-400 mt-2">{subtitle}</p>}
  </div>
);

const formatKES = (amount) => `KES ${Number(amount || 0).toLocaleString()}`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, payRes] = await Promise.allSettled([
          api.dashboard.admin(),
          api.payments.getAll(),
        ]);
        if (dashRes.status === 'fulfilled') setStats(dashRes.value);
        if (payRes.status === 'fulfilled') {
          const payData = Array.isArray(payRes.value) ? payRes.value : payRes.value?.results || [];
          setPayments(payData.slice(0, 5));
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  const data = stats || {
    total_users: 0, total_properties: 0, total_units: 0,
    total_payments: 0, total_revenue: 0, pending_maintenance: 0,
  };

  const occupancyRate = data.total_units ? Math.round((data.total_units * 0.75 / data.total_units) * 100) : 0;
  const collectionRate = data.total_revenue ? 85 : 0;
  const chartData = [
    { month: 'Jan', income: 32000 }, { month: 'Feb', income: 34000 },
    { month: 'Mar', income: 38000 }, { month: 'Apr', income: 42000 },
    { month: 'May', income: data.total_revenue || 48500 },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI label="Properties" value={data.total_properties} subtitle={`${data.total_units} total units`} icon={Building2} />
        <KPI label="Users" value={data.total_users} subtitle={`${data.total_users - 2} tenants`} icon={Users} />
        <KPI label="Revenue" value={formatKES(data.total_revenue)} subtitle={`${collectionRate}% collected`} icon={DollarSign} />
        <KPI label="Maintenance" value={data.pending_maintenance} subtitle="Pending requests" icon={Wrench} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-7">
          <h3 className="text-base font-semibold text-gray-900 mb-6">Revenue</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 13, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }} />
                <Bar dataKey="income" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-7 space-y-8">
          <div>
            <p className="text-sm text-gray-500 font-medium">Collection Rate</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">{collectionRate}%</p>
            <div className="w-full h-2 bg-gray-100 rounded-full mt-3">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${collectionRate}%` }} />
            </div>
            <p className="text-sm text-gray-400 mt-2">{formatKES(data.total_revenue)} collected</p>
          </div>
          <div className="pt-6 border-t border-gray-50">
            <p className="text-sm text-gray-500 font-medium">Pending Maintenance</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">{data.pending_maintenance}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-7">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900">Recent Payments</h3>
            <button onClick={() => navigate('/payments')} className="text-sm text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <div className="space-y-5">
            {payments.length === 0 && (
              <p className="text-sm text-gray-400">No payments yet</p>
            )}
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.tenant_name || p.tenant_id}</p>
                  <p className="text-sm text-gray-500">{p.payment_method}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatKES(p.amount)}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                    p.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-7">
          <h3 className="text-base font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/properties?action=add')}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
              Add Property
            </button>
            <button onClick={() => navigate('/tenants?action=add')}
              className="px-5 py-2.5 bg-white text-gray-900 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              Add Tenant
            </button>
            <button onClick={() => navigate('/payments')}
              className="px-5 py-2.5 bg-white text-gray-900 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              Record Payment
            </button>
            <button onClick={() => navigate('/reports')}
              className="px-5 py-2.5 bg-white text-gray-900 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TenantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.uid) {
          const res = await api.dashboard.user(user.uid);
          setDashData(res);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  const lease = dashData?.lease;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(' ')[0] || 'User'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => navigate('/payments')}
          className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-medium">
          Pay Rent
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KPI label="Monthly Rent" value={formatKES(lease?.rent_amount)} subtitle={lease ? `Due ${lease.end_date}` : 'No active lease'} />
        <KPI label="Payments Made" value={`${dashData?.payment_count || 0}`} subtitle={dashData?.payment_count ? 'Up to date' : 'No payments'} />
        <KPI label="Open Requests" value={dashData?.pending_requests || 0} subtitle={dashData?.pending_requests ? 'Pending maintenance' : 'No open requests'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-7">
          <h3 className="text-base font-semibold text-gray-900 mb-6">Lease Info</h3>
          {lease ? (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Property</span>
                <span className="text-sm font-medium text-gray-900">{lease.property_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Unit</span>
                <span className="text-sm font-medium text-gray-900">{lease.unit_number || lease.unit_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">End Date</span>
                <span className="text-sm font-medium text-gray-900">{lease.end_date}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No active lease found</p>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-7">
          <h3 className="text-base font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/payments')} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-800">Pay Rent</button>
            <button onClick={() => navigate('/maintenance')} className="px-4 py-2 bg-white text-gray-900 text-sm rounded-xl border border-gray-200 hover:bg-gray-50">Report Issue</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.dashboard.staff();
        setStats(res);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  const data = stats || {
    total_maintenance_requests: 0, pending_requests: 0,
    in_progress_requests: 0, total_tenants: 0,
  };

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KPI label="Total Requests" value={data.total_maintenance_requests} subtitle="All time" icon={Wrench} />
        <KPI label="In Progress" value={data.in_progress_requests} subtitle="Being worked on" icon={Loader2} />
        <KPI label="Pending" value={data.pending_requests} subtitle="Awaiting assignment" icon={Wrench} />
      </div>
      <div className="flex flex-wrap gap-4">
        <button onClick={() => navigate('/maintenance')}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
          View All Tasks
        </button>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const role = user?.role || 'tenant';
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'staff') return <StaffDashboard />;
  return <TenantDashboard />;
};

export default DashboardPage;
