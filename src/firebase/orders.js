import { collection, doc, getDocs, addDoc, updateDoc, serverTimestamp, query, orderBy, where } from "firebase/firestore";
import { db } from "./config";

const ORDERS_COLLECTION = "orders";

export const createOrder = async (orderData) => {
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    ...orderData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const getOrders = async () => {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getUserOrders = async (userId) => {
  try {
    // Simple where query without orderBy avoids needing a composite Firestore index
    const q = query(collection(db, ORDERS_COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort client-side, newest first
    return orders.sort((a, b) => {
      const tA = a.createdAt?.toMillis?.() || 0;
      const tB = b.createdAt?.toMillis?.() || 0;
      return tB - tA;
    });
  } catch (err) {
    // Fallback: fetch all and filter client-side (handles missing index)
    console.warn('getUserOrders compound query failed, falling back:', err.message);
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(o => o.userId === userId);
  }
};

export const updateOrderStatus = async (id, status, adminNote = "") => {
  const docRef = doc(db, ORDERS_COLLECTION, id);
  await updateDoc(docRef, { status, adminNote });
};

export const cancelOrder = async (id) => {
  const docRef = doc(db, ORDERS_COLLECTION, id);
  await updateDoc(docRef, { status: 'cancelled' });
};
