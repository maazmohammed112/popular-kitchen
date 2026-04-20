import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBox, FiShoppingBag, FiDollarSign, FiLogOut } from 'react-icons/fi';
import { getProducts } from '../../firebase/products';
import { listenToOrders } from '../../firebase/orders';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const { logout, canManageOrders } = useAuth();

  useEffect(() => {
    let unsubscribe = () => {};

    const fetchStats = async () => {
      try {
        const products = await getProducts();
        
        if (canManageOrders) {
          // Full admin: Listen to orders in real-time
          unsubscribe = listenToOrders((orders) => {
            const revenue = orders
              .filter(o => o.status !== 'cancelled')
              .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            
            setStats({
              products: products.length,
              orders: orders.length,
              revenue
            });
            setLoading(false);
          });
        } else {
          // Product admin: only products
          setStats(prev => ({ ...prev, products: products.length }));
          setLoading(false);
        }

      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    
    fetchStats();

    return () => unsubscribe();
  }, []);

  const statCards = [
    { title: 'Total Products', value: stats.products, icon: FiBox, color: 'text-pk-accent', bg: 'bg-pk-accent/10', link: '/admin/products' },
    ...(canManageOrders ? [
      { title: 'Total Orders', value: stats.orders, icon: FiShoppingBag, color: 'text-pk-warning', bg: 'bg-pk-warning/10', link: '/admin/orders' },
      { title: 'Total Revenue', value: `₹${stats.revenue}`, icon: FiDollarSign, color: 'text-pk-success', bg: 'bg-pk-success/10', link: null },
    ] : []),
  ];

  return (
    <div className="animate-[slideUp_0.4s_ease-out]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-pk-text-main mb-1">Admin Dashboard</h1>
          <p className="text-pk-text-muted">Overview of your store's performance.</p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-pk-surface border border-pk-error/30 text-pk-error rounded-xl hover:bg-pk-error hover:text-white transition-colors text-sm font-medium"
        >
          <FiLogOut /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-pk-surface p-6 rounded-3xl border border-pk-bg-secondary relative overflow-hidden group">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${card.bg} blur-2xl transition-transform group-hover:scale-150`}></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-pk-text-muted text-sm font-medium mb-1">{card.title}</p>
                <h3 className="text-3xl font-bold text-pk-text-main">
                  {loading ? <span className="animate-pulse opacity-50">...</span> : card.value}
                </h3>
              </div>
              <div className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center`}>
                <card.icon className={`${card.color} text-xl`} />
              </div>
            </div>
            {card.link && (
              <Link to={card.link} className="absolute inset-0 z-20"></Link>
            )}
          </div>
        ))}
      </div>

      <div className="bg-pk-surface p-6 rounded-3xl border border-pk-bg-secondary">
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/products" className="px-6 py-3 bg-pk-accent/10 border border-pk-accent text-pk-accent rounded-xl hover:bg-pk-accent hover:text-white transition-colors font-medium">
             Manage Products
          </Link>
          {canManageOrders && (
            <Link to="/admin/orders" className="px-6 py-3 bg-pk-bg-primary border border-pk-bg-secondary text-pk-text-main rounded-xl hover:border-pk-text-muted transition-colors font-medium">
              View All Orders
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
