import { useState } from 'react';
import { FiX, FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useToast } from '../contexts/ToastContext';

export const AuthModal = ({ onClose, defaultTab = 'signin' }) => {
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { showSuccess, showError } = useToast();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.name });
        showSuccess('Account created! Welcome to Popular Kitchen.');
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        showSuccess('Signed in successfully!');
      }
      onClose();
    } catch (err) {
      showError(err.message.replace('Firebase: ', '').replace(/\(.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-pk-surface border border-pk-bg-secondary rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-[slideUp_0.3s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-pk-text-main">
              {tab === 'signin' ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p className="text-xs text-pk-text-muted mt-0.5">Popular Kitchen</p>
          </div>
          <button onClick={onClose} className="p-2 text-pk-text-muted hover:text-pk-text-main rounded-full hover:bg-pk-bg-secondary transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-pk-bg-primary rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'signin' ? 'bg-pk-accent text-white' : 'text-pk-text-muted hover:text-pk-text-main'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'signup' ? 'bg-pk-accent text-white' : 'text-pk-text-muted hover:text-pk-text-main'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {tab === 'signup' && (
            <div className="relative">
              <FiUser className="absolute left-3 top-3.5 text-pk-text-muted" size={16} />
              <input
                name="name" type="text" placeholder="Full Name" required
                value={form.name} onChange={handle}
                className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl pl-9 pr-4 py-3 text-sm focus:border-pk-accent outline-none"
              />
            </div>
          )}
          <div className="relative">
            <FiMail className="absolute left-3 top-3.5 text-pk-text-muted" size={16} />
            <input
              name="email" type="email" placeholder="Email address" required
              value={form.email} onChange={handle}
              className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl pl-9 pr-4 py-3 text-sm focus:border-pk-accent outline-none"
            />
          </div>
          <div className="relative">
            <FiLock className="absolute left-3 top-3.5 text-pk-text-muted" size={16} />
            <input
              name="password" type={showPass ? 'text' : 'password'} placeholder="Password" required
              value={form.password} onChange={handle} minLength={6}
              className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl pl-9 pr-10 py-3 text-sm focus:border-pk-accent outline-none"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-pk-text-muted">
              {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-pk-accent text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors disabled:opacity-60 shadow-[0_0_15px_rgba(30,144,255,0.3)]"
          >
            {loading ? 'Please wait...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-pk-text-muted mt-4">
          {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')} className="text-pk-accent hover:underline font-medium">
            {tab === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};
