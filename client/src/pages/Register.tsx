import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NgalaLogo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

// Open enrolment: any student can join. A teacher's class code is optional.
// Ngala follows the CBC (CBE) senior school syllabus only.
const LEVELS = [
  { id: 'Grade 10', group: 'Senior school' },
  { id: 'Grade 11', group: 'Senior school' },
  { id: 'Grade 12', group: 'Senior school' },
  { id: 'Other', group: 'Just improving' },
];

const inputCls =
  'w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    display_name: '',
    username: '',
    password: '',
    class_code: '',
  });
  const [level, setLevel] = useState<string>('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-z0-9_]+$/i.test(form.username)) {
      setError('Username can only use letters, numbers and underscores');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const code = form.class_code.trim().toUpperCase();
    if (!code && !level) {
      setError('Choose your grade so we can match your syllabus');
      return;
    }

    const chosen = LEVELS.find(l => l.id === level);

    setLoading(true);
    try {
      await register({
        display_name: form.display_name.trim(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
        ...(code ? { class_code: code } : {}),
        ...(chosen ? { curriculum: 'CBE' } : {}),
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center p-6">
      <div className="w-full max-w-[440px]">

        <Link to="/" className="flex justify-center mb-8" aria-label="Ngala home">
          <NgalaLogo animated />
        </Link>

        <div className="bg-card rounded-3xl border border-border p-8 shadow-card">
          <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">Create your free account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Open to every student, anywhere. No class code needed.
          </p>

          {error && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Your name</label>
              <input
                name="display_name"
                type="text"
                value={form.display_name}
                onChange={handleChange}
                placeholder="e.g. Amani"
                required
                autoFocus
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                First name or a nickname is fine. This is what others see on leaderboards.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Username</label>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="e.g. amani_reads"
                required
                autoComplete="username"
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Letters, numbers and underscores only
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
                autoComplete="new-password"
                className={inputCls}
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-semibold text-foreground mb-2">Your grade</legend>
              <div className="grid grid-cols-2 gap-2">
                {LEVELS.map(l => (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    aria-pressed={level === l.id}
                    className={cn(
                      'rounded-xl border-2 px-2 py-2 text-left transition',
                      level === l.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <div className="text-sm font-bold text-ink leading-tight">{l.id}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{l.group}</div>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setShowCode(s => !s)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground"
                aria-expanded={showCode}
              >
                Have a class code from your teacher? <span className="text-muted-foreground font-medium">Optional</span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', showCode && 'rotate-180')} />
              </button>
              {showCode && (
                <div className="px-4 pb-4">
                  <input
                    name="class_code"
                    type="text"
                    value={form.class_code}
                    onChange={handleChange}
                    placeholder="e.g. G10E-2026"
                    className={cn(inputCls, 'uppercase')}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Adds you to your teacher's class and class leaderboard
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-secondary text-ink text-sm font-bold hover:brightness-105 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create my account'}
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
