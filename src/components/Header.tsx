import React from 'react';
import logo from '../assets/logo.png';
import { FaShoppingCart, FaGlobe } from 'react-icons/fa';

// استقبلنا عدد السلة ودالة فتحها من التطبيق الرئيسي
export default function Header({ cartCount, onOpenCart }: { cartCount: number, onOpenCart: () => void }) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="main-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {/* الصف الأول: اللوغو والأيقونات (هذا مستحيل يختفي بالموبايل) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <img src={logo} alt="Cookies Crumbs Logo" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold)', fontWeight: 'bold', cursor: 'pointer' }}>
            <FaGlobe /> AR
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
      
      {/* الصف الثاني: الروابط (تسحبها يمنى ويسرى بالموبايل براحتك) */}
      <nav className="nav-links" style={{ width: '100%' }}>
        <span onClick={() => scrollToSection('hero')}>الرئيسية</span>
        <span onClick={() => scrollToSection('products')}>البوكسات</span>
        <span onClick={() => scrollToSection('features')}>لماذا نحن</span>
        <span onClick={() => scrollToSection('footer')}>تواصل معنا</span>
      </nav>
      
    </header>
  );
}