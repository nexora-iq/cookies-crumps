import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaSpinner } from 'react-icons/fa';

interface Stats {
  totalOrders: number;
  totalRejected: number;
  totalApproved: number;
  totalRevenueWithShipping: number;
  totalRevenueWithoutShipping: number;
  totalProducts: number;
  totalBillboard: number;
}

export default function StatsTab() {
  const [stats, setStats] = useState<Stats>({ 
    totalOrders: 0, totalRejected: 0, totalApproved: 0, 
    totalRevenueWithShipping: 0, totalRevenueWithoutShipping: 0, 
    totalProducts: 0, totalBillboard: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      
      const { data: allOrders } = await supabase.from('orders').select('*');
      const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: billboardCount } = await supabase.from('billboard').select('*', { count: 'exact', head: true });

      if (allOrders) {
        const approvedOrders = allOrders.filter(o => o.status === 'approved');
        const rejectedOrders = allOrders.filter(o => o.status === 'rejected');
        const totalRev = approvedOrders.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0);
        
        const shippingTotal = approvedOrders.length * 5000;
        const revenueWithoutShipping = totalRev - shippingTotal;

        setStats({
          totalOrders: allOrders.length,
          totalRejected: rejectedOrders.length,
          totalApproved: approvedOrders.length,
          totalRevenueWithShipping: totalRev,
          totalRevenueWithoutShipping: revenueWithoutShipping,
          totalProducts: productsCount || 0,
          totalBillboard: billboardCount || 0
        });
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><FaSpinner className="fa-spin" style={{ fontSize: '3rem', color: 'var(--gold)' }} /></div>;

  return (
    <div>
      <h2 style={{ color: 'var(--dark-brown)', marginBottom: '30px', fontSize: '2rem' }}>📊 نظرة عامة على الإحصائيات</h2>
      
      {/* تم جعل الحد الأدنى 140px لكي تصطف البوكسات الستة كلها في سطر واحد على الشاشات الكبيرة */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '15px',
        width: '100%'
      }}>
        
        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', color: 'gray', fontSize: '0.85rem' }}>إجمالي الطلبات</p>
          <h3 style={{ fontSize: '1.25rem', color: '#1976d2', margin: 0 }}>{stats.totalOrders}</h3>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', color: 'gray', fontSize: '0.85rem' }}>الطلبات المرفوضة</p>
          <h3 style={{ fontSize: '1.25rem', color: '#d32f2f', margin: 0 }}>{stats.totalRejected}</h3>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', color: 'gray', fontSize: '0.85rem' }}>الأرباح (بالتوصيل)</p>
          <h3 style={{ fontSize: '1.1rem', color: '#2e7d32', margin: 0, fontWeight: 'bold' }}>{stats.totalRevenueWithShipping.toLocaleString()}</h3>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', color: 'gray', fontSize: '0.85rem' }}>الأرباح (صافي)</p>
          <h3 style={{ fontSize: '1.1rem', color: '#388e3c', margin: 0, fontWeight: 'bold' }}>{stats.totalRevenueWithoutShipping.toLocaleString()}</h3>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', color: 'gray', fontSize: '0.85rem' }}>المنتجات المعروضة</p>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--gold)', margin: 0 }}>{stats.totalProducts}</h3>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', color: 'gray', fontSize: '0.85rem' }}>ملفات اللوحة</p>
          <h3 style={{ fontSize: '1.25rem', color: '#c2185b', margin: 0 }}>{stats.totalBillboard}</h3>
        </div>

      </div>
    </div>
  );
}