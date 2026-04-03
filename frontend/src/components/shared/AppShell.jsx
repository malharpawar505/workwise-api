import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import {
  Clock, LayoutDashboard, Table2, Sun, Moon, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/records', icon: Table2, label: 'Records' },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block">WorkWise</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                      : 'text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-white'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark(!dark)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title="Toggle theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-surface-200 dark:border-surface-800">
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight">{user?.name}</p>
                <p className="text-xs text-surface-300">{user?.department || 'Employee'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 animate-in">
            <div className="p-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                        : 'text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
              <div className="border-t border-surface-200 dark:border-surface-800 pt-3 mt-3">
                <div className="px-4 py-2">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-surface-300">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-all"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
