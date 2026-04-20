import { Outlet, Link, useLocation } from 'react-router-dom';
import { FiHome, FiBox, FiShoppingBag, FiArrowLeft, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLayout = () => {
  const { pathname } = useLocation();
  const { logout, canManageOrders } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: FiHome },
    { name: 'Products', path: '/admin/products', icon: FiBox },
    ...(canManageOrders ? [{ name: 'Orders', path: '/admin/orders', icon: FiShoppingBag }] : []),
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-pk-bg-primary text-pk-text-main">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-pk-surface border-r border-pk-bg-secondary hidden md:flex flex-col">
        <div className="p-6 border-b border-pk-bg-secondary flex items-center gap-3">
           <img src="/logo.png" alt="Logo" className="h-8 object-contain" />
           <span className="font-bold text-lg">Admin PWA</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-pk-accent text-white font-semibold' : 'text-pk-text-muted hover:bg-pk-bg-primary hover:text-white'
                }`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-pk-bg-secondary">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-pk-text-muted hover:text-pk-text-main transition-colors mb-2">
             <FiArrowLeft /> Back to Store
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-pk-error hover:bg-pk-error/10 rounded-xl transition-colors">
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-pk-surface border-b border-pk-bg-secondary">
          <div className="flex items-center gap-3">
             <Link to="/" className="text-pk-text-muted p-2"><FiArrowLeft size={24}/></Link>
             <span className="font-bold">Admin</span>
          </div>
          <div className="flex gap-2">
             {navItems.map(item => {
               const Icon = item.icon;
               return (
                <Link key={item.path} to={item.path} className={`p-2 rounded-lg ${pathname === item.path ? 'bg-pk-accent text-white' : 'text-pk-text-muted'}`}>
                  <Icon size={20} />
                </Link>
               )
             })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
           <Outlet />
        </div>
      </main>
    </div>
  );
};
