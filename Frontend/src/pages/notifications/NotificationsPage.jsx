import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Megaphone, Send, Mail, MessageSquare, Bell,
  CheckCheck, Trash2, Smartphone, AlertCircle,
} from 'lucide-react';

const WrenchIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-7.75 7.75a2 2 0 01-2.83-2.83l7.75-7.75a6 6 0 115.66-5.66l-7.75 7.75a2 2 0 002.83 2.83l7.75-7.75a6 6 0 11-5.66 5.66z" />
  </svg>
);

const notificationTypes = [
  { id: 'rent_due', label: 'Rent Due Reminders', icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'payment_received', label: 'Payment Received', icon: CheckCheck, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'maintenance_update', label: 'Maintenance Updates', icon: WrenchIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'lease_renewal', label: 'Lease Renewal', icon: Bell, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showSendModal, setShowSendModal] = useState(false);
  const [settings, setSettings] = useState({
    email: true, sms: true, push: true, rent_due: true,
    payment_received: true, maintenance_update: true, lease_renewal: true,
  });
  const [sendForm, setSendForm] = useState({
    type: 'email', subject: '', message: '', recipientType: 'all',
  });

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, []);

  const loadNotifications = async () => {
    try {
      const params = activeTab !== 'all' ? { type: activeTab } : {};
      const res = await api.notifications.getAll(params);
      const data = Array.isArray(res) ? res : res.results || res.data || [];
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally { setLoading(false); }
  };

  const loadSettings = async () => {
    try {
      const res = await api.notifications.getSettings();
      if (res) setSettings(res.data || res);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead(user?.uid);
      toast.success('All marked as read');
      loadNotifications();
    } catch { toast.error('Failed to update'); }
  };

  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await api.notifications.updateSettings(updated);
      toast.success('Settings updated');
    } catch { toast.error('Failed to save'); }
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    try {
      await api.notifications.send(sendForm);
      toast.success('Notification sent');
      setShowSendModal(false);
      setSendForm({ type: 'email', subject: '', message: '', recipientType: 'all' });
    } catch { toast.error('Failed to send'); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const tabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'rent_due', label: 'Rent', icon: AlertCircle },
    { id: 'maintenance_update', label: 'Maintenance', icon: WrenchIcon },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-500 text-sm mt-1">SMS, email, and push notification management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAllRead}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
          <button onClick={() => setShowSendModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1.5">
            <Send className="w-4 h-4" /> Send Notification
          </button>
        </div>
      </div>

      {/* Settings Toggle Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'email', label: 'Email Alerts', icon: Mail },
          { key: 'sms', label: 'SMS Alerts', icon: MessageSquare },
          { key: 'push', label: 'Push Notifications', icon: Smartphone },
        ].map(item => (
          <button key={item.key} onClick={() => updateSetting(item.key, !settings[item.key])}
            className={`p-4 rounded-xl border text-left transition-colors ${
              settings[item.key] ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
            }`}>
            <div className={`p-2 rounded-lg w-fit mb-2 ${settings[item.key] ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <item.icon className={`w-4 h-4 ${settings[item.key] ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <p className={`text-sm font-medium ${settings[item.key] ? 'text-blue-900' : 'text-gray-600'}`}>{item.label}</p>
            <p className={`text-xs mt-0.5 ${settings[item.key] ? 'text-blue-500' : 'text-gray-400'}`}>
              {settings[item.key] ? 'Enabled' : 'Disabled'}
            </p>
          </button>
        ))}
      </div>

      {/* Notification Type Preferences */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          {notificationTypes.map(nt => (
            <div key={nt.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${nt.bg}`}><nt.icon className={`w-4 h-4 ${nt.color}`} /></div>
                <span className="text-sm text-gray-700">{nt.label}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings[nt.id]}
                  onChange={(e) => updateSetting(nt.id, e.target.checked)}
                  className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); loadNotifications(); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(activeTab === 'unread' ? notifications.filter(n => !n.read) : notifications).map(n => (
            <div key={n.id} className={`bg-white rounded-xl border p-4 transition-colors ${!n.read ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg mt-0.5 ${n.type === 'rent_due' ? 'bg-yellow-50' : n.type === 'payment_received' ? 'bg-green-50' : n.type === 'maintenance_update' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                  <Bell className={`w-4 h-4 ${!n.read ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.subject || n.title}</p>
                    <span className="text-xs text-gray-400 shrink-0">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{n.message || n.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400 capitalize">{n.type?.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className={`text-xs capitalize ${n.channel === 'email' ? 'text-blue-500' : n.channel === 'sms' ? 'text-green-500' : 'text-purple-500'}`}>
                      {n.channel || 'push'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowSendModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Notification</h3>
            <form onSubmit={sendNotification} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={sendForm.type} onChange={(e) => setSendForm({ ...sendForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push Notification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                  <select value={sendForm.recipientType} onChange={(e) => setSendForm({ ...sendForm, recipientType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="all">All Tenants</option>
                    <option value="overdue">Overdue Tenants</option>
                    <option value="specific">Specific Tenant</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" value={sendForm.subject} onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="4" required />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  Send
                </button>
                <button type="button" onClick={() => setShowSendModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
