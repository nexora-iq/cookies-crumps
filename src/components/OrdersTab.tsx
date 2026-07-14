import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaCheck, FaTimes, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaClipboard, FaSpinner, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // حقول البحث الجديدة
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, customerName: string, newStatus: 'approved' | 'rejected') => {
    const actionText = newStatus === 'approved' ? 'تثبيت' : 'رفض';
    
    const confirmResult = await Swal.fire({
      title: `هل أنت متأكد من ${actionText} الطلب؟`,
      text: `سيتم تحويل حالة طلب الزبون (${customerName}) إلى ${actionText === 'تثبيت' ? 'مثبت' : 'مرفوض'}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'approved' ? '#2e7d32' : '#c62828',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، متأكد',
      cancelButtonText: 'إلغاء'
    });

    if (confirmResult.isConfirmed) {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);

      if (!error) {
        await supabase.from('system_logs').insert([{
          action_type: newStatus === 'approved' ? 'تثبيت طلب' : 'رفض طلب',
          description: `تم ${newStatus === 'approved' ? 'تثبيت' : 'رفض'} طلب الزبون: ${customerName}`
        }]);

        Swal.fire('نجاح', `تم ${actionText} الطلب بنجاح!`, 'success');
        fetchOrders();
      } else {
        Swal.fire('خطأ', 'حدث خطأ أثناء تحديث حالة الطلب، حاول مرة أخرى.', 'error');
      }
    }
  };

  // --- منطق الفلترة والبحث ---
  const filteredOrders = orders.filter(order => {
    // البحث في اسم الزبون
    const matchesCustomer = order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    // البحث في أسماء المنتجات داخل السلة
    const matchesProduct = Array.isArray(order.items) && order.items.some((item: any) => 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesSearchTerm = matchesCustomer || matchesProduct;
    // البحث بالتاريخ
    const matchesDate = !searchDate || order.created_at.startsWith(searchDate);

    return matchesSearchTerm && matchesDate;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <FaSpinner className="fa-spin" style={{ fontSize: '3rem', color: 'var(--gold)' }} />
      </div>
    );
  }

  return (
    <div>
      {/* عنوان الصفحة مع عداد الطلبات */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
        <h2 style={{ color: 'var(--dark-brown)', margin: 0, fontSize: '2rem' }}>إدارة الطلبات الواردة</h2>
        <div style={{ backgroundColor: 'var(--gold)', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.2rem' }}>
          إجمالي الطلبات: {filteredOrders.length}
        </div>
      </div>

      {/* شريط البحث المتقدم */}
      <div style={{ 
        display: 'flex', gap: '20px', marginBottom: '30px', backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flexWrap: 'wrap'
      }}>
        <div style={{ flex: 2, minWidth: '250px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #ccc', borderRadius: '8px', padding: '10px 15px' }}>
          <FaSearch style={{ color: 'gray' }} />
          <input 
            type="text" 
            placeholder="البحث باسم الزبون أو اسم المنتج..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '1rem' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #ccc', borderRadius: '8px', padding: '10px 15px' }}>
          <FaCalendarAlt style={{ color: 'gray' }} />
          <input 
            type="date" 
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '1rem', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* شبكة البطاقات المصغرة للطلبات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredOrders.length === 0 ? (
          <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'gray', fontWeight: 'bold', fontSize: '1.2rem', padding: '20px' }}>لا توجد طلبات تطابق بحثك حالياً.</p>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: '#fff',
                borderRadius: '15px',
                padding: '20px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                borderRight: `6px solid ${ order.status === 'approved' ? '#2e7d32' : order.status === 'rejected' ? '#c62828' : 'var(--gold)' }`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: '0.3s'
              }}
            >
              <div>
                {/* رأس البطاقة */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: '0', color: 'var(--dark-brown)', fontSize: '1.3rem' }}>{order.customer_name}</h3>
                  <span style={{
                      padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem',
                      backgroundColor: order.status === 'approved' ? '#e8f5e9' : order.status === 'rejected' ? '#ffebee' : '#fff8e1',
                      color: order.status === 'approved' ? '#2e7d32' : order.status === 'rejected' ? '#c62828' : 'var(--gold)'
                    }}>
                    {order.status === 'approved' ? 'مثبت ✅' : order.status === 'rejected' ? 'مرفوض ❌' : 'انتظار ⏳'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'gray', fontSize: '0.85rem', marginBottom: '15px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaPhone style={{ color: 'var(--gold)' }} /> {order.customer_phone}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaMapMarkerAlt style={{ color: 'var(--gold)' }} /> {order.address}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaCalendarAlt style={{ color: 'var(--gold)' }} /> {new Date(order.created_at).toLocaleString('ar-IQ')}</span>
                </div>

                {/* قائمة المنتجات */}
                <div style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px', marginBottom: '15px', maxHeight: '120px', overflowY: 'auto' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--dark-brown)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaClipboard style={{ color: 'var(--gold)' }} /> الطلب:
                  </h4>
                  <ul style={{ paddingRight: '15px', margin: 0, fontSize: '0.85rem', lineHeight: '1.6' }}>
                    {Array.isArray(order.items) ? order.items.map((item: any, idx: number) => (
                      <li key={idx} style={{ color: '#4B2D1F', fontWeight: 'bold' }}>
                        {item.title} <span style={{ color: 'var(--gold)' }}>(x{item.quantity})</span>
                      </li>
                    )) : <li style={{ color: 'red' }}>خطأ بالقراءة</li>}
                  </ul>
                </div>
                
                {order.notes && (
                  <div style={{ backgroundColor: '#fffde7', padding: '8px', borderRadius: '8px', borderRight: '3px solid #ffd54f', marginBottom: '15px', fontSize: '0.8rem', color: '#555' }}>
                    <strong>ملاحظة:</strong> {order.notes}
                  </div>
                )}
              </div>

              {/* السعر والأزرار في أسفل البطاقة */}
              <div>
                <h3 style={{ margin: '0 0 15px 0', color: 'var(--dark-brown)', fontSize: '1.4rem', textAlign: 'left' }}>
                  {parseFloat(order.total_price).toLocaleString()} د.ع
                </h3>
                {order.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleStatusChange(order.id, order.customer_name, 'approved')} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <FaCheck /> تثبيت
                    </button>
                    <button onClick={() => handleStatusChange(order.id, order.customer_name, 'rejected')} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', backgroundColor: '#c62828', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <FaTimes /> رفض
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}