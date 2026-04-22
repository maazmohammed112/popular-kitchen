import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiBox, FiShoppingBag, FiDollarSign, FiLogOut, 
  FiClock, FiCheckCircle, FiPackage, FiXCircle,
  FiArrowLeft, FiChevronRight, FiPhone, FiMapPin
} from 'react-icons/fi';
import { getProducts } from '../../firebase/products';
import { listenToOrders } from '../../firebase/orders';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    confirmed: 0,
    delivered: 0,
    cancelled: 0
  });
  const [allOrders, setAllOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout, isAdmin, canManageOrders } = useAuth();

  useEffect(() => {
    let unsubscribe = () => {};

    const fetchStats = async () => {
      try {
        const products = await getProducts();
        
        // All admins can see order counts, but only full admins see revenue
        if (isAdmin) {
          unsubscribe = listenToOrders((orders) => {
            setAllOrders(orders);
            
            const revenue = canManageOrders 
              ? orders
                .filter(o => o.status !== 'cancelled')
                .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
              : 0;
            
            const counts = orders.reduce((acc, order) => {
              const s = order.status || 'pending';
              acc[s] = (acc[s] || 0) + 1;
              return acc;
            }, { pending: 0, confirmed: 0, delivered: 0, cancelled: 0 });

            setStatusCounts(counts);
            setStats({
              products: products.length,
              orders: orders.length,
              revenue
            });
            setLoading(false);
          });
        } else {
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
  }, [isAdmin, canManageOrders]);

  const mainStats = [
    { title: 'Inventory', value: stats.products, icon: FiBox, color: 'text-pk-accent', bg: 'bg-pk-accent/10', link: '/admin/products' },
    ...(canManageOrders ? [
      { title: 'Revenue', value: `₹${stats.revenue}`, icon: FiDollarSign, color: 'text-pk-success', bg: 'bg-pk-success/10' }
    ] : []),
  ];

  const statusBoxes = [
    { id: 'pending', title: 'Pending', count: statusCounts.pending, icon: FiClock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { id: 'confirmed', title: 'Confirmed', count: statusCounts.confirmed, icon: FiCheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'delivered', title: 'Delivered', count: statusCounts.delivered, icon: FiPackage, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { id: 'cancelled', title: 'Cancelled', count: statusCounts.cancelled, icon: FiXCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ];

  const filteredOrders = selectedStatus 
    ? allOrders.filter(o => o.status === selectedStatus)
    : [];

  if (selectedStatus) {
    return (
      <div className="animate-[slideIn_0.3s_ease-out]">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setSelectedStatus(null)}
            className="p-2 bg-pk-surface border border-pk-bg-secondary text-pk-text-main rounded-xl hover:bg-pk-bg-secondary transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-pk-text-main capitalize">{selectedStatus} Orders</h1>
            <p className="text-sm text-pk-text-muted">Showing {filteredOrders.length} orders</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-pk-surface rounded-3xl border border-pk-bg-secondary text-pk-text-muted">
              No {selectedStatus} orders found.
            </div>
          ) : (
            filteredOrders.map(order => (
              <Link 
                key={order.id} 
                to="/admin/orders" 
                className="bg-pk-surface p-4 rounded-2xl border border-pk-bg-secondary flex items-center justify-between hover:border-pk-accent transition-colors group"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-pk-accent uppercase px-2 py-0.5 bg-pk-accent/10 rounded">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-sm font-bold text-pk-text-main">{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-pk-text-muted">
                    <span className="flex items-center gap-1"><FiPhone size={10} /> {order.phone}</span>
                    <span className="flex items-center gap-1"><FiMapPin size={10} /> {order.address?.slice(0, 20)}...</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-pk-text-main">₹{order.totalAmount}</div>
                    <div className="text-[10px] text-pk-text-muted">{order.createdAt ? new Date(order.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</div>
                  </div>
                  <FiChevronRight className="text-pk-text-muted group-hover:text-pk-accent transition-colors" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-[slideUp_0.4s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-pk-text-main mb-1">Admin Dashboard</h1>
          <p className="text-pk-text-muted">Real-time store management.</p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-pk-surface border border-pk-error/30 text-pk-error rounded-xl hover:bg-pk-error hover:text-white transition-colors text-sm font-medium"
        >
          <FiLogOut /> Logout
        </button>
      </div>

      {/* Main Stats (Inventory/Revenue) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {mainStats.map((card, idx) => (
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

      {/* Status Filter Boxes */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-pk-text-main mb-4 flex items-center gap-2">
          <FiShoppingBag className="text-pk-accent" /> Live Orders Status
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statusBoxes.map((box) => (
            <button
              key={box.id}
              onClick={() => canManageOrders && setSelectedStatus(box.id)}
              className={`flex flex-col items-center justify-center p-6 bg-pk-surface border ${box.border} rounded-3xl transition-all group relative ${canManageOrders ? 'hover:scale-[1.02]' : 'cursor-default'}`}
            >
              <div className={`w-12 h-12 ${box.bg} rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <box.icon className={`${box.color} text-xl`} />
              </div>
              <span className="text-2xl font-bold text-pk-text-main">{loading ? '...' : box.count}</span>
              <span className="text-xs font-medium text-pk-text-muted uppercase tracking-wider">{box.title}</span>
              
              {/* Pulse effect for pending orders */}
              {box.id === 'pending' && box.count > 0 && (
                <span className="absolute top-3 right-3 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-pk-surface p-6 rounded-3xl border border-pk-bg-secondary">
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/products" className="flex-1 min-w-[150px] px-6 py-4 bg-pk-accent/10 border border-pk-accent text-pk-accent rounded-2xl hover:bg-pk-accent hover:text-white transition-all font-bold text-center">
             Manage Products
          </Link>
          {canManageOrders && (
            <Link to="/admin/orders" className="flex-1 min-w-[150px] px-6 py-4 bg-pk-bg-primary border border-pk-bg-secondary text-pk-text-main rounded-2xl hover:border-pk-text-muted transition-all font-bold text-center">
              Full Orders List
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
