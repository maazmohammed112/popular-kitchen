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
        // Check for admin role
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'user');
          } else {
            setUserRole('user');
          }
        } catch (error) {
          console.error("Error fetching user role", error);
          setUserRole('user');
        }
      } else {
        // Logged out
        setCurrentUser(null);
        setUserRole('user');
        
        // Handle HARDCODED ADMIN (mock session via localStorage)
        // This handles cases where user bypasses firebase auth entirely
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
    // Hardcoded Admin logic check requested by user
    if (email === 'admin' && password === 'admin') {
      localStorage.setItem('pk_hardcoded_admin', 'true');
      setCurrentUser({ uid: 'mock-admin', email: 'admin@popularkitchen.com', displayName: 'Mock Admin' });
      setUserRole('admin');
      return;
    }
    
    // Normal Firebase flow
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (localStorage.getItem('pk_hardcoded_admin')) {
      localStorage.removeItem('pk_hardcoded_admin');
      setCurrentUser(null);
      setUserRole('user');
    } else {
      await signOut(auth);
    }
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
