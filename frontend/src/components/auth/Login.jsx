import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Clock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Fill in all fields.');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-white to-surface-100 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950">
      <div className="w-full max-w-md animate-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white mb-4 shadow-lg shadow-brand-600/30">
            <Clock size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">WorkWise</h1>
          <p className="text-surface-300 mt-1">Employee Time Tracker</p>
        </div>

        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-surface-300">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-surface-300">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300 hover:text-surface-900 dark:hover:text-white transition-colors"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-center">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-300">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 hover:text-brand-700 font-semibold">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-surface-300 mt-6">
          Demo: demo@workwise.app / demo1234
        </p>
      </div>
    </div>
  );
}
