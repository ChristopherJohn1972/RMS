import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import MaintenanceCard from '../../components/maintenance/MaintenanceCard';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Wrench, Plus, Search, Clock, CheckCircle,
  AlertTriangle, Ticket,
} from 'lucide-react';

const statuses = ['Pending', 'In Progress', 'Resolved'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];

const MaintenancePage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [lastTicket, setLastTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', accountId: '' });

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const params = user?.role === 'tenant' && user?.uid
        ? { tenant_id: user.uid }
        : {};
      const res = await api.maintenance.getAll(params);
      const data = Array.isArray(res) ? res : res.results || [];
      setRequests(data.map(r => ({
        id: r.id,
        ticketNumber: r.ticket_number || '',
        accountId: r.account_id || '',
        tenantName: r.tenant_name || '',
        title: r.issue,
        description: r.description,
        propertyName: r.property_name || '',
        unitNumber: r.unit_number || '',
        priority: r.urgency?.charAt(0).toUpperCase() + r.urgency?.slice(1),
        status: r.status === 'in_progress' ? 'In Progress' : r.status === 'completed' ? 'Resolved' : r.status === 'pending' ? 'Pending' : r.status,
        assignedTo: r.assigned_to,
        createdAt: r.created_at?.split('T')[0] || '',
      })));
    } catch {
      setRequests([]);
    }
    setLoading(false);
  };

  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = r.title?.toLowerCase().includes(q) || r.ticketNumber?.toLowerCase().includes(q) || r.accountId?.toLowerCase().includes(q) || r.tenantName?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchPriority = filterPriority === 'all' || r.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) { toast.error('Title and description required'); return; }
    const accountId = user?.role === 'tenant' ? (user.accountId || '') : form.accountId;
    if (!accountId) { toast.error('Account ID is required. Please log in again.'); return; }
    try {
      const res = await api.maintenance.create({
        issue: form.title,
        description: form.description,
        urgency: form.priority?.toLowerCase() || 'medium',
        account_id: accountId,
      });
      const ticket = res.ticket_number || 'N/A';
      setLastTicket(ticket);
      setShowTicketModal(true);
      toast.success(`Request submitted — Ticket ${ticket}`);
      setShowModal(false);
      setForm({ title: '', description: '', priority: 'Medium', accountId: '' });
      await loadRequests();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed';
      toast.error(msg);
    }
  };

  const updateStatus = async (id, newStatus) => {
    const apiStatus = newStatus === 'In Progress' ? 'in_progress' : newStatus === 'Resolved' ? 'completed' : 'pending';
    try {
      await api.maintenance.patch(id, { status: apiStatus });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast.success(`Status updated to "${newStatus}"`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const assignTask = async (id) => {
    const name = prompt('Enter staff/technician name:');
    if (!name) return;
    try {
      await api.maintenance.patch(id, { assigned_to: name });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, assignedTo: name } : r));
      toast.success(`Assigned to ${name}`);
    } catch {
      toast.error('Failed to assign');
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setForm({ title: request.title, description: request.description, priority: request.priority, accountId: request.accountId });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRequest) return;
    try {
      await api.maintenance.update(editingRequest.id, {
        issue: form.title,
        description: form.description,
        urgency: form.priority?.toLowerCase() || 'medium',
      });
      toast.success('Ticket updated');
      setShowEditModal(false);
      setEditingRequest(null);
      await loadRequests();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed';
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this maintenance request?')) return;
    try {
      await api.maintenance.delete(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success('Ticket deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const canManage = ['admin', 'staff', 'landlord', 'manager'].includes(user?.role);

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const inProgressCount = requests.filter(r => r.status === 'In Progress').length;
  const resolvedCount = requests.filter(r => r.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maintenance</h2>
          <p className="text-sm text-gray-500 mt-1">{pendingCount} pending · {inProgressCount} in progress · {resolvedCount} resolved</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">In Progress</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{inProgressCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Resolved</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{resolvedCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by ticket, account ID, tenant, or issue..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
        </div>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all sm:w-36">
          <option value="all">All Priority</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all sm:w-36">
          <option value="all">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No maintenance requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <MaintenanceCard
              key={r.id}
              request={r}
              canManage={canManage}
              onStartProgress={(id) => updateStatus(id, 'In Progress')}
              onAssignStaff={assignTask}
              onMarkResolved={(id) => updateStatus(id, 'Resolved')}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Maintenance Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
            {user?.role === 'tenant' ? (
              <>
                <input type="text" value={user?.accountId || ''} readOnly
                  className="input-field bg-gray-50 text-gray-600 cursor-not-allowed font-semibold" />
                <p className="text-xs text-gray-400 mt-1">Auto-filled from your account</p>
              </>
            ) : (
              <input type="text" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                className="input-field" required placeholder="e.g. TN001" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field" required placeholder="e.g. Leaking faucet in kitchen" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field" rows="3" required placeholder="Describe the issue in detail..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-field">
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Submit Request</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} title="Request Submitted">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Request Received</h3>
          <p className="text-sm text-gray-500 mb-4">Your maintenance request has been submitted successfully.</p>
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 ring-1 ring-inset ring-slate-200">
            <Ticket className="w-5 h-5 text-slate-600" />
            <span className="text-xl font-bold text-slate-900">{lastTicket}</span>
          </div>
          <p className="text-xs text-gray-400 mt-3">Save this ticket number to track your request status.</p>
          <button onClick={() => setShowTicketModal(false)}
            className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors">
            Done
          </button>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingRequest(null); }} title="Edit Ticket">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field" rows="3" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-field">
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Save Changes</button>
            <button type="button" onClick={() => { setShowEditModal(false); setEditingRequest(null); }} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenancePage;
