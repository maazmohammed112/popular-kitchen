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
        
        // Check for admin role - Hardcoded override + Firestore check
        const adminEmails = ['login@admin.com', 'admin@admin.com'];
        const isEmailAdmin = adminEmails.includes(user.email.toLowerCase());

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setUserRole('admin');
          } else if (isEmailAdmin) {
            setUserRole('admin');
          } else {
            setUserRole('user');
          }
        } catch (error) {
          console.error("Error fetching user role", error);
          setUserRole(isEmailAdmin ? 'admin' : 'user');
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
    
    // Check for admin role - Hardcoded override + Firestore check
    const adminEmails = ['login@admin.com', 'admin@admin.com'];
    const isEmailAdmin = adminEmails.includes(result.user.email.toLowerCase());

    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    let role = userDoc.exists() ? (userDoc.data().role || 'user') : 'user';
    
    if (isEmailAdmin) {
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
