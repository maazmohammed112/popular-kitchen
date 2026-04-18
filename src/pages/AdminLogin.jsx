import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, currentUser, isAdmin } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  // If already logged in as admin, redirect
  if (currentUser && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      // AuthContext handles setting isAdmin
      showSuccess("Welcome to the Admin Dashboard");
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      showError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 animate-[slideUp_0.4s_ease-out]">
      <div className="w-full max-w-md bg-pk-surface p-8 rounded-3xl shadow-2xl border border-pk-bg-secondary relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pk-accent/20 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-pk-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 border border-pk-accent/30">
            <FiLock className="text-pk-accent" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-pk-text-main mb-2">Admin Portal</h1>
          <p className="text-sm text-pk-text-muted">Enter your credentials to manage the store.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-pk-text-muted mb-2">Email / Username</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 focus:outline-none focus:border-pk-accent"
              placeholder="admin@popularkitchen.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-pk-text-muted mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 focus:outline-none focus:border-pk-accent"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-pk-accent text-white font-bold rounded-xl shadow-[0_0_15px_rgba(30,144,255,0.3)] hover:shadow-[0_0_25px_rgba(30,144,255,0.5)] transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
