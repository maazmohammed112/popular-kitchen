import { collection, doc, getDocs, addDoc, updateDoc, serverTimestamp, query, orderBy, where, onSnapshot, getDoc } from "firebase/firestore";
import { adminDb as db } from "./config";
import { notifyNewOrder, notifyStatusUpdate, notifyOrderCancelled } from "./notifications";

const ORDERS_COLLECTION = "orders";

export const createOrder = async (orderData) => {
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    ...orderData,
    createdAt: serverTimestamp()
  });
  
  // Trigger immediate notification
  notifyNewOrder(docRef.id, orderData).catch(err => console.error("Notify error:", err));
  
  return docRef.id;
};

export const getOrders = async () => {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const listenToOrders = (callback) => {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("ListenToOrders Update:", orders.length, "orders found");
    callback(orders);
  }, (error) => {
    console.error("ListenToOrders Error:", error);
  });
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
export const listenToUserOrders = (userId, callback) => {
  const q = query(collection(db, ORDERS_COLLECTION), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    let orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    orders = orders.sort((a, b) => {
      const tA = a.createdAt?.toMillis?.() || 0;
      const tB = b.createdAt?.toMillis?.() || 0;
      return tB - tA;
    });
    callback(orders);
  });
};

export const updateOrderStatus = async (id, status, adminNote = "") => {
  const docRef = doc(db, ORDERS_COLLECTION, id);
  const snap = await getDoc(docRef);
  const orderData = snap.exists() ? snap.data() : null;
  const oldStatus = orderData ? orderData.status : 'unknown';
  
  await updateDoc(docRef, { status, adminNote });
  
  // Notify status change with full data
  if (orderData) {
    notifyStatusUpdate(id, orderData, oldStatus, status, adminNote).catch(err => console.error("Notify error:", err));
  }
};

export const updateOrderTotal = async (id, customTotal, discountAmount) => {
  const docRef = doc(db, ORDERS_COLLECTION, id);
  await updateDoc(docRef, { customTotal, discountAmount });
};

export const updateOrderDeliveryCharge = async (id, deliveryCharge) => {
  const docRef = doc(db, ORDERS_COLLECTION, id);
  await updateDoc(docRef, { deliveryCharge });
};

export const cancelOrder = async (id, cancelledBy = 'user') => {
  const docRef = doc(db, ORDERS_COLLECTION, id);
  const snap = await getDoc(docRef);
  const orderData = snap.exists() ? snap.data() : null;

  await updateDoc(docRef, { status: 'cancelled', cancelledBy });
  
  // Notify cancellation with full data
  if (orderData) {
    notifyOrderCancelled(id, orderData, cancelledBy).catch(err => console.error("Notify error:", err));
  }
};
