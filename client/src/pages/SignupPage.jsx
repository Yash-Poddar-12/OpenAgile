import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Network, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    
    setIsLoading(true);
    try {
      const role = await register(name, email, password);
      switch (role) {
        case 'Admin':
          navigate('/admin');
          break;
        case 'ProjectManager':
          navigate('/dashboard');
          break;
        case 'RepoAnalyst':
          navigate('/filemap');
          break;
        case 'Developer':
        case 'Viewer':
        default:
          navigate('/issues');
          break;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0B13] via-[#151522] to-[#0A0A12] flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#4F8EF7]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#43D9AD]/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] bg-[#1A1A24]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/50 relative z-10 my-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#4F8EF7] to-[#43D9AD] rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-[#4F8EF7]/20">
            <Network className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Create Account</h1>
          <p className="text-[#A0A0AB] text-[15px]">Join the File-Map Agile Dev Suite</p>
        </div>

        {error && (
          <div className="mb-5 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-sm p-4 rounded-xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#D1D1D6]">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280] group-focus-within:text-[#4F8EF7] transition-colors" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required
                className="w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#4F8EF7]/50 focus:border-[#4F8EF7] transition-all text-[15px]" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#D1D1D6]">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280] group-focus-within:text-[#4F8EF7] transition-colors" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dev@example.com" required
                className="w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#4F8EF7]/50 focus:border-[#4F8EF7] transition-all text-[15px]" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#D1D1D6]">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280] group-focus-within:text-[#4F8EF7] transition-colors" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required
                className="w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#4F8EF7]/50 focus:border-[#4F8EF7] transition-all text-[15px]" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#D1D1D6]">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280] group-focus-within:text-[#4F8EF7] transition-colors" />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••••••" required
                className="w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#4F8EF7]/50 focus:border-[#4F8EF7] transition-all text-[15px]" />
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full py-3.5 mt-6 bg-gradient-to-r from-[#4F8EF7] to-[#43D9AD] hover:from-[#3D7DE6] hover:to-[#3BC89A] text-white font-medium rounded-xl shadow-lg shadow-[#4F8EF7]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group">
            <span className="text-[15px]">{isLoading ? 'Creating Account...' : 'Create Account'}</span>
            {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>

          <div className="text-center pt-3">
            <p className="text-[15px] text-[#A0A0AB]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#4F8EF7] hover:text-[#78A9F9] font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        </form>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2 relative z-10 mb-4">
        <div className="flex items-center gap-2 text-sm text-[#8E8E9F] bg-black/20 px-4 py-2 rounded-full border border-white/5">
          <div className="w-1.5 h-1.5 bg-[#43D9AD] rounded-full animate-pulse" />
          <p>Access level determined by your assigned role</p>
        </div>
        <p className="text-xs text-[#6B7280] mt-2">v2.4.1-stable • ProjectFlow</p>
      </div>
    </div>
  );
}