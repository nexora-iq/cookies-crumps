import React from 'react';
import Stories from './Stories';

// ضفنا استلام اللغة (lang)
export default function Hero({ lang }: { lang: string }) {
  
  // قاموس الترجمة الخاص بقسم الهيرو
  const t = {
    subtitle: lang === 'ar' ? 'اطلب مرة، راح ترجع كل مرة.' : 'Order once, you will come back every time.'
  };

  return (
    <section id="hero" style={{ textAlign: 'center', padding: '40px 20px', position: 'relative' }}>
      
      {/* الستوريات تظهر هنا */}
      <Stories />
      
      {/* النص يتغير حسب اللغة */}
      <p style={{ fontSize: '1.2rem', color: 'var(--caramel)', marginBottom: '30px', fontWeight: '600' }}>
        {t.subtitle}
      </p>
      
    </section>
  );
}