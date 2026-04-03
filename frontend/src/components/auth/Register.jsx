import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Clock, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Fill in all required fields.');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.department);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-white to-surface-100 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950">
      <div className="w-full max-w-md animate-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white mb-4 shadow-lg shadow-brand-600/30">
            <Clock size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">WorkWise</h1>
          <p className="text-surface-300 mt-1">Create your account</p>
        </div>

        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6">Get started</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-surface-300">Full Name *</label>
              <input type="text" className="input-field" placeholder="John Doe" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-surface-300">Email *</label>
              <input type="email" className="input-field" placeholder="you@company.com" value={form.email} onChange={set('email')} autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-surface-300">Department</label>
              <input type="text" className="input-field" placeholder="Engineering" value={form.department} onChange={set('department')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-surface-300">Password *</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} className="input-field pr-12" placeholder="Min 6 characters" value={form.password} onChange={set('password')} autoComplete="new-password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300 hover:text-surface-900 dark:hover:text-white transition-colors">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-center">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </span>
              ) : 'Create Account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-surface-300">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
