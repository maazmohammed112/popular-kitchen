import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

// After sign-up, migrate any guest cart/orders from localStorage to Firestore
const migrateGuestDataToFirebase = async (user) => {
  try {
    // Migrate guest orders
    const guestOrders = JSON.parse(localStorage.getItem('pk_guest_orders') || '[]');
    for (const order of guestOrders) {
      if (order.id) {
        // Update existing Firestore order to link to user
        await setDoc(doc(db, 'orders', order.id), { userId: user.uid }, { merge: true });
      }
    }

    // Migrate shipping info
    const shipping = localStorage.getItem('pk_guest_shipping');
    if (shipping) {
      await setDoc(doc(db, 'users', user.uid), { shippingDetails: JSON.parse(shipping) }, { merge: true });
    }

    // Clear guest data now that it's linked
    localStorage.removeItem('pk_guest_orders');
    localStorage.removeItem('pk_guest_shipping');
  } catch (e) {
    console.error('Migration error:', e);
  }
};

export const AuthModal = ({ onClose, defaultTab = 'signin' }) => {
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { showSuccess, showError } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const isNew = result._tokenResponse?.isNewUser;
      if (isNew) await migrateGuestDataToFirebase(result.user);
      
      // Check for admin redirect
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      const role = userDoc.exists() ? userDoc.data().role : 'user';
      
      showSuccess(`Welcome, ${result.user.displayName}!`);
      onClose();
      
      if (role === 'admin') {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        showError(err.message.replace('Firebase: ', '').replace(/\(.*\)/, '').trim());
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.name });
        await migrateGuestDataToFirebase(cred.user);
        showSuccess('Account created! Welcome to Popular Kitchen 🎉');
        onClose();
      } else {
        const { role } = await login(form.email, form.password);
        showSuccess('Signed in successfully!');
        onClose();
        if (role === 'admin') {
          navigate('/admin/dashboard');
        }
      }
    } catch (err) {
      showError(err.message.replace('Firebase: ', '').replace(/\(.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-pk-surface border border-pk-bg-secondary rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-[slideUp_0.3s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* Logo */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Popular Kitchen" className="h-8 object-contain" onError={e => e.target.style.display='none'} />
            <div>
              <p className="font-bold text-sm text-pk-text-main leading-tight">Popular Kitchen</p>
              <p className="text-[10px] text-pk-text-muted">Official Store</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-pk-text-muted hover:text-pk-text-main rounded-full hover:bg-pk-bg-secondary transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <h2 className="text-xl font-bold text-pk-text-main mb-1">
          {tab === 'signin' ? 'Welcome Back!' : 'Create Account'}
        </h2>
        <p className="text-xs text-pk-text-muted mb-5">
          {tab === 'signin' ? 'Sign in to track orders & get exclusive offers.' : 'Sign up to save orders, address & get better deals.'}
        </p>

        {/* Google Sign In */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 border border-pk-bg-secondary rounded-xl text-sm font-medium text-pk-text-main hover:bg-pk-bg-primary transition-colors mb-4 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {googleLoading ? 'Connecting...' : `Continue with Google`}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-pk-bg-secondary" />
          <span className="text-xs text-pk-text-muted">or</span>
          <div className="flex-1 h-px bg-pk-bg-secondary" />
        </div>

        {/* Tabs */}
        <div className="flex bg-pk-bg-primary rounded-xl p-1 mb-4">
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'signin' ? 'bg-pk-accent text-white' : 'text-pk-text-muted hover:text-pk-text-main'}`}
          >Sign In</button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'signup' ? 'bg-pk-accent text-white' : 'text-pk-text-muted hover:text-pk-text-main'}`}
          >Sign Up</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {tab === 'signup' && (
            <div className="relative">
              <FiUser className="absolute left-3 top-3.5 text-pk-text-muted" size={15} />
              <input name="name" type="text" placeholder="Full Name" required value={form.name} onChange={handle}
                className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl pl-9 pr-4 py-3 text-sm focus:border-pk-accent outline-none" />
            </div>
          )}
          <div className="relative">
            <FiMail className="absolute left-3 top-3.5 text-pk-text-muted" size={15} />
            <input name="email" type="email" placeholder="Email address" required value={form.email} onChange={handle}
              className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl pl-9 pr-4 py-3 text-sm focus:border-pk-accent outline-none" />
          </div>
          <div className="relative">
            <FiLock className="absolute left-3 top-3.5 text-pk-text-muted" size={15} />
            <input name="password" type={showPass ? 'text' : 'password'} placeholder="Password (min 6 chars)" required
              value={form.password} onChange={handle} minLength={6}
              className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl pl-9 pr-10 py-3 text-sm focus:border-pk-accent outline-none" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-pk-text-muted">
              {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            </button>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-pk-accent text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors disabled:opacity-60 shadow-[0_0_15px_rgba(30,144,255,0.25)]"
          >
            {loading ? 'Please wait...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-pk-text-muted mt-4">
          {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')} className="text-pk-accent hover:underline font-medium">
            {tab === 'signin' ? 'Sign Up Free' : 'Sign In'}
          </button>
        </p>

        <p className="text-center text-[10px] text-pk-text-muted mt-3">
          By continuing, you agree to our{' '}
          <a href="/terms" target="_blank" className="underline hover:text-pk-text-main">Terms</a> &amp;{' '}
          <a href="/privacy" target="_blank" className="underline hover:text-pk-text-main">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};
