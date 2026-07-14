import React from 'react';
import logo from '../assets/logo.png';
import { FaInstagram, FaTiktok, FaMapMarkerAlt, FaTruck } from 'react-icons/fa';

// استلام اللغة من التطبيق الرئيسي
export default function Footer({ lang }: { lang: string }) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // قاموس الترجمة للفوتر
  const t = {
    home: lang === 'ar' ? 'الرئيسية' : 'Home',
    boxes: lang === 'ar' ? 'البوكسات' : 'Boxes',
    whyUs: lang === 'ar' ? 'لماذا نحن' : 'Why Us',
    instagram: lang === 'ar' ? 'إنستغرام' : 'Instagram',
    tiktok: lang === 'ar' ? 'تيك توك' : 'TikTok',
    location: lang === 'ar' ? 'بغداد - العراق' : 'Baghdad - Iraq',
    delivery: lang === 'ar' ? 'توصيل لكافة المناطق' : 'Delivery to all areas',
    copyright: lang === 'ar' ? 'جميع الحقوق محفوظة © 2026 Cookies Crumbs' : 'All rights reserved © 2026 Cookies Crumbs'
  };

  return (
    <footer id="footer" style={{ backgroundColor: 'var(--dark-brown)', color: '#F7F1E8', padding: '60px 20px 20px', textAlign: 'center', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      <img src={logo} alt="Cookies Crumbs" style={{ height: '90px', width: 'auto', objectFit: 'contain', marginBottom: '20px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
      
      {/* روابط سريعة للفوتر */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginBottom: '40px', fontWeight: 'bold', color: 'var(--gold)', flexWrap: 'wrap' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => scrollToSection('hero')}>{t.home}</span>
        <span style={{ cursor: 'pointer' }} onClick={() => scrollToSection('products')}>{t.boxes}</span>
        <span style={{ cursor: 'pointer' }} onClick={() => scrollToSection('features')}>{t.whyUs}</span>
      </div>

      {/* أيقونات التواصل */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '40px', flexWrap: 'wrap', fontSize: '1.2rem' }}>
        <a href="https://instagram.com/cookiescrumbs.iq" target="_blank" rel="noreferrer" style={{ color: '#F7F1E8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaInstagram style={{ fontSize: '1.8rem', color: 'var(--gold)' }} /> {t.instagram}
        </a>
        <a href="https://tiktok.com/@cookiescrumbs.iq" target="_blank" rel="noreferrer" style={{ color: '#F7F1E8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaTiktok style={{ fontSize: '1.8rem', color: 'var(--gold)' }} /> {t.tiktok}
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaMapMarkerAlt style={{ fontSize: '1.8rem', color: 'var(--gold)' }} /> {t.location}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaTruck style={{ fontSize: '1.8rem', color: 'var(--gold)' }} /> {t.delivery}
        </div>
      </div>

      <p style={{ fontSize: '1rem', color: '#D7A66A', borderTop: '1px solid #734c38', paddingTop: '20px', margin: 0 }}>
        {t.copyright}
      </p>
    </footer>
  );
}