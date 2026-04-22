import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [loading, setLoading] = useState(true);

  const getRole = async (user) => {
    if (!user) return 'user';
    
    const superAdmins = ['admin@admin.com', 'login@admin.com'];
    const productAdminEmail = 'admin@login.com';
    const productAdminUid = '9LGdqksF7UP4IG9KCh3Cj7pK0xA3';

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const dbRole = userDoc.exists() ? userDoc.data().role : null;

      if (
        dbRole === 'admin' || 
        superAdmins.includes(user.email?.toLowerCase()) || 
        (user.email?.toLowerCase() === productAdminEmail && user.uid === productAdminUid)
      ) {
        return 'admin';
      }
    } catch (error) {
      console.error("Error fetching user role", error);
      if (superAdmins.includes(user.email?.toLowerCase())) return 'admin';
      if (user.email?.toLowerCase() === productAdminEmail && user.uid === productAdminUid) return 'admin';
    }
    return 'user';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = await getRole(user);
        setCurrentUser(user);
        setUserRole(role);
      } else {
        // Logged out
        setCurrentUser(null);
        setUserRole('user');
        
        // Handle HARDCODED ADMIN (mock session via localStorage)
        if (localStorage.getItem('pk_hardcoded_admin') === 'true') {
          setCurrentUser({ uid: 'mock-admin', email: 'admin@admin.com', displayName: 'Mock Admin' });
          setUserRole('admin');
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const role = await getRole(result.user);
    
    // Update local state immediately for faster UI response
    setCurrentUser(result.user);
    setUserRole(role);
    
    return { user: result.user, role };
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    userRole,
    login,
    logout,
    isAdmin: userRole === 'admin',
    canManageOrders: userRole === 'admin' && currentUser?.email?.toLowerCase() !== 'admin@login.com',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
