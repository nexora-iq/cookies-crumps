import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaMoneyBillWave, FaHistory, FaDownload, FaSearch, FaWallet, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function FinancialsLogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [searchDate, setSearchDate] = useState('');
  const [loading, setLoading] = useState(true);

  // المتغيرات المالية
  const [currentProfit, setCurrentProfit] = useState(0); // الأرباح اللي ما مسحوبة
  const [totalProfit, setTotalProfit] = useState(0); // كل الأرباح تاريخياً
  const [lastWithdrawal, setLastWithdrawal] = useState<any>(null); // تفاصيل آخر سحب

  const fetchData = async () => {
    setLoading(true);

    // 1. جلب سجلات السحب المالي
    const { data: withdrawals } = await supabase.from('financials').select('*').order('withdrawn_at', { ascending: false });
    const lastW = withdrawals && withdrawals.length > 0 ? withdrawals[0] : null;
    setLastWithdrawal(lastW);

    // 2. جلب الطلبات المثبتة فقط (approved) لحساب الأرباح
    const { data: orders } = await supabase.from('orders').select('*').eq('status', 'approved');
    
    let total = 0;
    let current = 0;
    
    if (orders) {
      orders.forEach(order => {
        const orderTotal = parseFloat(order.total_price) || 0;
        total += orderTotal; // نضيف للرصيد الكلي
        
        // إذا ماكو سحب سابق، أو إذا الطلب صار بعد آخر عملية سحب، نضيفه للرصيد الحالي
        if (!lastW || new Date(order.created_at) > new Date(lastW.withdrawn_at)) {
          current += orderTotal;
        }
      });
    }
    
    setTotalProfit(total);
    setCurrentProfit(current);

    // 3. جلب سجلات النظام
    const { data: systemLogs } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false });
    if (systemLogs) {
      setLogs(systemLogs);
      setFilteredLogs(systemLogs);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // دالة البحث بالتاريخ
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    setSearchDate(dateStr);
    
    if (!dateStr) {
      setFilteredLogs(logs); // إذا مسح التاريخ يرجع كلشي
    } else {
      // فلترة السجلات بحيث يطابق بداية التاريخ
      setFilteredLogs(logs.filter(log => log.created_at.startsWith(dateStr)));
    }
  };

  // دالة سحب الأرباح وتصفير العداد
  const handleWithdraw = async () => {
    if (currentProfit <= 0) {
      Swal.fire('تنبيه', 'لا توجد أرباح جديدة قابلة للسحب حالياً.', 'warning');
      return;
    }

    const confirm = await Swal.fire({
      title: 'سحب الأرباح',
      text: `هل أنت متأكد من سحب مبلغ ${currentProfit.toLocaleString()} د.ع؟ سيتم تصفير عداد الأرباح الحالية وبدء حساب جديد للطلبات القادمة.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2e7d32',
      cancelButtonColor: '#d33',
      confirmButtonText: 'نعم، اسحب وصفر العداد',
      cancelButtonText: 'إلغاء'
    });

    if (confirm.isConfirmed) {
      // 1. إضافة عملية السحب لجدول المالية
      const { error } = await supabase.from('financials').insert([{ withdrawn_amount: currentProfit }]);
      
      if (!error) {
        // 2. تسجيل الحركة
        await supabase.from('system_logs').insert([{ 
          action_type: 'سحب أرباح', 
          description: `تم سحب أرباح بقيمة ${currentProfit.toLocaleString()} د.ع وتصفير العداد.` 
        }]);
        
        Swal.fire('تم بنجاح!', 'تم سحب الأرباح وتصفير العداد.', 'success');
        fetchData(); // تحديث الواجهة فوراً
      } else {
        Swal.fire('خطأ', 'حدث خطأ أثناء عملية السحب.', 'error');
      }
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><FaSpinner className="fa-spin" style={{ fontSize: '3rem', color: 'var(--gold)' }} /></div>;

  return (
    <div>
      <h2 style={{ color: 'var(--dark-brown)', marginBottom: '30px', fontSize: '2rem' }}>سجل النظام والمالية</h2>

      {/* --- قسم المالية --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2e7d32', marginBottom: '15px' }}>
              <FaWallet style={{ fontSize: '2rem' }} />
              <h3 style={{ margin: 0, color: 'gray' }}>الأرباح القابلة للسحب</h3>
            </div>
            <h2 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: 'var(--dark-brown)' }}>{currentProfit.toLocaleString()} <span style={{ fontSize: '1rem', color: 'gray' }}>د.ع</span></h2>
            <p style={{ color: 'gray', fontSize: '0.9rem', margin: 0 }}>مجموع الأرباح من الطلبات المثبتة منذ آخر عملية سحب.</p>
          </div>
          <button 
            onClick={handleWithdraw}
            style={{ marginTop: '20px', width: '100%', padding: '15px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
          >
            <FaDownload /> سحب الأرباح وتصفير العداد
          </button>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--gold)' }}>
            <FaMoneyBillWave style={{ fontSize: '1.5rem' }} />
            <h4 style={{ margin: 0, color: 'gray' }}>إجمالي الأرباح التاريخية</h4>
          </div>
          <h3 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--dark-brown)' }}>{totalProfit.toLocaleString()} د.ع</h3>
          <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1565c0' }}>
            <FaHistory style={{ fontSize: '1.5rem' }} />
            <h4 style={{ margin: 0, color: 'gray' }}>تاريخ آخر سحب</h4>
          </div>
          <h4 style={{ margin: 0, color: 'var(--dark-brown)' }}>
            {lastWithdrawal ? new Date(lastWithdrawal.withdrawn_at).toLocaleString('ar-IQ') : 'لم يتم سحب أي أرباح سابقاً'}
          </h4>
          {lastWithdrawal && (
            <p style={{ color: 'gray', fontSize: '0.9rem', margin: 0 }}>المبلغ المسحوب: <strong style={{ color: 'var(--gold)' }}>{parseFloat(lastWithdrawal.withdrawn_amount).toLocaleString()} د.ع</strong></p>
          )}
        </div>
      </div>

      {/* --- قسم سجل النظام --- */}
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: 'var(--dark-brown)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaHistory style={{ color: 'var(--gold)' }} /> سجل حركات النظام
          </h3>
          
          {/* حقل البحث بالتاريخ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f9f9f9', padding: '5px 15px', borderRadius: '10px', border: '1px solid #ccc' }}>
            <FaSearch style={{ color: 'gray' }} />
            <input 
              type="date" 
              value={searchDate} 
              onChange={handleSearch} 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #EADDCD' }}>
                <th style={{ padding: '15px', color: 'gray' }}>التاريخ والوقت</th>
                <th style={{ padding: '15px', color: 'gray' }}>نوع الحركة</th>
                <th style={{ padding: '15px', color: 'gray' }}>التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: 'gray', fontWeight: 'bold' }}>لا توجد حركات مسجلة لهذا التاريخ.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px', color: '#555', direction: 'ltr', textAlign: 'right' }}>
                      {new Date(log.created_at).toLocaleString('ar-IQ')}
                    </td>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--dark-brown)' }}>
                      <span style={{ 
                        backgroundColor: '#EADDCD', padding: '5px 10px', borderRadius: '20px', fontSize: '0.85rem' 
                      }}>
                        {log.action_type}
                      </span>
                    </td>
                    <td style={{ padding: '15px', color: '#4B2D1F' }}>{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}