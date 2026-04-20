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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Check for admin roles
        const adminEmail = 'admin@admin.com';
        const productAdminEmail = 'login@admin.com';
        const productAdminUid = '9LGdqksF7UP4IG9KCh3Cj7pK0xA3';

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const dbRole = userDoc.exists() ? userDoc.data().role : null;

          // Both full admin and product manager should have 'admin' role for Firestore compatibility
          // But we distinguish them in the UI via canManageOrders
          if (
            dbRole === 'admin' || 
            user.email?.toLowerCase() === adminEmail || 
            (user.email?.toLowerCase() === productAdminEmail && user.uid === productAdminUid)
          ) {
            setUserRole('admin');
          } else {
            setUserRole('user');
          }
        } catch (error) {
          console.error("Error fetching user role", error);
          if (user.email?.toLowerCase() === adminEmail) setUserRole('admin');
          else if (user.email?.toLowerCase() === productAdminEmail && user.uid === productAdminUid) setUserRole('admin');
          else setUserRole('user');
        }
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
    // Normal Firebase flow
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    const adminEmail = 'admin@admin.com';
    const productAdminEmail = 'login@admin.com';
    const productAdminUid = '9LGdqksF7UP4IG9KCh3Cj7pK0xA3';

    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    let role = userDoc.exists() ? (userDoc.data().role || 'user') : 'user';
    
    if (
      result.user.email?.toLowerCase() === adminEmail || 
      (result.user.email?.toLowerCase() === productAdminEmail && result.user.uid === productAdminUid)
    ) {
      role = 'admin';
    }
    
    // Update local state immediately
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
    canManageOrders: userRole === 'admin' && currentUser?.email?.toLowerCase() !== 'login@admin.com',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
