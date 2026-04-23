import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { FiPlus, FiTrash2, FiSave, FiSettings, FiPieChart, FiBarChart2, FiActivity, FiX } from 'react-icons/fi';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, adminDb } from '../../firebase/config';
import { listenToOrders } from '../../firebase/orders';
import { useToast } from '../../contexts/ToastContext';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const PowerBIDashboard = (props) => {
  const [orders, setOrders] = useState([]);
  const [config, setConfig] = useState({ id: 'dashboard_main', charts: [] }); 
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'chart'|'dashboard', id?: number }
  const [showLegendId, setShowLegendId] = useState(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    // Load config from Firestore
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'admin_configs', 'dashboard_main');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setConfig(snap.data());
        } else {
          setConfig({ id: 'dashboard_main', charts: [] });
        }
      } catch (err) {
        console.error("Config load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();

    // Listen to orders for data
    const unsubscribe = listenToOrders((data) => {
      setOrders(data);
    });

    return () => unsubscribe();
  }, []);

  const saveConfig = async (newConfig) => {
    try {
      await setDoc(doc(db, 'admin_configs', 'dashboard_main'), newConfig);
      showSuccess("Dashboard layout saved!");
    } catch (err) {
      showError("Failed to save layout");
    }
  };

  const addChart = (type) => {
    if (config.charts.length >= 6) { // Allow one more
      showError("Maximum 6 graphs allowed");
      return;
    }
    const newChart = {
      id: Date.now(),
      type,
      title: `My New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      metric: 'orders', // orders, revenue, products
      period: 'all', // all, week, month, year
      metrics: ['pending', 'confirmed', 'delivered', 'cancelled']
    };
    const updated = { ...config, charts: [...config.charts, newChart] };
    setConfig(updated);
    saveConfig(updated); // Auto-save on add
    setIsAdding(false);
  };

  const removeChart = (id) => {
    setConfirmDelete({ type: 'chart', id });
  };

  const confirmRemoveChart = (id) => {
    const updated = { ...config, charts: config.charts.filter(c => c.id !== id) };
    setConfig(updated);
    saveConfig(updated); // Auto-save on delete
    setConfirmDelete(null);
  };

  const updateChart = (id, updates) => {
    const updatedCharts = config.charts.map(c => c.id === id ? { ...c, ...updates } : c);
    const updatedConfig = { ...config, charts: updatedCharts };
    setConfig(updatedConfig);
    if (updates.metric) saveConfig(updatedConfig); // Auto-save metric changes
  };

  const clearDashboard = async () => {
    setConfirmDelete({ type: 'dashboard' });
  };

  const confirmClearDashboard = async () => {
    try {
      await deleteDoc(doc(db, 'admin_configs', 'dashboard_main'));
      setConfig({ id: 'dashboard_main', charts: [] });
      showSuccess("Dashboard deleted");
    } catch (err) {
      showError("Failed to delete dashboard");
    } finally {
      setConfirmDelete(null);
    }
  };

  const filterOrders = (ordersToFilter, chartConfig) => {
    let filtered = [...ordersToFilter];
    
    // Apply Global Filters first
    if (props.filters?.period && props.filters.period !== 'all') {
      const now = new Date();
      filtered = filtered.filter(o => {
        const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        if (props.filters.period === 'today') return date.toDateString() === now.toDateString();
        if (props.filters.period === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= weekAgo;
        }
        if (props.filters.period === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        if (props.filters.period === 'year') return date.getFullYear() === now.getFullYear();
        return true;
      });
    }

    if (props.filters?.product && props.filters.product !== 'all') {
      filtered = filtered.filter(o => o.items?.some(i => i.title === props.filters.product));
    }

    return filtered;
  };

  const prepareData = (chart) => {
    const filtered = filterOrders(orders, chart);
    
    if (chart.metric === 'revenue') {
      const rMap = {};
      filtered.forEach(o => {
        const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD for sorting
        if (!rMap[dayKey]) rMap[dayKey] = { raw: date, amount: 0 };
        rMap[dayKey].amount += (o.totalAmount || 0);
      });
      
      return Object.entries(rMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, data]) => ({
          name: data.raw.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value: data.amount
        }));
    }

    if (chart.metric === 'products') {
      const pMap = {};
      filtered.forEach(o => o.items?.forEach(i => {
        const name = i.title || i.name;
        if (!name) return;
        pMap[name] = (pMap[name] || 0) + (i.quantity || 1);
      }));
      return Object.entries(pMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
    }

    if (chart.metric === 'customers') {
      const cMap = {};
      filtered.forEach(o => {
        if (o.status === 'cancelled') return;
        const custKey = o.userId || o.phone || o.customerName;
        if (!custKey) return;
        const name = o.customerName || 'Guest';
        cMap[custKey] = { name, spent: (cMap[custKey]?.spent || 0) + (o.totalAmount || 0) };
      });
      return Object.values(cMap)
        .map(c => ({ name: c.name.split(' ')[0], value: c.spent }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    }

    // Default: Orders Count
    const data = chart.metrics.map(m => {
      const count = filtered.filter(o => o.status === m).length;
      return { name: m.charAt(0).toUpperCase() + m.slice(1), value: count };
    });
    return data;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-pk-bg-secondary rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-pk-surface rounded-3xl animate-pulse"></div>
          <div className="h-64 bg-pk-surface rounded-3xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-pk-surface p-4 rounded-2xl border border-pk-bg-secondary">
        <div>
          <h2 className="text-lg font-bold text-pk-text-main flex items-center gap-2">
            <FiActivity className="text-pk-accent" /> Custom Analytics Dashboard
          </h2>
          <p className="text-xs text-pk-text-muted">{config?.charts?.length || 0}/5 Graphs used</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {config?.charts?.length > 0 && (
            <button 
              onClick={clearDashboard}
              className="flex-1 sm:flex-none p-2 text-pk-error hover:bg-pk-error/10 rounded-xl transition-colors"
              title="Delete Dashboard"
            >
              <FiTrash2 size={20} />
            </button>
          )}
          <button 
            onClick={() => saveConfig(config)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-pk-accent/10 text-pk-accent border border-pk-accent/20 rounded-xl hover:bg-pk-accent hover:text-white transition-all text-sm font-bold"
          >
            <FiSave /> Save Layout
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-pk-accent text-white rounded-xl hover:brightness-110 transition-all shadow-lg shadow-pk-accent/20 text-sm font-bold"
          >
            <FiPlus /> Add Graph
          </button>
        </div>
      </div>

      {config.charts.length === 0 && !isAdding && (
        <div className="text-center py-20 bg-pk-surface rounded-3xl border-2 border-dashed border-pk-bg-secondary">
          <div className="w-16 h-16 bg-pk-bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <FiActivity className="text-pk-text-muted" size={32} />
          </div>
          <h3 className="font-bold text-pk-text-main mb-2">No Graphs Yet</h3>
          <p className="text-sm text-pk-text-muted mb-6">Create your own customized dashboard to monitor store performance.</p>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-2 bg-pk-accent text-white rounded-xl font-bold hover:scale-105 transition-all"
          >
            Create New Dashboard
          </button>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-pk-surface rounded-2xl p-8 w-full max-w-md border border-pk-bg-secondary shadow-2xl animate-[slideUp_0.2s_ease-out]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-pk-text-main">Choose Graph Type</h3>
              <button onClick={() => setIsAdding(false)} className="text-pk-text-muted hover:text-pk-text-main">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => addChart('bar')} className="flex items-center gap-4 p-4 bg-pk-bg-primary hover:bg-pk-accent/10 border border-pk-bg-secondary hover:border-pk-accent rounded-xl transition-all text-left group">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><FiBarChart2 size={24} /></div>
                <div><div className="font-bold text-pk-text-main">Bar Chart</div><div className="text-xs text-pk-text-muted">Best for comparing categories</div></div>
              </button>
              <button onClick={() => addChart('line')} className="flex items-center gap-4 p-4 bg-pk-bg-primary hover:bg-pk-accent/10 border border-pk-bg-secondary hover:border-pk-accent rounded-xl transition-all text-left group">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform"><FiActivity size={24} /></div>
                <div><div className="font-bold text-pk-text-main">Line Chart</div><div className="text-xs text-pk-text-muted">Best for tracking trends</div></div>
              </button>
              <button onClick={() => addChart('pie')} className="flex items-center gap-4 p-4 bg-pk-bg-primary hover:bg-pk-accent/10 border border-pk-bg-secondary hover:border-pk-accent rounded-xl transition-all text-left group">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform"><FiPieChart size={24} /></div>
                <div><div className="font-bold text-pk-text-main">Pie Chart</div><div className="text-xs text-pk-text-muted">Best for viewing proportions</div></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-pk-surface rounded-2xl p-6 w-full max-w-sm border border-pk-bg-secondary shadow-2xl animate-[slideUp_0.2s_ease-out] text-center">
            <div className="w-16 h-16 bg-pk-error/10 text-pk-error rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTrash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-pk-text-main mb-2">Confirm Deletion</h3>
            <p className="text-sm text-pk-text-muted mb-6">
              {confirmDelete.type === 'chart' 
                ? "Are you sure you want to delete this graph? This action cannot be undone."
                : "This will permanently delete your entire dashboard. Continue?"}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 bg-pk-bg-primary text-pk-text-main font-bold rounded-xl hover:bg-pk-bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => confirmDelete.type === 'chart' ? confirmRemoveChart(confirmDelete.id) : confirmClearDashboard()}
                className="flex-1 py-2 bg-pk-error text-white font-bold rounded-xl hover:brightness-110 shadow-lg shadow-pk-error/20 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {config?.charts?.map(chart => {
          const chartData = prepareData(chart);
          const hasData = chartData && chartData.length > 0;
          return (
          <div key={chart.id} className="bg-pk-surface p-6 rounded-3xl border border-pk-bg-secondary flex flex-col h-[450px] shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <input 
                  type="text"
                  value={chart.title}
                  onChange={(e) => updateChart(chart.id, { title: e.target.value })}
                  className="bg-transparent font-bold text-pk-text-main border-b border-transparent hover:border-pk-bg-secondary focus:border-pk-accent focus:outline-none w-full"
                />
                <div className="flex gap-2 mt-2">
                  <select 
                    value={chart.metric}
                    onChange={(e) => updateChart(chart.id, { metric: e.target.value })}
                    className="text-[10px] font-bold uppercase tracking-wider bg-pk-bg-primary text-pk-text-muted px-2 py-1 rounded border-none focus:ring-1 focus:ring-pk-accent"
                  >
                    <option value="orders">Order Status</option>
                    <option value="revenue">Revenue Trend</option>
                    <option value="products">Top Products</option>
                    <option value="customers">Top Customers</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {chart.type === 'pie' && (
                  <button 
                    onClick={() => setShowLegendId(showLegendId === chart.id ? null : chart.id)}
                    className={`p-2 rounded-lg transition-colors ${showLegendId === chart.id ? 'bg-pk-accent text-white' : 'text-pk-text-muted hover:bg-pk-bg-primary'}`}
                    title="Show Details"
                  >
                    <FiPieChart size={16} />
                  </button>
                )}
                <button 
                  onClick={() => removeChart(chart.id)}
                  className="p-2 text-pk-text-muted hover:text-pk-error bg-pk-bg-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full min-h-[250px] relative">
              {showLegendId === chart.id && chart.type === 'pie' && (
                <div className="absolute inset-x-0 bottom-0 z-20 bg-pk-surface/95 backdrop-blur-md p-4 border-t border-pk-bg-secondary animate-[slideUp_0.2s_ease-out] max-h-[200px] overflow-y-auto rounded-b-3xl">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] font-black uppercase text-pk-text-muted tracking-widest">Product Details</h4>
                    <button onClick={() => setShowLegendId(null)} className="text-pk-text-muted hover:text-pk-text-main"><FiX size={14} /></button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {chartData.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-4">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-pk-text-main truncate font-medium">{entry.name}</span>
                        </div>
                        <span className="font-bold text-pk-accent shrink-0">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!hasData ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-pk-text-muted">
                  <FiActivity className="opacity-20 mb-2" size={32} />
                  <p className="text-sm font-medium">No matching data for current filters</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {chart.type === 'bar' ? (
                    <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : chart.type === 'line' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                )}
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};

export default PowerBIDashboard;
