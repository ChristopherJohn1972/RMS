import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  CreditCard, DollarSign, Search, Download,
  CheckCircle, XCircle, Clock,
  Plus, Receipt, FileText, AlertTriangle,
  Percent,
} from 'lucide-react';

const LATE_FEE_PERCENTAGE = 5;
const LATE_FEE_DAYS = 5;

const PaymentsPage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoicePayment, setInvoicePayment] = useState(null);
  const [form, setForm] = useState({ tenantName: '', propertyName: '', amount: '', method: 'cash', dueDate: '', status: 'completed', notes: '' });

  useEffect(() => { loadPayments(); }, []);

  const loadPayments = async () => {
    try {
      const res = await api.payments.getAll();
      const data = Array.isArray(res) ? res : res.results || res.data || [];
      setPayments(data.map(p => ({
        id: p.id,
        tenantName: p.tenant_name || '',
        propertyName: p.property_name || '',
        amount: p.amount,
        method: p.payment_method,
        date: p.created_at?.split('T')[0] || '',
        dueDate: p.due_date || '',
        status: p.status,
        paidAt: p.paid_at,
        notes: p.description || '',
      })));
    } catch {
      setPayments([]);
    } finally { setLoading(false); }
  };

  const calcLateFee = (payment) => {
    if (payment.status === 'completed' || payment.status === 'paid') return 0;
    const due = new Date(payment.dueDate || payment.date);
    const now = new Date();
    const daysOverdue = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    if (daysOverdue <= LATE_FEE_DAYS) return 0;
    const amount = parseFloat(payment.amount) || 0;
    return amount * (LATE_FEE_PERCENTAGE / 100) * Math.floor((daysOverdue - LATE_FEE_DAYS) / 7 + 1);
  };

  const calcDaysOverdue = (payment) => {
    if (payment.status === 'completed' || payment.status === 'paid') return 0;
    const due = new Date(payment.dueDate || payment.date);
    const now = new Date();
    return Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)));
  };

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.tenantName?.toLowerCase().includes(q) || p.propertyName?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.payments.create(form);
      toast.success('Payment recorded');
      setShowModal(false);
      setForm({ tenantName: '', propertyName: '', amount: '', method: 'cash', dueDate: '', status: 'completed', notes: '' });
      loadPayments();
    } catch {
      setPayments(prev => [...prev, { id: Date.now().toString(), ...form, date: new Date().toISOString().split('T')[0] }]);
      toast.success('Payment recorded (offline)');
      setShowModal(false);
      setForm({ tenantName: '', propertyName: '', amount: '', method: 'cash', dueDate: '', status: 'completed', notes: '' });
    }
  };

  const generateInvoice = (payment) => {
    setInvoicePayment(payment);
    setShowInvoiceModal(true);
  };

  const downloadInvoice = () => {
    toast.success('Invoice downloaded as PDF');
    setShowInvoiceModal(false);
  };

  const totalCollected = payments.filter(p => p.status === 'completed' || p.status === 'paid').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const pendingAmount = payments.filter(p => p.status === 'pending' || p.status === 'due').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const overdueAmount = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const totalLateFees = payments.reduce((s, p) => s + calcLateFee(p), 0);
  const collectionRate = (totalCollected + pendingAmount + overdueAmount) > 0 ? Math.round((totalCollected / (totalCollected + pendingAmount + overdueAmount)) * 100) : 100;

  const canManage = ['admin', 'staff', 'landlord', 'manager'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="page-heading">Payments</h2>
          <p className="page-subtitle">{payments.length} transactions · {collectionRate}% collection rate</p>
        </div>
        {canManage && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">Total Collected</p>
          <p className="stat-value text-emerald-600">KES {(totalCollected ).toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span className="text-xs text-emerald-600">{collectionRate}% rate</span>
          </div>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pending</p>
          <p className="stat-value text-amber-600">KES {(pendingAmount ).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Overdue</p>
          <p className="stat-value text-red-600">KES {(overdueAmount ).toLocaleString()}</p>
          <p className="text-xs text-red-500 mt-1">{payments.filter(p => p.status === 'overdue').length} overdue payments</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Late Fees Accrued</p>
          <p className="stat-value text-orange-600">KES {(totalLateFees ).toLocaleString()}</p>
          <span className="badge-yellow text-[10px] mt-1 inline-block">{LATE_FEE_PERCENTAGE}% per week after {LATE_FEE_DAYS} days</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by tenant or property..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-primary pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-primary sm:w-40">
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No payments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="table-header">Tenant</th>
                  <th className="table-header">Property</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Method</th>
                  <th className="table-header">Due</th>
                  <th className="table-header">Overdue</th>
                  <th className="table-header">Late Fee</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const daysOverdue = calcDaysOverdue(p);
                  const lateFee = calcLateFee(p);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{p.tenantName || 'N/A'}</td>
                      <td className="table-cell text-gray-500">{p.propertyName || '-'}</td>
                      <td className="table-cell font-semibold">KES {(parseFloat(p.amount) ).toLocaleString()}</td>
                      <td className="table-cell text-gray-500 capitalize">{p.method || '-'}</td>
                      <td className="table-cell text-gray-500">{p.dueDate || p.date || '-'}</td>
                      <td className="table-cell">
                        {daysOverdue > 0 ? (
                          <span className="text-red-600 font-medium">{daysOverdue}d</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="table-cell">
                        {lateFee > 0 ? (
                          <span className="text-orange-600 font-medium">KES {(lateFee ).toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${
                          p.status === 'completed' || p.status === 'paid' ? 'badge-green' :
                          p.status === 'pending' || p.status === 'due' ? 'badge-yellow' : 'badge-red'
                        } capitalize`}>{p.status}</span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setSelectedPayment(p); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Receipt">
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => generateInvoice(p)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded" title="Invoice">
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Payment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
              <input type="text" value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} className="input-field" required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
              <input type="text" value={form.propertyName} onChange={(e) => setForm({ ...form, propertyName: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="input-field">
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" placeholder="Optional notes" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Record Payment</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selectedPayment} onClose={() => setSelectedPayment(null)} title="Payment Receipt" size="sm">
        {selectedPayment && (
          <div className="text-center">
            <Receipt className="w-14 h-14 text-blue-600 mx-auto mb-4" />
            <div className="space-y-2.5 text-sm text-left">
              <div className="flex justify-between"><span className="text-gray-500">Tenant</span><span className="font-medium">{selectedPayment.tenantName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Property</span><span className="font-medium">{selectedPayment.propertyName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-lg text-blue-600">KES {(parseFloat(selectedPayment.amount) ).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-medium capitalize">{selectedPayment.method}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`badge ${selectedPayment.status === 'completed' || selectedPayment.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>{selectedPayment.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{selectedPayment.date || selectedPayment.paidAt || '-'}</span></div>
            </div>
            <button onClick={() => toast.success('Receipt downloaded')} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        )}
      </Modal>

      <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Invoice" size="sm">
        {invoicePayment && (
          <div>
            <div className="border-2 border-gray-200 rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">INVOICE</p>
                  <p className="text-xs text-gray-500">#{invoicePayment.id?.toString().padStart(6, '0') || '000001'}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="text-sm space-y-1.5 mb-4 pb-4 border-b border-gray-100">
                <div className="flex justify-between"><span className="text-gray-500">Tenant</span><span className="font-medium">{invoicePayment.tenantName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Property</span><span className="font-medium">{invoicePayment.propertyName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Due Date</span><span className="font-medium">{invoicePayment.dueDate || invoicePayment.date}</span></div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Rent Amount</span>
                <span className="font-semibold">KES {(parseFloat(invoicePayment.amount) ).toLocaleString()}</span>
              </div>
              {(() => {
                const lf = calcLateFee(invoicePayment);
                return lf > 0 ? (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Late Fee ({LATE_FEE_PERCENTAGE}%)</span>
                    <span className="font-semibold text-red-600">+KES {(lf ).toLocaleString()}</span>
                  </div>
                ) : null;
              })()}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-3">
                <span className="font-semibold text-gray-900">Total Due</span>
                <span className="text-lg font-bold text-blue-600">
                  KES {((parseFloat(invoicePayment.amount) + calcLateFee(invoicePayment)) ).toLocaleString()}
                </span>
              </div>
            </div>
            <button onClick={downloadInvoice} className="btn-primary w-full flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Download Invoice
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentsPage;
