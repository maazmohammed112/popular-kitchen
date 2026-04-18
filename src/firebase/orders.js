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
  const q = query(collection(db, ORDERS_COLLECTION), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateOrderStatus = async (id, status, adminNote = "") => {
  const docRef = doc(db, ORDERS_COLLECTION, id);
  await updateDoc(docRef, { status, adminNote });
};
