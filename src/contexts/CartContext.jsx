import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRemoteSynced, setIsRemoteSynced] = useState(false);

  // 1. Initial Load from LocalStorage (Device specific)
  useEffect(() => {
    const savedCart = localStorage.getItem('pk_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (err) {
        console.error("[Cart] Failed to parse local cart", err);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. Real-time Sync with Firestore
  useEffect(() => {
    let unsubscribe;
    if (currentUser && isLoaded) {
      const userRef = doc(db, 'users', currentUser.uid);
      
      unsubscribe = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const remoteCart = snapshot.data().cart || [];
          
          // Initial Merge: Combine local and remote data on first sync
          if (!isRemoteSynced) {
            setCartItems(prevLocal => {
              const merged = [...remoteCart];
              prevLocal.forEach(localItem => {
                const exists = merged.find(ri => ri.productId === localItem.productId && ri.size === localItem.size);
                if (!exists) merged.push(localItem);
              });
              return merged;
            });
            setIsRemoteSynced(true);
          } else {
            // Subsequent Updates: Trust the server (handles changes from other devices)
            setCartItems(prev => {
              // Only update state if data is actually different to avoid render loops
              const isDifferent = JSON.stringify(prev) !== JSON.stringify(remoteCart);
              if (isDifferent) {
                return remoteCart;
              }
              return prev;
            });
          }
        } else {
          // No remote cart exists yet
          setIsRemoteSynced(true);
        }
      }, (error) => {
        console.error("[Cart] Snapshot error:", error.message);
      });
    } else if (!currentUser) {
      setIsRemoteSynced(false);
    }

    return () => { if (unsubscribe) unsubscribe(); };
  }, [currentUser, isLoaded, isRemoteSynced]);

  // 3. Persist Changes (LocalStorage + Firestore)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pk_cart', JSON.stringify(cartItems));
      
      // Save to Firestore for logged-in users
      if (currentUser && isRemoteSynced) {
        const timeoutId = setTimeout(async () => {
          try {
            // SANITIZE: Firestore doesn't allow 'undefined'
            const sanitizedItems = cartItems.map(item => {
              const cleaned = {};
              Object.keys(item).forEach(key => {
                cleaned[key] = item[key] === undefined ? null : item[key];
              });
              return cleaned;
            });

            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, { 
              cart: sanitizedItems, 
              cartUpdatedAt: new Date() 
            }, { merge: true });
          } catch (err) {
            console.error("[Cart] Firestore save failed:", err.message);
          }
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timeoutId);
      }
    }
  }, [cartItems, isLoaded, currentUser, isRemoteSynced]);

  const addToCart = (product) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.productId === product.productId && item.size === product.size);
      if (existingIdx > -1) {
        const newCart = [...prev];
        newCart[existingIdx].quantity += product.quantity || 1;
        return newCart;
      } else {
        // Double check for any weird duplicate that might have slipped in
        const filtered = prev.filter(item => !(item.productId === product.productId && item.size === product.size));
        return [...filtered, { ...product, quantity: product.quantity || 1 }];
      }
    });
  };

  const removeFromCart = (productId, size) => {
    setCartItems(prev => prev.filter(item => !(item.productId === productId && item.size === size)));
  };

  const updateQuantity = (productId, size, quantity) => {
    if (quantity < 1) return;
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.productId === productId && item.size === size);
      if (existingIdx > -1) {
        const newCart = [...prev];
        newCart[existingIdx].quantity = quantity;
        return newCart;
      }
      return prev;
    });
  };

  const clearCart = () => {
    localStorage.removeItem('pk_cart'); // Instant wipe
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    isLoaded
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
