import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  FaCrown,
  FaChartPie,
  FaBoxOpen,
  FaClipboardList,
  FaMoneyCheckAlt,
  FaImage,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaCalculator
} from 'react-icons/fa';
import Swal from 'sweetalert2';

import ProductsTab from './components/ProductsTab';
import { enablePushNotifications } from './notificationService';
import StatsTab from './components/StatsTab';
import OrdersTab from './components/OrdersTab';
import FinancialsLogsTab from './components/FinancialsLogsTab';
import MediaNewsTab from './components/MediaNewsTab';
import CostsRecipesTab from './components/CostsRecipesTab';

import './index.css';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('products');

  // حالتين للتحكم بالقائمة الجانبية واستجابتها
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // تتبع حجم الشاشة لتحديث حالة الموبايل
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // إخفاء القائمة تلقائياً على الموبايل عند الفتح أول مرة، وإظهارها على الديسكتوب
      setSidebarVisible(!mobile);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // تشغيل أولي
    return () => window.removeEventListener('resize', handleResize);
  }, []);

 useEffect(() => {
    // 1. فحص هل يوجد مستخدم مسجل مسبقاً في المتصفح
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsLoggedIn(true); // إذا اكو جلسة، افتح اللوحة
      } else {
        setIsLoggedIn(false); // إذا ماكو، ابقى بصفحة تسجيل الدخول
      }
    };
    
    checkSession();

    // 2. مراقبة أي تغيير في حالة الدخول/الخروج (في حال سجلت خروج)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  // === التحديث هنا: دالة تسجيل الدخول الرسمية ===
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // تسجيل الدخول باستخدام نظام المصادقة الحقيقي
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error || !data.session) {
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'الإيميل أو كلمة المرور غير صحيحة!', confirmButtonColor: '#4B2D1F' });
    } else {
      setShowAnimation(true);
      await supabase.from('system_logs').insert([{ action_type: 'تسجيل دخول', description: 'تم تسجيل دخول المدير للنظام' }]);
      
      setTimeout(() => {
        setShowAnimation(false);
        setIsLoggedIn(true);
      }, 3500);
    }
  };
