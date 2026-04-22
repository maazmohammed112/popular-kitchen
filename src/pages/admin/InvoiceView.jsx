import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { generateAdminInvoice } from '../../utils/invoiceGenerator';
import { useAuth } from '../../contexts/AuthContext';
import { GlobalLoader } from '../../components/GlobalLoader';

export default function InvoiceView() {
  const { id } = useParams();
  const { canManageOrders } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndDownload = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'orders', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const order = { id: snap.id, ...snap.data() };
          await generateAdminInvoice(order);
          // Small delay before redirecting back or showing success
          setTimeout(() => {
            window.close(); // Try to close if it was a target="_blank"
            window.location.href = '/admin/orders'; // Fallback
          }, 1500);
        } else {
          setError("Order not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to generate invoice");
      } finally {
        setLoading(false);
      }
    };

    if (canManageOrders) {
      fetchAndDownload();
    }
  }, [id, canManageOrders]);

  if (!canManageOrders) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-pk-bg-primary flex flex-col items-center justify-center p-4">
      <div className="bg-pk-surface p-8 rounded-3xl border border-pk-bg-secondary shadow-xl text-center max-w-sm w-full">
        {loading ? (
          <>
            <div className="w-16 h-16 border-4 border-pk-accent border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-pk-text-main mb-2">Generating Invoice</h2>
            <p className="text-pk-text-muted text-sm">Please wait while we prepare your document...</p>
          </>
        ) : error ? (
          <>
            <div className="text-pk-error text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-pk-text-main mb-2">Error</h2>
            <p className="text-pk-text-muted text-sm mb-6">{error}</p>
            <button 
              onClick={() => window.location.href = '/admin/orders'}
              className="w-full py-3 bg-pk-accent text-white rounded-xl font-bold"
            >
              Back to Orders
            </button>
          </>
        ) : (
          <>
            <div className="text-pk-success text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-pk-text-main mb-2">Success!</h2>
            <p className="text-pk-text-muted text-sm mb-6">Your invoice has been generated and downloaded.</p>
            <p className="text-xs text-pk-text-muted">Redirecting you back...</p>
          </>
        )}
      </div>
    </div>
  );
}
