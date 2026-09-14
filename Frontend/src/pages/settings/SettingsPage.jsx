import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Shield, Bell, Lock, Palette, Save, Smartphone, Key, CheckCircle } from 'lucide-react';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const otpInputs = React.useRef([]);
  const [profile, setProfile] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
  });

  const handleSave = () => toast.success('Settings saved');

  const enable2FA = () => {
    setShowOtpModal(true);
    toast.success('OTP sent to your phone');
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otpCode];
    newOtp[i] = val;
    setOtpCode(newOtp);
    if (val && i < 5) otpInputs.current[i + 1]?.focus();
  };

  const verifyOtp = () => {
    const code = otpCode.join('');
    if (code.length !== 6) { toast.error('Enter complete 6-digit code'); return; }
    setTwoFactorEnabled(true);
    setShowOtpModal(false);
    setOtpCode(['', '', '', '', '', '']);
    toast.success('Two-factor authentication enabled');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="page-heading">Settings</h2>
        <p className="page-subtitle">Manage your account, security, and preferences</p>
      </div>

      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{user?.name || 'User'}</h3>
                <p className="text-sm text-gray-500 capitalize">{user?.role || 'User'} · {user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input-field" />
              </div>
            </div>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Change Password</h3>
              <p className="text-sm text-gray-500 mb-4">Update your account password</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
              </div>
              <button onClick={() => toast.success('Password updated')} className="btn-primary mt-4">Update Password</button>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">Two-Factor Authentication (2FA)</h3>
              <p className="text-sm text-gray-500 mb-4">Add an extra layer of security to your account</p>
              <div className="flex items-center justify-between max-w-lg p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Authenticator App</p>
                    <p className="text-xs text-gray-500">Use an app to generate OTP codes</p>
                  </div>
                </div>
                {twoFactorEnabled ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <CheckCircle className="w-4 h-4" /> Enabled
                  </span>
                ) : (
                  <button onClick={enable2FA} className="btn-secondary text-sm px-4 py-1.5">Enable</button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {[
              { label: 'Payment confirmations', desc: 'Get notified when payments are received' },
              { label: 'Maintenance updates', desc: 'Updates on maintenance request status' },
              { label: 'Lease reminders', desc: 'Reminders about upcoming lease renewals' },
              { label: 'Monthly reports', desc: 'Monthly summary reports via email' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Theme</h3>
              <p className="text-sm text-gray-500 mb-4">Customize the interface appearance</p>
              <div className="flex gap-3">
                {['Light', 'Dark', 'System'].map(theme => (
                  <button key={theme}
                    className="px-6 py-3 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm font-medium">
                    {theme}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowOtpModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6">
            <div className="text-center mb-6">
              <Key className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Verify OTP</h3>
              <p className="text-sm text-gray-500 mt-1">Enter the 6-digit code sent to your phone</p>
            </div>
            <div className="flex justify-center gap-2 mb-6">
              {otpCode.map((digit, i) => (
                <input key={i} ref={el => otpInputs.current[i] = el} type="text" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => { if (e.key === 'Backspace' && !digit && i > 0) otpInputs.current[i - 1]?.focus(); }}
                  className="w-10 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none" />
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={verifyOtp} className="btn-primary flex-1">Verify</button>
              <button onClick={() => setShowOtpModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">Did not receive code? <button className="text-blue-600 hover:underline font-medium">Resend</button></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
