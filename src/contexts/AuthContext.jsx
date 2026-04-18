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
    // Normal Firebase flow
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Explicitly fetch role here for immediate use after login
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    const role = userDoc.exists() ? (userDoc.data().role || 'user') : 'user';
    
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
