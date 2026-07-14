import React from 'react';

// ضفنا lang لاستلام اللغة الحالية من الـ App
export default function Features({ lang }: { lang: string }) {
  
  // قاموس الترجمة لعنوان القسم والمميزات
  const t = {
    heading: lang === 'ar' ? 'لماذا Cookies Crumbs؟' : 'Why Cookies Crumbs?',
    bakedTitle: lang === 'ar' ? 'يخبز يومياً' : 'Baked Daily',
    bakedDesc: lang === 'ar' ? 'كوكيز طازجة كل يوم' : 'Fresh cookies every day',
    deliveryTitle: lang === 'ar' ? 'توصيل سريع' : 'Fast Delivery',
    deliveryDesc: lang === 'ar' ? 'لكافة مناطق بغداد' : 'To all areas of Baghdad',
    ingredientsTitle: lang === 'ar' ? 'مكونات فاخرة' : 'Premium Ingredients',
    ingredientsDesc: lang === 'ar' ? 'أجود المكونات المختارة' : 'Finest selected ingredients',
    loveTitle: lang === 'ar' ? 'مصنوع بحب' : 'Made with Love',
    loveDesc: lang === 'ar' ? 'جودة نضعها بين يديك' : 'Quality in your hands'
  };

  const featuresList = [
    { icon: '🍪', title: t.bakedTitle, desc: t.bakedDesc },
    { icon: '🚚', title: t.deliveryTitle, desc: t.deliveryDesc },
    { icon: '🍫', title: t.ingredientsTitle, desc: t.ingredientsDesc },
    { icon: '❤️', title: t.loveTitle, desc: t.loveDesc },
  ];

  return (
    <section id="features" style={{ padding: '80px 20px', textAlign: 'center', backgroundColor: 'var(--bg-color)', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      <h2 style={{ fontSize: '2.2rem', marginBottom: '50px', color: 'var(--dark-brown)' }}>{t.heading}</h2>
      
      <div className="features-container" style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        {featuresList.map((item, index) => (
          <div key={index} className="feature-card" style={{
            backgroundColor: '#fff', padding: '30px 20px', borderRadius: '40px', width: '170px',
            boxShadow: '0 8px 15px rgba(75, 45, 31, 0.05)', border: '1px solid #EADDCD'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1px' }}>{item.icon}</div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--dark-brown)', marginBottom: '10px' }}>{item.title}</h3>
            <p style={{ color: 'var(--gold)', fontWeight: '600', margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}