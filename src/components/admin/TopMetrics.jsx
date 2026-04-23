import React, { useState, useEffect, useMemo } from 'react';
import { FiRefreshCw, FiTrendingUp, FiUsers, FiShoppingBag, FiDollarSign } from 'react-icons/fi';
import { listenToOrders } from '../../firebase/orders';

const TopMetrics = ({ filters }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToOrders((data) => {
      setOrders(data);
      setLoading(false);
      setRefreshing(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];
    
    if (filters?.period && filters.period !== 'all') {
      const now = new Date();
      filtered = filtered.filter(o => {
        const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        if (filters.period === 'today') return date.toDateString() === now.toDateString();
        if (filters.period === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= weekAgo;
        }
        if (filters.period === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        if (filters.period === 'year') return date.getFullYear() === now.getFullYear();
        return true;
      });
    }

    if (filters?.product && filters.product !== 'all') {
      filtered = filtered.filter(o => o.items?.some(i => i.title === filters.product));
    }

    return filtered;
  }, [orders, filters]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Real-time listener handles the data update
  };

  const analytics = useMemo(() => {
    const productMap = {};
    const customerMap = {};

    filteredOrders.forEach(order => {
      if (order.status === 'cancelled') return;

      // Product Analytics
      order.items?.forEach(item => {
        const key = item.title || item.name;
        if (!productMap[key]) {
          productMap[key] = { name: key, qty: 0, amount: 0 };
        }
        productMap[key].qty += (item.quantity || 0);
        productMap[key].amount += (item.price || 0) * (item.quantity || 0);
      });

      // Customer Analytics
      const custKey = order.userId || order.phone; // Fallback to phone if userId missing
      if (custKey) {
        if (!customerMap[custKey]) {
          customerMap[custKey] = {
            name: order.customerName,
            email: order.email || 'N/A',
            phone: order.phone,
            totalSpent: 0,
            orderCount: 0
          };
        }
        customerMap[custKey].totalSpent += (order.totalAmount || 0);
        customerMap[custKey].orderCount += 1;
      }
    });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const topCustomers = Object.values(customerMap)
      .filter(c => c.orderCount > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    return { topProducts, topCustomers };
  }, [orders]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="h-64 bg-pk-surface border border-pk-bg-secondary rounded-3xl"></div>
        <div className="h-64 bg-pk-surface border border-pk-bg-secondary rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-bold text-pk-text-main flex items-center gap-2">
          <FiTrendingUp className="text-pk-accent" /> Store Analytics
        </h2>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className={`p-2 rounded-xl bg-pk-surface border border-pk-bg-secondary text-pk-text-muted hover:text-pk-accent transition-all ${refreshing ? 'animate-spin' : ''}`}
        >
          <FiRefreshCw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Products */}
        <div className="bg-pk-surface rounded-3xl border border-pk-bg-secondary overflow-hidden flex flex-col shadow-sm">
          <div className="p-5 border-b border-pk-bg-secondary bg-pk-bg-secondary/10 flex items-center gap-3">
            <div className="w-10 h-10 bg-pk-accent/10 rounded-xl flex items-center justify-center">
              <FiShoppingBag className="text-pk-accent" />
            </div>
            <div>
              <h3 className="font-bold text-pk-text-main">Top 10 Products</h3>
              <p className="text-xs text-pk-text-muted">Most sold items across all time</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-pk-bg-primary/50 text-[10px] uppercase tracking-wider text-pk-text-muted">
                <tr>
                  <th className="px-5 py-3 font-bold">Product</th>
                  <th className="px-5 py-3 font-bold text-center">Qty</th>
                  <th className="px-5 py-3 font-bold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pk-bg-secondary/50">
                {analytics.topProducts.map((p, i) => (
                  <tr key={i} className="hover:bg-pk-bg-primary/30 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-pk-text-muted w-4">{i + 1}.</span>
                        <span className="text-sm font-semibold text-pk-text-main group-hover:text-pk-accent transition-colors">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center text-sm font-bold text-pk-text-main">{p.qty}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-bold text-pk-success">₹{p.amount.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-pk-surface rounded-3xl border border-pk-bg-secondary overflow-hidden flex flex-col shadow-sm">
          <div className="p-5 border-b border-pk-bg-secondary bg-pk-bg-secondary/10 flex items-center gap-3">
            <div className="w-10 h-10 bg-pk-success/10 rounded-xl flex items-center justify-center">
              <FiUsers className="text-pk-success" />
            </div>
            <div>
              <h3 className="font-bold text-pk-text-main">Valuable Customers</h3>
              <p className="text-xs text-pk-text-muted">Customers who purchased at least once</p>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left">
              <thead className="bg-pk-bg-primary/50 text-[10px] uppercase tracking-wider text-pk-text-muted sticky top-0">
                <tr>
                  <th className="px-5 py-3 font-bold">Customer Info</th>
                  <th className="px-5 py-3 font-bold text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pk-bg-secondary/50">
                {analytics.topCustomers.map((c, i) => (
                  <tr key={i} className="hover:bg-pk-bg-primary/30 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-pk-text-main">{c.name}</span>
                        <span className="text-[10px] text-pk-text-muted">{c.phone} | {c.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-pk-accent">₹{c.totalSpent.toLocaleString()}</span>
                        <span className="text-[10px] text-pk-text-muted">{c.orderCount} Orders</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopMetrics;
