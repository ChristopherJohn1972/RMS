import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  DollarSign, Plus, Search, Trash2, Edit,
  TrendingDown, TrendingUp, FileText,
  Tag, Calendar,
} from 'lucide-react';

const categories = [
  'Utilities', 'Maintenance', 'Repairs', 'Cleaning',
  'Insurance', 'Property Tax', 'Management Fees',
  'Marketing', 'Legal', 'Supplies', 'Other',
];

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Utilities', date: '', notes: '', propertyName: '' });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    setExpenses([
      { id: '1', description: 'Water bill - Sunset Apts', amount: 340, category: 'Utilities', date: '2026-05-15', notes: 'Monthly water bill' },
      { id: '2', description: 'Plumber repair - Oak Villa', amount: 180, category: 'Repairs', date: '2026-05-12', notes: 'Fixed leaking pipe unit 7A' },
      { id: '3', description: 'Electricity - Downtown Complex', amount: 520, category: 'Utilities', date: '2026-05-10', notes: 'KPLC bill' },
      { id: '4', description: 'Cleaning service', amount: 200, category: 'Cleaning', date: '2026-05-08', notes: 'Common areas' },
      { id: '5', description: 'Property insurance', amount: 750, category: 'Insurance', date: '2026-05-01', notes: 'Quarterly premium' },
      { id: '6', description: 'Garden maintenance', amount: 150, category: 'Maintenance', date: '2026-04-28', notes: 'Lawn mowing and trimming' },
    ]);
    setLoading(false);
  };

  const filtered = expenses.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = e.description?.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q);
    const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) { toast.error('Description and amount required'); return; }
    if (editing) {
      setExpenses(prev => prev.map(e => e.id === editing.id ? { ...e, ...form, id: e.id } : e));
      toast.success('Expense updated');
    } else {
      setExpenses(prev => [...prev, { id: Date.now().toString(), ...form }]);
      toast.success('Expense added');
    }
    setShowModal(false);
    setEditing(null);
    setForm({ description: '', amount: '', category: 'Utilities', date: new Date().toISOString().split('T')[0], notes: '', propertyName: '' });
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this expense?')) return;
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success('Expense deleted');
  };

  const openEdit = (expense) => {
    setEditing(expense);
    setForm({
      description: expense.description || '',
      amount: expense.amount || '',
      category: expense.category || 'Utilities',
      date: expense.date || '',
      notes: expense.notes || '',
      propertyName: expense.propertyName || '',
    });
    setShowModal(true);
  };

  const categoryTotals = categories.map(cat => ({
    category: cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
    count: expenses.filter(e => e.category === cat).length,
  })).filter(c => c.count > 0).sort((a, b) => b.total - a.total);

  const monthlyTotal = expenses.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="page-heading">Expenses</h2>
          <p className="page-subtitle">{expenses.length} entries · KES {(totalExpenses ).toLocaleString()} total</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ description: '', amount: '', category: 'Utilities', date: new Date().toISOString().split('T')[0], notes: '', propertyName: '' }); setShowModal(true); }}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">Total Expenses</p>
          <p className="stat-value text-red-600">KES {(totalExpenses ).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">This Month</p>
          <p className="stat-value text-orange-600">KES {(monthlyTotal ).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Categories</p>
          <p className="stat-value text-gray-900">{categoryTotals.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg per Entry</p>
          <p className="stat-value text-gray-900">KES {expenses.length ? Math.round((totalExpenses / expenses.length) ).toLocaleString() : 0}</p>
        </div>
      </div>

      {categoryTotals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categoryTotals.map(c => (
            <div key={c.category} className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xs text-gray-500">{c.category}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">KES {(c.total ).toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">{c.count} entries</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search expenses..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-primary pl-9" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-primary sm:w-44">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No expenses found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="table-header">Description</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Notes</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{e.description}</td>
                    <td className="table-cell">
                      <span className="badge-blue text-[11px]">{e.category}</span>
                    </td>
                    <td className="table-cell font-semibold text-red-600">KES {(parseFloat(e.amount) ).toLocaleString()}</td>
                    <td className="table-cell text-gray-500">{e.date}</td>
                    <td className="table-cell text-gray-400 text-xs max-w-[200px] truncate">{e.notes || '-'}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(e.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field" required placeholder="e.g. Water bill - Sunset Apts" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD) *</label>
              <input type="number" min="0" step="0.01" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property (optional)</label>
              <input type="text" value={form.propertyName} onChange={(e) => setForm({ ...form, propertyName: e.target.value })}
                className="input-field" placeholder="e.g. Sunset Apts" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-field" rows="2" placeholder="Optional details" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Add'} Expense</button>
            <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
