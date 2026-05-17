import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    display_name: '',
    username: '',
    password: '',
    class_code: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (form.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        display_name: form.display_name.trim(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
        class_code: form.class_code.trim().toUpperCase(),
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-primary tracking-tight">Ngala</div>
            <div className="text-[11px] font-bold text-secondary uppercase tracking-widest">English Hub</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border p-8"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h1 className="text-xl font-extrabold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get your class code from your teacher before registering
          </p>

          {error && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Full Name
              </label>
              <input
                name="display_name"
                type="text"
                value={form.display_name}
                onChange={handleChange}
                placeholder="e.g. John Otieno"
                required
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Username
              </label>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="e.g. john_otieno"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Lowercase letters, numbers and underscores only
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 4 characters"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Class Code
              </label>
              <input
                name="class_code"
                type="text"
                value={form.class_code}
                onChange={handleChange}
                placeholder="e.g. F3L-2026"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition uppercase"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Ask your teacher for this code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

