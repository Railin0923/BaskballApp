import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'login') {
      const err = await signIn(email, password);
      if (err) setError(err.message);
    } else {
      const err = await signUp(email, password);
      if (err) setError(err.message);
      else setSuccess('Account created! You are now signed in.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4">
            <Activity size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">CourtVision</h1>
          <p className="text-slate-400 mt-1">Basketball Analytics Platform</p>
        </div>

        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex gap-1 p-1 bg-slate-800 rounded-xl mb-6">
            <button onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              Sign In
            </button>
            <button onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              Register
            </button>
          </div>

          {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2 mb-4">{error}</p>}
          {success && <p className="text-green-400 text-sm bg-green-900/20 border border-green-800 rounded-lg px-3 py-2 mb-4">{success}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold transition-colors disabled:opacity-50 mt-1">
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-slate-600 text-xs text-center mt-6">
          Secure analytics powered by Supabase
        </p>
      </div>
    </div>
  );
}
