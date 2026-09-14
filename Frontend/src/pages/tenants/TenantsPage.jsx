import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  Users, Plus, Search, Mail, Phone, Key, Edit, Trash2, MessageCircle,
  ChevronDown, ChevronRight, Copy, Link as LinkIcon, Eye, EyeOff,
} from 'lucide-react';

const TenantsPage = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [credPopoverId, setCredPopoverId] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const popoverRef = useRef(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', propertyName: '', unitNumber: '',
    leaseStart: '', leaseEnd: '', rentAmount: '', status: 'active',
  });

  const generatePassword = (firstName, phone) => {
    const name = (firstName || 'user').toLowerCase().replace(/[^a-z]/g, '');
    const digits = (phone || '').replace(/\D/g, '').slice(-4) || '0000';
    return `${name}${digits}!`;
  };

  const calcLeasePeriod = (start, end) => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e) || e <= s) return null;
    let years = e.getFullYear() - s.getFullYear();
    let months = e.getMonth() - s.getMonth();
    let days = e.getDate() - s.getDate();
    if (days < 0) { months--; const prev = new Date(e.getFullYear(), e.getMonth(), 0); days += prev.getDate(); }
    if (months < 0) { years--; months += 12; }
    const parts = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' ') : '0 days';
  };

  const formatLeaseDates = (start, end) => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    const fmt = { month: 'short', day: 'numeric', year: 'numeric' };
    const duration = calcLeasePeriod(start, end);
    return `${s.toLocaleDateString('en-US', fmt)} – ${e.toLocaleDateString('en-US', fmt)}${duration ? ` (${duration})` : ''}`;
  };

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setCredPopoverId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTenants = async () => {
    try {
      const res = await api.tenants.getAll();
      const data = Array.isArray(res) ? res : res.results || [];
      setTenants(data.map(t => ({
        id: t.uid,
        accountId: t.account_id || '',
        name: `${t.first_name} ${t.last_name}`,
        email: t.email,
        phone: t.phone || '',
        password: t.password_hash || '',
        propertyName: t.apartment || t.lease?.property_name || '',
        unitNumber: t.house_number || t.lease?.unit_number || '',
        leaseStart: t.lease?.start_date || '',
        leaseEnd: t.lease?.end_date || '',
        rentAmount: t.lease?.rent_amount || 0,
        status: t.lease?.end_date ? (new Date(t.lease.end_date) > new Date() ? 'active' : 'expired') : 'active',
      })));
    } catch (err) {
      console.error('Failed to load tenants:', err);
      setTenants([]);
    }
    setLoading(false);
  };

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q) || t.propertyName?.toLowerCase().includes(q) || t.accountId?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameParts = (form.name || '').split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    try {
      if (editing) {
        const newPass = generatePassword(first_name, form.phone);
        const updateData = {
          first_name, last_name, phone: form.phone,
          apartment: form.propertyName, house_number: form.unitNumber,
          password_hash: newPass,
        };
        await api.tenants.update(editing.id, updateData);
        if (form.leaseStart && form.leaseEnd && form.rentAmount) {
          try {
            await api.leases.create({
              tenant: editing.id,
              start_date: form.leaseStart,
              end_date: form.leaseEnd,
              rent_amount: parseFloat(form.rentAmount),
            });
            toast.success('Tenant and lease updated');
          } catch (leaseErr) {
            toast.error('Tenant updated but lease failed: ' + (leaseErr.response?.data?.detail || 'Error'));
          }
        } else {
          toast.success('Tenant updated');
        }
      } else {
        const genPassword = generatePassword(first_name, form.phone);
        const regRes = await api.tenants.create({
          email: form.email,
          password: genPassword,
          first_name, last_name,
          phone: form.phone,
          role: 'tenant',
          apartment: form.propertyName || '',
          house_number: form.unitNumber || '',
        });
        const newUserId = regRes.user_id;
        if (newUserId && form.leaseStart && form.leaseEnd && form.rentAmount) {
          try {
            await api.leases.create({
              tenant: newUserId,
              start_date: form.leaseStart,
              end_date: form.leaseEnd,
              rent_amount: parseFloat(form.rentAmount),
            });
            toast.success('Tenant and lease created');
          } catch (leaseErr) {
            toast.error('Tenant added but lease failed: ' + (leaseErr.response?.data?.detail || 'Error'));
          }
        } else {
          toast.success('Tenant added');
        }
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', email: '', phone: '', propertyName: '', unitNumber: '', leaseStart: '', leaseEnd: '', rentAmount: '', status: 'active' });
      await loadTenants();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this tenant? This will also remove their lease data.')) return;
    try {
      await api.tenants.delete(id);
      toast.success('Tenant removed');
      await loadTenants();
    } catch {
      toast.error('Failed to delete tenant');
    }
  };

  const startChat = async (tenantUid) => {
    try {
      await api.chat.createConversation(tenantUid);
      navigate('/chat');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to start chat';
      toast.error(msg);
    }
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const togglePassword = (id) => setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const activeCount = tenants.filter(t => t.status === 'active').length;
  const expiringCount = tenants.filter(t => t.status === 'expiring').length;

  const statusBadge = (status) => {
    const colors = {
      active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      expiring: 'bg-amber-50 text-amber-700 ring-amber-600/20',
      expired: 'bg-red-50 text-red-700 ring-red-600/20',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colors[status] || colors.active}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tenants</h2>
          <p className="text-sm text-gray-500 mt-1">{tenants.length} tenants · {activeCount} active · {expiringCount} expiring</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors">
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Tenants</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{tenants.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Leases</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expiring Soon</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{expiringCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, email, property, or Acc ID..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all sm:w-40">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No tenants found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const isExpanded = expandedId === t.id;
            return (
              <div key={t.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">

                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={() => toggleExpand(t.id)}>
                  <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-200 shrink-0">
                    {t.accountId || 'TN---'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {t.name} <span className="text-gray-400 font-normal">·</span> <span className="font-normal text-gray-600">{t.propertyName || 'No property'}{t.unitNumber ? ` (Unit ${t.unitNumber})` : ''}</span>
                    </p>
                  </div>

                  <span className="text-sm font-bold text-gray-900 shrink-0 hidden sm:block">
                    KES {parseInt(t.rentAmount || 0).toLocaleString()}
                  </span>

                  <div className="shrink-0">{statusBadge(t.status)}</div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setCredPopoverId(credPopoverId === t.id ? null : t.id)}
                      className="relative p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Credentials">
                      <Key className="w-4 h-4" />
                      {credPopoverId === t.id && (
                        <div ref={popoverRef} className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Tenant Credentials</p>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Username</p>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 flex-1 truncate">{t.email}</span>
                                <button onClick={() => copyToClipboard(t.email, 'Email')}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors">
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Password</p>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-gray-900 flex-1">
                                  {showPasswords[t.id] ? (t.password || '—') : '••••••••'}
                                </span>
                                <button onClick={() => togglePassword(t.id)}
                                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                                  {showPasswords[t.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => copyToClipboard(t.password || '', 'Password')}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors">
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <button onClick={() => { copyToClipboard(`${window.location.origin}/login`, 'Login link'); }}
                              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                              <LinkIcon className="w-3.5 h-3.5" /> Copy Share Link
                            </button>
                          </div>
                        </div>
                      )}
                    </button>

                    <button onClick={() => startChat(t.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Start Chat">
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    <button onClick={() => {
                        setEditing(t);
                        setForm({ name: t.name, email: t.email, phone: t.phone || '', propertyName: t.propertyName || '', unitNumber: t.unitNumber || '', leaseStart: t.leaseStart || '', leaseEnd: t.leaseEnd || '', rentAmount: t.rentAmount || '', status: t.status || 'active' });
                        setShowModal(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>

                    <button onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="shrink-0 text-gray-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-5 bg-gray-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">🗓️ Lease Dates</p>
                        <p className="text-sm font-medium text-gray-900">{formatLeaseDates(t.leaseStart, t.leaseEnd) || '—'}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">💳 Total Rent</p>
                        <p className="text-sm font-bold text-gray-900">KES {parseInt(t.rentAmount || 0).toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">📱 Contact Details</p>
                        <p className="text-sm text-gray-900 truncate">{t.email} · {t.phone || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide shrink-0">Password</span>
                          <span className="text-sm font-mono text-gray-900 truncate">
                            {showPasswords[`exp_${t.id}`] ? (t.password || '—') : '••••••••'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => togglePassword(`exp_${t.id}`)}
                            className="p-1.5 text-slate-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors border border-slate-200">
                            {showPasswords[`exp_${t.id}`] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => copyToClipboard(t.password || '', 'Password')}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-slate-200">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => copyToClipboard(`${window.location.origin}/login`, 'Login link')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-blue-700 border border-slate-200 hover:bg-blue-50 transition-colors">
                            <LinkIcon className="w-3.5 h-3.5" /> Share Link
                          </button>
                        </div>
                      </div>
                    </div>

                    <button onClick={() => startChat(t.id)}
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors">
                      <MessageCircle className="w-4 h-4" /> Start Chat
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? 'Edit Tenant' : 'Add Tenant'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required placeholder="First Last" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+254 7XX XXX XXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <input type="text" value={form.propertyName} onChange={(e) => setForm({ ...form, propertyName: e.target.value })} className="input-field" placeholder="Property name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
              <input type="text" value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} className="input-field" placeholder="e.g. 3B" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start</label>
              <input type="date" value={form.leaseStart} onChange={(e) => setForm({ ...form, leaseStart: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease End</label>
              <input type="date" value={form.leaseEnd} onChange={(e) => setForm({ ...form, leaseEnd: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rent (KES/mo)</label>
              <input type="number" min="0" value={form.rentAmount} onChange={(e) => setForm({ ...form, rentAmount: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                <option value="active">Active</option>
                <option value="expiring">Expiring</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Add'} Tenant</button>
            <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TenantsPage;
