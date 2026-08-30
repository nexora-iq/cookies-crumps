import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';

// إضافة title_en للنوع
type Product = { id: string; title: string; title_en?: string; price: number; image_url: string; category?: string; };

export default function Products({ onAddToCart, lang }: { onAddToCart: (product: Product) => void, lang: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    all: lang === 'ar' ? 'الكل' : 'All',
    cookies: lang === 'ar' ? 'كوكيز' : 'Cookies',
    brownies: lang === 'ar' ? 'براونيز' : 'Brownies',
    trend: lang === 'ar' ? 'ترند' : 'Trend',
    loading: lang === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...',
    buyNow: lang === 'ar' ? 'اطلب الان' : 'Buy Now',
    addToCart: lang === 'ar' ? 'اضف للسلة 🛒' : 'Add to Cart 🛒',
    checkout: lang === 'ar' ? 'اتمام الطلب' : 'Checkout Order',
    notesList: lang === 'ar' 
      ? [
          '⚠️ الطلب يكون قبل 3 ساعات  حصراً',
        ]
      : [
          '⚠️ Orders must be placed 3 hours in advance',
        ],
    fullName: lang === 'ar' ? 'الاسم الكامل' : 'Full Name',
    phone: lang === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    address: lang === 'ar' ? 'العنوان بالكامل' : 'Full Address',
    quantity: lang === 'ar' ? 'عدد البوكسات:' : 'Quantity:',
    notes: lang === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (Optional)',
    product: lang === 'ar' ? 'المنتج:' : 'Product:',
    productsPrice: lang === 'ar' ? 'سعر المنتجات:' : 'Products Price:',
    deliveryPrice: lang === 'ar' ? 'سعر التوصيل:' : 'Delivery Fee:',
    total: lang === 'ar' ? 'المبلغ الكلي:' : 'Total Amount:',
    submit: lang === 'ar' ? 'تأكيد وإرسال الطلب' : 'Confirm & Submit Order',
    submitting: lang === 'ar' ? 'جاري الإرسال...' : 'Submitting...',
    iqd: lang === 'ar' ? 'د.ع' : 'IQD',
    fillFields: lang === 'ar' ? 'يرجى ملء الاسم، رقم الهاتف، والعنوان!' : 'Please fill in name, phone, and address!',
    invalidPhone: lang === 'ar' ? 'عذراً، رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 11 رقم فقط!' : 'Phone must start with 07 and be exactly 11 digits!',
    error: lang === 'ar' ? 'حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى.' : 'Error submitting order, please try again.',
    successTitle: lang === 'ar' ? 'تم استلام طلبك بنجاح! 🎉' : 'Order received successfully! 🎉',
    successText: lang === 'ar' ? 'شكراً لاختيارك Cookies Crumbs. راح نتواصل وياك قريباً.' : 'Thank you for choosing Cookies Crumbs. We will contact you soon.'
  };

  const categoriesMap = [
    { db: 'الكل', label: t.all },
    { db: 'كوكيز', label: t.cookies },
    { db: 'براونيز', label: t.brownies },
    { db: 'ترند', label: t.trend }
  ];
  const [activeCategory, setActiveCategory] = useState('الكل');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1); 
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const deliveryFee = 5000;

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*').eq('is_hidden', false);
      setProducts(data || []);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => activeCategory === 'الكل' || product.category === activeCategory);
  const productTotal = selectedProduct ? selectedProduct.price * quantity : 0;
  const grandTotal = productTotal + deliveryFee;

  const getDisplayTitle = (product: Product) => {
    return lang === 'en' && product.title_en ? product.title_en : product.title;
  };

  const handleAddToCart = (product: Product) => {
    onAddToCart(product);
    
    Swal.fire({
      title: lang === 'ar' ? 'تمت الإضافة' : 'Added',
      text: lang === 'ar' ? `تم إضافة "${getDisplayTitle(product)}" للسلة بنجاح 🛒` : `"${getDisplayTitle(product)}" added to cart successfully 🛒`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      background: '#F7F1E8',
      color: '#4B2D1F',
      iconColor: '#C98A47'
    });
  };

  const submitOrder = async () => {
    if (!name || !phone || !address) {
      Swal.fire({ icon: 'warning', title: lang === 'ar' ? 'تنبيه' : 'Warning', text: t.fillFields, confirmButtonColor: '#4B2D1F' });
      return;
    }
    
    if (!/^07\d{9}$/.test(phone)) {
      Swal.fire({ icon: 'error', title: lang === 'ar' ? 'رقم غير صالح' : 'Invalid Phone', text: t.invalidPhone, confirmButtonColor: '#4B2D1F' });
      return;
    }

    setIsSubmitting(true);
    
    const orderItems = [{
      product_id: selectedProduct?.id,
      title: selectedProduct?.title,
      price: selectedProduct?.price,
      quantity: quantity
    }];

    const { error } = await supabase.from('orders').insert([{
      customer_name: name,
      customer_phone: phone,
      address: address,
      notes: orderNotes,
      items: orderItems,
      total_price: grandTotal
    }]);

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: lang === 'ar' ? 'خطأ' : 'Error', text: t.error, confirmButtonColor: '#4B2D1F' });
    } else {
      
     const telegramToken = import.meta.env.VITE_TELEGRAM_TOKEN;
const chatId = import.meta.env.VITE_CHAT_ID;
      // تنسيق الرسالة اللي راح توصلك
      const telegramMessage = `
🚨 *طلب جديد من الموقع!* 🚨

👤 *الاسم:* ${name}
📱 *الهاتف:* ${phone}
📍 *العنوان:* ${address}

🍪 *المنتج:* ${selectedProduct?.title}
📦 *العدد:* ${quantity} بوكس
💰 *المبلغ الكلي:* ${grandTotal.toLocaleString()} دينار

📝 *ملاحظات:* ${orderNotes ? orderNotes : 'لا توجد'}
      `;

      fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: 'Markdown'
        }),
      }).catch(err => console.error("Telegram Notification Error:", err));
      // --- نهاية كود إرسال إشعار التيليجرام ---

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false); setSelectedProduct(null);
        setQuantity(1); setName(''); setPhone(''); setAddress(''); setOrderNotes('');
      }, 4000);
    }
  };

  return (
    <section id="products" style={{ padding: '60px 20px', backgroundColor: '#F7F1E8', borderRadius: '40px 40px 0 0', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      <div style={{
        maxWidth: '550px',
        margin: '0 auto 40px auto',
        padding: '6px',
        backgroundColor: '#fff',
        borderRadius: '20px',
        border: '1px solid #EADDCD',
        boxShadow: '0 4px 15px rgba(75, 45, 31, 0.05)',
        width: '100%'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '15px', 
          width: '100%',
        }}>
          {categoriesMap.map(cat => (
            <button 
              key={cat.db} 
              onClick={() => setActiveCategory(cat.db)} 
              style={{ 
                flex: 1, 
                padding: '12px 10px', 
                borderRadius: '15px', 
                fontWeight: 'bold', 
                cursor: 'pointer', 
                whiteSpace: 'nowrap', 
                border: 'none', 
                backgroundColor: activeCategory === cat.db ? 'var(--dark-brown)' : 'transparent', 
                color: activeCategory === cat.db ? '#fff' : 'var(--dark-brown)', 
                transition: 'all 0.3s ease',
                fontSize: '1.2rem', 
                textAlign: 'center'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? ( <p style={{ textAlign: 'center', fontSize: '1.2rem', color: 'var(--gold)' }}>{t.loading}</p> ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
          {filteredProducts.map((product) => (
            <div key={product.id} className="cookie-hover" style={{ backgroundColor: 'var(--bg-color)', borderRadius: '20px', padding: '30px 20px', textAlign: 'center', border: '1px solid #EADDCD', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0px' }}>
                {product.image_url ? <img src={product.image_url} alt={getDisplayTitle(product)} style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', filter: 'drop-shadow(0 15px 15px rgba(75, 45, 31, 0.3))' }} /> : <div style={{ fontSize: '5rem' }}>🍪</div>}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--dark-brown)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {getDisplayTitle(product)}
                </h3>
                <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '20px' }}>{product.price.toLocaleString()} {t.iqd}</p>
                
                <button className="btn-primary" style={{ width: '100%', marginBottom: '10px' }} onClick={() => setSelectedProduct(product)}>{t.buyNow}</button>
                <button 
                  style={{ width: '100%', padding: '10px', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: 'transparent', color: 'var(--dark-brown)', border: '2px solid #EADDCD', transition: 'all 0.3s ease' }} 
                  onClick={() => handleAddToCart(product)}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#EADDCD'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {t.addToCart}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && !showSuccess && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)} style={{ left: lang === 'ar' ? '15px' : 'auto', right: lang === 'en' ? '15px' : 'auto' }}>✖</button>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.6rem' }}>{t.checkout}</h3>
            
            <div className="note-warning" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {t.notesList.map((singleNote, idx) => (
                <p key={idx} style={{ margin: 0, padding: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>
                  {singleNote}
                </p>
              ))}
            </div>

            <div className="form-group">
              <label>{t.fullName}</label>
              <input type="text" value={name} onChange={(e)=>setName(e.target.value)} />
            </div>
            
            <div className="form-group">
              <label>{t.phone}</label>
              <input type="tel" maxLength={11} placeholder="07XXXXXXXXX" value={phone} onChange={(e)=>setPhone(e.target.value.replace(/\D/g, ''))} />
            </div>
            
            <div className="form-group">
              <label>{t.address}</label>
              <input type="text" value={address} onChange={(e)=>setAddress(e.target.value)} />
            </div>
            
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9f9f9', padding: '10px 15px', borderRadius: '10px', border: '1px solid #EADDCD' }}>
              <label style={{ margin: 0, fontSize: '1.1rem' }}>{t.quantity}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button type="button" onClick={() => setQuantity(q => q + 1)} style={{ width: '35px', height: '35px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--dark-brown)', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>+</button>
                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>{quantity}</span>
                <button type="button" onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)} style={{ width: '35px', height: '35px', borderRadius: '8px', border: '1px solid var(--dark-brown)', backgroundColor: '#fff', color: 'var(--dark-brown)', fontSize: '1.5rem', cursor: 'pointer' }}>-</button>
              </div>
            </div>

            <div className="form-group">
              <label>{t.notes}</label>
              <textarea rows={2} value={orderNotes} onChange={(e)=>setOrderNotes(e.target.value)}></textarea>
            </div>

            <div className="order-summary" style={{ lineHeight: '1.8' }}>
              <p style={{ margin: 0 }}>{t.product} <strong>{getDisplayTitle(selectedProduct)}</strong></p>
              <p style={{ margin: 0 }}>{t.productsPrice} <strong>{productTotal.toLocaleString()} {t.iqd}</strong></p>
              <p style={{ margin: 0 }}>{t.deliveryPrice} <strong>{deliveryFee.toLocaleString()} {t.iqd}</strong></p>
              <hr style={{ borderTop: '1px solid #EADDCD', margin: '10px 0' }} />
              <p style={{ margin: 0, fontSize: '1.3rem' }}>{t.total} <strong style={{ color: 'var(--gold)' }}>{grandTotal.toLocaleString()} {t.iqd}</strong></p>
            </div>

            <button className="btn-primary" style={{ width: '100%' }} onClick={submitOrder} disabled={isSubmitting}>
              {isSubmitting ? t.submitting : t.submit}
            </button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '20px', textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🎉</div>
            <h3 style={{ color: 'var(--dark-brown)', fontSize: '1.8rem', marginBottom: '10px' }}>{t.successTitle}</h3>
            <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '1.2rem' }}>{t.successText}</p>
          </div>
        </div>
      )}
    </section>
  );
}