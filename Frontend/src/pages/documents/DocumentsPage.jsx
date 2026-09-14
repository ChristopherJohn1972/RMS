import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FileText, Upload, Download, Trash2, Search,
  File, Image, FileSpreadsheet, FileArchive,
} from 'lucide-react';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadDocuments(); }, []);

  const loadDocuments = async () => {
    try {
      const res = await api.documents.getAll();
      setDocuments(res.data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    try {
      await api.documents.upload(formData);
      toast.success('Document uploaded successfully');
      loadDocuments();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Unable to upload document. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.documents.delete(id);
      toast.success('Document deleted');
      loadDocuments();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Unable to delete document. Please try again.');
    }
  };

  const handleDownload = async (doc) => {
    try {
      const url = api.documents.download(doc.id);
      window.open(url, '_blank');
      toast.success(`Downloading ${doc.name}`);
    } catch (err) {
      toast.error('Unable to download document. Please try again.');
    }
  };

  const getFileIcon = (type) => {
    if (!type) return File;
    if (type.startsWith('image/')) return Image;
    if (type.includes('pdf')) return FileText;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
    if (type.includes('zip') || type.includes('rar')) return FileArchive;
    return File;
  };

  const filtered = documents.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-500 text-sm mt-1">Lease agreements, receipts, contracts, and ID uploads</p>
        </div>
        <div>
          <label className={`px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium cursor-pointer inline-flex items-center gap-1.5 ${uploading ? 'opacity-50' : ''}`}>
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Document'}
            <input type="file" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Category quick filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Lease Agreements', count: documents.filter(d => d.category === 'lease' || d.name?.toLowerCase().includes('lease')).length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Receipts', count: documents.filter(d => d.category === 'receipt' || d.name?.toLowerCase().includes('receipt')).length, icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Contracts', count: documents.filter(d => d.category === 'contract' || d.name?.toLowerCase().includes('contract')).length, icon: FileArchive, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'ID Uploads', count: documents.filter(d => d.category === 'id' || d.name?.toLowerCase().includes('id')).length, icon: Image, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map(cat => (
          <div key={cat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`p-2 rounded-lg w-fit ${cat.bg} mb-2`}><cat.icon className={`w-4 h-4 ${cat.color}`} /></div>
            <p className="text-lg font-bold text-gray-900">{cat.count}</p>
            <p className="text-xs text-gray-500">{cat.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search documents..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No documents found</p>
          <p className="text-sm text-gray-400 mt-1">Upload lease agreements, receipts, or contracts</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filtered.map(doc => {
            const Icon = getFileIcon(doc.type);
            return (
              <div key={doc.id} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <div className="p-2.5 bg-gray-100 rounded-lg">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''}
                    {doc.uploadedAt ? ` • ${new Date(doc.uploadedAt).toLocaleDateString()}` : ''}
                    {doc.category ? ` • ${doc.category}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleDownload(doc)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(doc.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
