import React, { useEffect, useState } from 'react';
import './index.css';
import logo from './assets/logo.png';
import { supabase } from './supabaseClient';
import { FaShoppingCart, FaGlobe } from 'react-icons/fa';
import Swal from 'sweetalert2';

import NewsBar from './components/NewsBar';
import Hero from './components/Hero';
import Products from './components/Products';
import Features from './components/Features';
import Footer from './components/Footer';

type CartItem = { id: string; title: string; price: number; quantity: number };

function Header({ cartCount, onOpenCart, lang, toggleLang }: { cartCount: number, onOpenCart: () => void, lang: string, toggleLang: () => void }) {
  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  
  const t = {
    home: lang === 'ar' ? 'الرئيسية' : 'Home',
    boxes: lang === 'ar' ? 'البوكسات' : 'Boxes',
    whyUs: lang === 'ar' ? 'لماذا نحن' : 'Why Us',
    contact: lang === 'ar' ? 'تواصل معنا' : 'Contact Us'
  };

  return (
    <header className="main-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <img src={logo} alt="Cookies Crumbs" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          
          <span onClick={toggleLang} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold)', fontWeight: 'bold', cursor: 'pointer' }}>
            <FaGlobe /> {lang === 'ar' ? 'EN' : 'AR'}
          </span>
          
          <span onClick={onOpenCart} style={{ display: 'flex', alignItems: 'center', color: 'var(--dark-brown)', fontSize: '1.5rem', position: 'relative', cursor: 'pointer' }}>
            <FaShoppingCart />
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-12px', background: '#D93025', color: '#fff', fontSize: '0.8rem', padding: '2px 7px', borderRadius: '50%', fontWeight: 'bold' }}>
                {cartCount}
              </span>
            )}
          </span>
        </div>
      </div>
      <nav className="nav-links" style={{ width: '100%' }}>
        <span onClick={() => scrollToSection('hero')}>{t.home}</span>
        <span onClick={() => scrollToSection('products')}>{t.boxes}</span>
        <span onClick={() => scrollToSection('features')}>{t.whyUs}</span>
        <span onClick={() => scrollToSection('footer')}>{t.contact}</span>
      </nav>
    </header>
  );
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [lang, setLang] = useState('ar');

  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cookies_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryFee = 5000;
  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartTotal = cartSubtotal > 0 ? cartSubtotal + deliveryFee : 0;

  useEffect(() => {
    localStorage.setItem('cookies_cart', JSON.stringify(cart));
  }, [cart]);

  // === تنظيف السلة بصمت عند فتح الموقع ===
  useEffect(() => {
    const cleanStaleCartItems = async () => {
      const savedCartStr = localStorage.getItem('cookies_cart');
      if (!savedCartStr) return;
      const savedCart = JSON.parse(savedCartStr);
      if (savedCart.length === 0) return;

      // جلب المنتجات الفعالة فقط من قاعدة البيانات
      const { data: activeProducts } = await supabase.from('products').select('id').eq('is_hidden', false);
      if (activeProducts) {
        const validIds = activeProducts.map(p => p.id);
        const validCart = savedCart.filter((item: CartItem) => validIds.includes(item.id));
        
        // إذا كان هناك فرق بالعدد (يعني اكو منتج محذوف)، نحدث السلة
        if (validCart.length !== savedCart.length) {
          setCart(validCart);
          localStorage.setItem('cookies_cart', JSON.stringify(validCart));
        }
      }
    };
    cleanStaleCartItems();
  }, []);

  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 3000); 
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  const toggleLang = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const handleAddToCart = (product: any) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    Swal.fire({
      title: lang === 'ar' ? 'تمت الإضافة' : 'Added',
      text: lang === 'ar' ? `تم إضافة "${product.title}" للسلة` : `"${product.title}" added to cart`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: item.quantity + delta };
      }
      return item;
    }).filter(item => item.quantity > 0)); 
  };

  const submitCartOrder = async () => {
    if (!name || !phone || !address) {
      Swal.fire({ icon: 'warning', title: lang === 'ar' ? 'تنبيه' : 'Warning', text: lang === 'ar' ? 'يرجى ملء الاسم، رقم الهاتف، والعنوان!' : 'Please fill all required fields!', confirmButtonColor: '#4B2D1F' });
      return;
    }

    if (!/^07\d{9}$/.test(phone)) {
      Swal.fire({ icon: 'error', title: lang === 'ar' ? 'رقم غير صالح' : 'Invalid Phone', text: lang === 'ar' ? 'رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 11 رقم حصراً!' : 'Phone must start with 07 and be exactly 11 digits!', confirmButtonColor: '#4B2D1F' });
      return;
    }

    setIsSubmitting(true);

    // === جدار الحماية النهائي: فحص المنتجات قبل الإرسال ===
    const { data: activeProducts } = await supabase.from('products').select('id').eq('is_hidden', false);
    const validIds = activeProducts?.map(p => p.id) || [];
    const invalidItems = cart.filter(item => !validIds.includes(item.id));

    // إذا لكى منتجات محذوفة بالسلة، يوقف الطلب ويمسحها ويبلغ الزبون
    if (invalidItems.length > 0) {
      setIsSubmitting(false);
      setCart(prev => prev.filter(item => validIds.includes(item.id)));
      
      Swal.fire({
        icon: 'error',
        title: lang === 'ar' ? 'تحديث في السلة' : 'Cart Updated',
        text: lang === 'ar' ? 'عذراً، بعض المنتجات في سلتك نفدت أو تم حذفها. تم تحديث السلة الآن.' : 'Sorry, some products in your cart are no longer available. Your cart has been updated.',
        confirmButtonColor: '#4B2D1F'
      });
      return; 
    }

    const orderItems = cart.map(item => ({
      product_id: item.id,
      title: item.title,
      price: item.price,
      quantity: item.quantity
    }));

    const { error } = await supabase.from('orders').insert([{
      customer_name: name,
      customer_phone: phone, 
      address: address,
      notes: notes,
      items: orderItems,
      total_price: cartTotal
    }]);

    setIsSubmitting(false);

    if (error) {
      console.error("خطأ الإرسال:", error.message);
      Swal.fire({ icon: 'error', title: lang === 'ar' ? 'خطأ' : 'Error', text: lang === 'ar' ? 'حدث خطأ أثناء إرسال الطلب!' : 'Error submitting order!', confirmButtonColor: '#4B2D1F' });
    } else {
      setCart([]); 
      setIsCartOpen(false);
      setName(''); setPhone(''); setAddress(''); setNotes('');
      
      Swal.fire({
        icon: 'success',
        title: lang === 'ar' ? 'تم استلام طلبك بنجاح! 🎉' : 'Order received successfully! 🎉',
        text: lang === 'ar' ? 'راح نتواصل وياك قريباً لتأكيد الطلب 🍪' : 'We will contact you soon to confirm the order 🍪',
        confirmButtonColor: '#4B2D1F'
      });
    }
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="app-container" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      {showWelcome && (
        <div className="welcome-screen" onClick={() => setShowWelcome(false)} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Welcome" className="welcome-logo" style={{ filter: 'drop-shadow(0 15px 25px rgba(75, 45, 31, 0.3))' }} />
          <p style={{ marginTop: '40px', color: 'var(--gold)', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
            {lang === 'ar' ? 'اضغط في أي مكان للتخطي' : 'Tap anywhere to skip'} <span style={{ fontSize: '1.4rem', transform: lang === 'en' ? 'rotate(180deg)' : 'none' }}>➔</span>
          </p>
        </div>
      )}

      <div className="sticky-wrapper">
        <Header cartCount={cart.length} onOpenCart={() => setIsCartOpen(true)} lang={lang} toggleLang={toggleLang} />
      </div>
      
      <NewsBar lang={lang} />
      <Hero lang={lang} />
      <Products onAddToCart={handleAddToCart} lang={lang} />
      <Features lang={lang} />
      <Footer lang={lang}/>
      
      {/* ===== واجهة سلة المشتريات (Modal) ===== */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
            <button className="modal-close" onClick={() => setIsCartOpen(false)} style={{ left: lang === 'ar' ? '15px' : 'auto', right: lang === 'en' ? '15px' : 'auto' }}>✖</button>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.6rem' }}>{lang === 'ar' ? 'سلة المشتريات 🛒' : 'Shopping Cart 🛒'}</h3>
            
            {cart.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: '1.2rem', color: 'gray' }}>{lang === 'ar' ? 'سلتك فارغة حالياً.' : 'Your cart is empty.'}</p>
            ) : (
              <>
                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EADDCD', padding: '10px 0' }}>
                      <div style={{ overflow: 'hidden' }}>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--dark-brown)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{item.title}</strong>
                        <p style={{ margin: 0, color: 'var(--gold)', fontWeight: 'bold' }}>{(item.price * item.quantity).toLocaleString()} د.ع</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => updateCartQuantity(item.id, 1)} style={{ width: '35px', height: '35px', borderRadius: '5px', border: 'none', backgroundColor: 'var(--dark-brown)', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.id, -1)} style={{ width: '35px', height: '35px', borderRadius: '5px', border: '1px solid var(--dark-brown)', backgroundColor: '#fff', color: 'var(--dark-brown)', cursor: 'pointer', fontSize: '1.2rem' }}>-</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label>{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input type="text" placeholder={lang === 'ar' ? 'اسمك الثلاثي...' : 'Your full name...'} value={name} onChange={(e)=>setName(e.target.value)} />
                </div>
                
                <div className="form-group">
                  <label>{lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <input type="tel" placeholder="07XXXXXXXXX" maxLength={11} value={phone} onChange={(e)=>setPhone(e.target.value.replace(/\D/g, ''))} />
                </div>
                
                <div className="form-group">
                  <label>{lang === 'ar' ? 'العنوان بالكامل' : 'Full Address'}</label>
                  <input type="text" placeholder={lang === 'ar' ? 'المنطقة، المحلة، الزقاق...' : 'City, Street, House...'} value={address} onChange={(e)=>setAddress(e.target.value)} />
                </div>
                
                <div className="form-group">
                  <label>{lang === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (Optional)'}</label>
                  <textarea rows={2} placeholder={lang === 'ar' ? 'أي ملاحظات تخص الطلب...' : 'Any notes for the order...'} value={notes} onChange={(e)=>setNotes(e.target.value)}></textarea>
                </div>
                
                <div className="order-summary" style={{ lineHeight: '1.8' }}>
                  <p style={{ margin: 0 }}>{lang === 'ar' ? 'سعر المنتجات:' : 'Subtotal:'} <strong>{cartSubtotal.toLocaleString()} د.ع</strong></p>
                  <p style={{ margin: 0 }}>{lang === 'ar' ? 'سعر التوصيل:' : 'Delivery:'} <strong>{deliveryFee.toLocaleString()} د.ع</strong></p>
                  <hr style={{ borderTop: '1px solid #EADDCD', margin: '10px 0' }} />
                  <p style={{ margin: 0, fontSize: '1.3rem' }}>{lang === 'ar' ? 'المبلغ الكلي:' : 'Total:'} <strong style={{ color: 'var(--gold)' }}>{cartTotal.toLocaleString()} د.ع</strong></p>
                </div>
                
                <button className="btn-primary" style={{ width: '100%', fontSize: '1.2rem', padding: '15px' }} onClick={submitCartOrder} disabled={isSubmitting}>
                  {isSubmitting ? (lang === 'ar' ? 'جاري الإرسال...' : 'Submitting...') : (lang === 'ar' ? 'تأكيد طلب السلة' : 'Confirm Order')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}