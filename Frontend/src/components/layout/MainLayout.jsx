import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, Users, Wrench, CreditCard,
  Settings, LogOut, Menu, X, Bell, ChevronDown,
  BarChart3, FileText, Megaphone, MessageCircle, Home,
  DollarSign,
} from 'lucide-react';

const sidebarItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin','staff','manager','tenant','landlord'] },
  { to: '/properties', label: 'Properties', icon: Building2, roles: ['admin','staff','manager','landlord'] },
  { to: '/tenants', label: 'Tenants', icon: Users, roles: ['admin','staff','manager','landlord'] },
  { to: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin','staff','manager','tenant','landlord'] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['admin','staff','manager','tenant','landlord'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin','staff','manager','landlord'] },
  { to: '/expenses', label: 'Expenses', icon: DollarSign, roles: ['admin','staff','manager','landlord'] },
  { to: '/notifications', label: 'Notifications', icon: Megaphone, roles: ['admin','staff','manager','tenant','landlord'] },
  { to: '/documents', label: 'Documents', icon: FileText, roles: ['admin','staff','manager','tenant','landlord'] },
  { to: '/chat', label: 'Chat', icon: MessageCircle, roles: ['admin','staff','manager','tenant','landlord'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin','staff','manager','tenant','landlord'] },
];

const mobileNav = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/maintenance', label: 'Requests', icon: Wrench },
  { to: '/chat', label: 'Messages', icon: MessageCircle },
  { to: '/settings', label: 'Profile', icon: Settings },
];

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = sidebarItems.find(n => location.pathname.startsWith(n.to))?.label || 'Dashboard';

  const visibleSidebar = sidebarItems.filter(
    item => item.roles.some(r => hasRole(r) || user?.role === r)
  );

  const matchingMobile = mobileNav.find(n => location.pathname.startsWith(n.to));
  const activeMobileIdx = matchingMobile ? mobileNav.indexOf(matchingMobile) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-3 h-16 px-5 border-b border-gray-200 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">RentalSync</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scroll-hide">
          <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Main Menu</p>
          {visibleSidebar.slice(0, 6).map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }>
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </NavLink>
          ))}
          <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Other</p>
          {visibleSidebar.slice(6).map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }>
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-gray-400 capitalize truncate">{user?.role || ''}</p>
            </div>
            <button onClick={logout} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden -ml-1 p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-gray-900">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <NavLink to="/notifications" className="relative p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </NavLink>

            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100">
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium">{user?.name || 'User'}</span>
                <ChevronDown className="w-3.5 h-3.5 hidden sm:block text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-20 py-1 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 rounded-full capitalize">
                        {user?.role || 'User'}
                      </span>
                    </div>
                    <NavLink to="/settings" onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Settings
                    </NavLink>
                    <button onClick={() => { setUserMenuOpen(false); logout(); }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="mobile-bottom-nav">
        {mobileNav.map((item, i) => {
          const isActive = location.pathname.startsWith(item.to) && (i === 0 ? location.pathname === '/dashboard' || location.pathname === '/' : true);
          return (
            <button key={item.to} onClick={() => navigate(item.to)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}>
              <item.icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MainLayout;
