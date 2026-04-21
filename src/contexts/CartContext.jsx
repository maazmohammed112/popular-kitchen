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
        console.log("[Cart] Loaded from local storage:", JSON.parse(savedCart).length, "items");
      } catch (err) {
        console.error("[Cart] Failed to parse local cart", err);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. Fetch Remote Cart from Firestore when User Logs In
  useEffect(() => {
    const syncRemoteCart = async () => {
      // Only sync once when user is logged in and local cart is loaded
      if (currentUser && isLoaded && !isRemoteSynced) {
        console.log("[Cart] Remote sync started for user:", currentUser.uid);
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const remoteItems = userSnap.data().cart || [];
            console.log("[Cart] Remote items found:", remoteItems.length);
            
            setCartItems(prevLocal => {
              // Merge Logic: Local cart + Remote cart
              const merged = [...remoteItems];
              prevLocal.forEach(localItem => {
                const existingIdx = merged.findIndex(ri => ri.productId === localItem.productId && ri.size === localItem.size);
                if (existingIdx > -1) {
                  // If exists in both, keep the one with more quantity
                  merged[existingIdx].quantity = Math.max(merged[existingIdx].quantity, localItem.quantity);
                } else {
                  merged.push(localItem);
                }
              });
              return merged;
            });
          } else {
            console.log("[Cart] No remote cart document found (New User)");
          }
          setIsRemoteSynced(true);
          console.log("[Cart] Sync successful");
        } catch (err) {
          console.error("[Cart] Remote sync failed:", err.message);
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
      if (currentUser && isRemoteSynced) {
        const timeoutId = setTimeout(async () => {
          try {
            console.log("[Cart] Saving to Firestore...");
            
            // SANITIZE: Firestore doesn't allow 'undefined' values. 
            const sanitizedItems = cartItems.map(item => {
              const cleaned = {};
              Object.keys(item).forEach(key => {
                if (item[key] !== undefined) {
                  cleaned[key] = item[key];
                } else {
                  cleaned[key] = null; // Use null instead of undefined
                }
              });
              return cleaned;
            });

            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, { 
              cart: sanitizedItems, 
              cartUpdatedAt: new Date() 
            }, { merge: true });
            console.log("[Cart] Saved successfully");
          } catch (err) {
            console.error("[Cart] Firestore save failed:", err.message);
          }
        }, 2000); // 2 second debounce to reduce DB pressure

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
