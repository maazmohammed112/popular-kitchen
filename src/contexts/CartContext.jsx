import { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
        console.error("Failed to parse cart", err);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. Fetch Remote Cart from Firestore when User Logs In
  useEffect(() => {
    const syncRemoteCart = async () => {
      // Only sync once when user is logged in and local cart is loaded
      if (currentUser && isLoaded && !isRemoteSynced) {
        try {
          const cartRef = doc(db, 'carts', currentUser.uid);
          const cartSnap = await getDoc(cartRef);
          
          if (cartSnap.exists()) {
            const remoteItems = cartSnap.data().items || [];
            
            setCartItems(prevLocal => {
              // Merge Logic: Local cart + Remote cart
              const merged = [...remoteItems];
              prevLocal.forEach(localItem => {
                const existingIdx = merged.findIndex(ri => ri.productId === localItem.productId && ri.size === localItem.size);
                if (existingIdx > -1) {
                  // If exists in both, we merge quantities
                  merged[existingIdx].quantity = Math.max(merged[existingIdx].quantity, localItem.quantity);
                } else {
                  merged.push(localItem);
                }
              });
              return merged;
            });
          }
          setIsRemoteSynced(true);
        } catch (err) {
          console.error("Remote cart sync failed", err);
        }
      } else if (!currentUser) {
        setIsRemoteSynced(false); // Reset sync flag when user logs out
      }
    };
    syncRemoteCart();
  }, [currentUser, isLoaded, isRemoteSynced]);

  // 3. Persist Cart Changes (LocalStorage + Firestore)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pk_cart', JSON.stringify(cartItems));
      
      // Only save to Firestore if user is logged in AND we have finished merging remote data
      // This prevents overwriting remote cart with empty local cart during initial load
      if (currentUser && isRemoteSynced) {
        const timeoutId = setTimeout(async () => {
          try {
            const cartRef = doc(db, 'carts', currentUser.uid);
            await setDoc(cartRef, { 
              items: cartItems, 
              lastUpdated: new Date() 
            }, { merge: true });
          } catch (err) {
            console.error("Firestore cart save failed", err);
          }
        }, 1500); // Debounce saves by 1.5 seconds to reduce DB pressure

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
        return [...prev, { ...product, quantity: product.quantity || 1 }];
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
