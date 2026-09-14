import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  Building2, Plus, Search, MapPin, Home, Users,
  Edit, Trash2, Camera, X, Image as ImageIcon,
} from 'lucide-react';

const propertyTypes = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'studio', label: 'Studio' },
  { value: 'office', label: 'Office' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'equipment', label: 'Equipment' },
];

const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: '', address: '', type: 'apartment', units: 1,
    rentAmount: '', status: 'available', description: '', image: '',
  });

  useEffect(() => { loadProperties(); }, []);

  const loadProperties = async () => {
    try {
      const res = await api.properties.getAll();
      console.log('Properties API response:', res);
      const data = Array.isArray(res) ? res : res.results || res.data || [];
      console.log('Parsed properties data:', data);
      setProperties(data);
    } catch (err) {
      console.error('Failed to load properties:', err);
      setProperties([]);
    } finally { setLoading(false); }
  };

  const filtered = properties.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setForm({ ...form, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.address) { toast.error('Please fill required fields'); return; }
    if (submitting) return;
    setSubmitting(true);
    const payload = {
      name: form.name,
      address: form.address,
      type: form.type,
      total_units: form.total_units || form.units || 1,
      status: form.status || 'available',
      description: form.description || '',
      image_url: form.image || '',
    };
    try {
      if (editing) {
        await api.properties.update(editing.id, payload);
        toast.success('Property updated');
      } else {
        await api.properties.create(payload);
        toast.success('Property created');
      }
      setShowModal(false);
      resetForm();
      await loadProperties();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      toast.error(`Failed to save property: ${msg}`);
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this property? This action cannot be undone.')) return;
    try {
      await api.properties.delete(id);
      toast.success('Property deleted');
      loadProperties();
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (property) => {
    setEditing(property);
    setForm({
      name: property.name || '', address: property.address || '',
      type: property.type || 'apartment', total_units: property.total_units || property.units || 1,
      units: property.total_units || property.units || 1,
      rent_amount: property.rent_amount || property.rentAmount || '',
      rentAmount: property.rent_amount || property.rentAmount || '',
      status: property.status || 'available',
      description: property.description || '', image: property.image || '',
    });
    setImagePreview(property.image || null);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', address: '', type: 'apartment', total_units: 1, units: 1, rent_amount: '', rentAmount: '', status: 'available', description: '', image: '' });
    setImagePreview(null);
  };

  const statusBadge = (status) => {
    const map = { available: 'badge-green', occupied: 'badge-blue', reserved: 'badge-yellow', maintenance: 'badge-red' };
    return <span className={map[status] || 'badge-gray'}>{status}</span>;
  };

  const typeLabel = (type) => propertyTypes.find(t => t.value === type)?.label || type;

  const vacantCount = properties.filter(p => p.status === 'available').length;
  const occupiedCount = properties.filter(p => p.status === 'occupied').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="page-heading">Properties</h2>
          <p className="page-subtitle">{properties.length} properties · {occupiedCount} occupied · {vacantCount} available</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name or address..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-primary pl-9" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-primary sm:w-40">
          <option value="all">All Types</option>
          {propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-primary sm:w-40">
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No properties found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="card-hover overflow-hidden">
              <div className="h-36 bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center relative">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-gray-300" />
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 bg-white/90 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white shadow-sm">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-white/90 rounded-lg text-gray-500 hover:text-red-600 hover:bg-white shadow-sm">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute top-2 left-2">{statusBadge(p.status)}</div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{p.name}</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{typeLabel(p.type)}</span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" /> {p.address}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Home className="w-3 h-3" /> {p.total_units || p.units || 0} units</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-base font-bold text-blue-600">KES {(parseInt(p.rent_amount || p.rentAmount || 0)).toLocaleString()}/mo</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editing ? 'Edit Property' : 'Add Property'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <div onClick={() => fileRef.current?.click()}
              className="w-28 h-28 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-gray-300" />
                  <span className="text-[10px] text-gray-400 mt-1">Add Photo</span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field" required placeholder="e.g. Sunset Apartments" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input-field" required placeholder="Full property address" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                {propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
              <input type="number" min="1" value={form.total_units || form.units || 1} onChange={(e) => setForm({ ...form, total_units: parseInt(e.target.value) || 1, units: parseInt(e.target.value) || 1 })}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rent Amount (KES) *</label>
              <input type="number" min="0" step="0.01" value={form.rent_amount || form.rentAmount || ''}
                onChange={(e) => setForm({ ...form, rent_amount: e.target.value, rentAmount: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
              <input type="url" value={form.image} onChange={(e) => { setForm({ ...form, image: e.target.value }); setImagePreview(e.target.value); }}
                className="input-field" placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field" rows="2" placeholder="Property details, amenities, notes..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Saving...' : editing ? 'Update' : 'Create'} Property</button>
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PropertiesPage;
