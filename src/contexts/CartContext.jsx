import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from localStorage
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

  // Save to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pk_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  const addToCart = (product) => {
    // product shape: { productId, title, price, size, image, quantity }
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