const handleEnableNotifications = async () => {
  const result = await enablePushNotifications();

  if (result.success) {
    Swal.fire({
      icon: 'success',
      title: 'تم تفعيل الإشعارات 🔔',
      text: 'هذا الجهاز سيستلم إشعارات الطلبات الجديدة.',
      confirmButtonColor: '#4B2D1F',
    });
  } else {
    Swal.fire({
      icon: 'error',
      title: 'تعذر تفعيل الإشعارات',
      text: result.error,
      confirmButtonColor: '#4B2D1F',
    });
  }
};
  // === التحديث هنا: دالة تسجيل الخروج الرسمية ===
  const handleLogout = async () => {
    await supabase.from('system_logs').insert([{ action_type: 'تسجيل خروج', description: 'تم تسجيل خروج المدير من النظام' }]);
    
    // تسجيل الخروج من نظام المصادقة
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    window.location.reload();
  };

  if (!isLoggedIn && !showAnimation) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 15px 30px rgba(0,0,0,0.1)', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
          <FaCrown style={{ fontSize: '4rem', color: 'var(--gold)', marginBottom: '20px' }} />
          <h2 style={{ color: 'var(--dark-brown)', marginBottom: '20px' }}>تسجيل دخول الإدارة</h2>
          <form onSubmit={handleLogin}>
            <input 
  type="email" 
  placeholder="البريد الإلكتروني..." 
  value={email} 
  onChange={(e) => setEmail(e.target.value.trim().toLowerCase())} 
  style={{ width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #ccc' }} 
  required 
/>
<input 
  type="password" 
  placeholder="كلمة المرور..." 
  value={password} 
  onChange={(e) => setPassword(e.target.value.trim())} 
  style={{ width: '100%', padding: '15px', marginBottom: '25px', borderRadius: '10px', border: '1px solid #ccc' }} 
  required 
/>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>دخول ملكي</button>
          </form>
        </div>
      </div>
    );
  }

  if (showAnimation) {
    return (
      <div className="crown-animation-container">
        <FaCrown className="crown-icon" />
        <div className="admin-welcome-text">أهلاً بك، نور نعيم مشكور الربيعي</div>
      </div>
    );
  }

  const navItems = [
  { id: 'stats', label: 'الإحصائيات', icon: <FaChartPie /> },
  { id: 'products', label: 'المنتجات', icon: <FaBoxOpen /> },
  { id: 'orders', label: 'الطلبات', icon: <FaClipboardList /> },
  { id: 'costs', label: 'التكاليف والوصفات', icon: <FaCalculator /> },
  { id: 'media', label: 'اللوحة والأخبار', icon: <FaImage /> },
  { id: 'financials', label: 'المالية والسجل', icon: <FaMoneyCheckAlt /> },
];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-color)', direction: 'rtl', position: 'relative' }}>
      
      {/* غطاء خلفي مظلم للموبايل */}
      {isMobile && sidebarVisible && (
        <div 
          onClick={() => setSidebarVisible(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 998, transition: '0.3s'
          }}
        />
      )}

      {/* القائمة الجانبية */}
      <aside style={{ 
        width: sidebarVisible ? '250px' : '0px',
        minWidth: sidebarVisible ? '250px' : '0px',
        backgroundColor: 'var(--dark-brown)', 
        color: '#fff', 
        padding: sidebarVisible ? '20px' : '0px', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: isMobile ? 'fixed' : 'relative',
        right: 0,
        top: 0,
        bottom: 0,
        height: '100vh',
        zIndex: 999,
        flexShrink: 0,
        boxShadow: sidebarVisible && isMobile ? '-5px 0 15px rgba(0,0,0,0.2)' : 'none'
      }}>
        {isMobile && (
          <button 
            onClick={() => setSidebarVisible(false)}
            style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', marginBottom: '10px' }}
          >
            <FaTimes />
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: '40px', opacity: sidebarVisible ? 1 : 0, transition: '0.2s' }}>
          <FaCrown style={{ fontSize: '3rem', color: 'var(--gold)' }} />
          <h3 style={{ marginTop: '10px', whiteSpace: 'nowrap' }}>نور نعيم</h3>
          <p style={{ color: 'var(--gold)', fontSize: '0.9rem', margin: 0 }}>المدير العام</p>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, opacity: sidebarVisible ? 1 : 0, transition: '0.2s' }}>
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setSidebarVisible(false);
              }}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', borderRadius: '10px', border: 'none', 
                backgroundColor: activeTab === item.id ? 'var(--gold)' : 'transparent', 
                color: '#fff', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s',
                whiteSpace: 'nowrap'
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        
        <button 
          onClick={handleLogout} 
          style={{ 
            marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
            background: '#ff5252', color: '#fff', padding: '12px', border: 'none', borderRadius: '10px', 
            cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap',
            opacity: sidebarVisible ? 1 : 0, transition: '0.2s'
          }}
        >
          <FaSignOutAlt /> تسجيل الخروج
        </button>
      </aside>

      {/* المحتوى الرئيسي للموقع */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        <header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '15px 30px', 
          backgroundColor: '#fff', 
          borderBottom: '1px solid #EADDCD',
          gap: '20px'
        }}>
          <button 
            onClick={() => setSidebarVisible(!sidebarVisible)}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.6rem', 
              color: 'var(--dark-brown)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px',
              borderRadius: '5px',
              transition: '0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <FaBars />
          </button>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--dark-brown)', fontWeight: 'bold' }}>
            لوحة الإدارة الملكية
          </h2>
          <button
    onClick={handleEnableNotifications}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: 'var(--gold)',
      color: '#fff',
      border: 'none',
      padding: '10px 15px',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: 'bold'
    }}
  >
    🔔 تفعيل الإشعارات
  </button>
        </header>

        <main style={{ flex: 1, padding: isMobile ? '20px' : '40px', overflowY: 'auto', height: '100%' }}>
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'stats' && <StatsTab />} 
          {activeTab === 'costs' && <CostsRecipesTab />}
          {activeTab === 'orders' && <OrdersTab />} 
          {activeTab === 'media' && <MediaNewsTab />}
          {activeTab === 'financials' && <FinancialsLogsTab />} 
        </main>
      </div>
    </div>
  );
}