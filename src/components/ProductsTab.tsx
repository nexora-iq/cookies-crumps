import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaPlus, FaTrash, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newTitleEn, setNewTitleEn] = useState(''); // حقل الاسم الإنجليزي
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('كوكيز');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle || !newTitleEn || !newPrice || !selectedFile) {
      Swal.fire('تنبيه', 'الرجاء ملء جميع الحقول (عربي وإنجليزي) واختيار صورة', 'warning');
      return;
    }

    const MAX_SIZE_MB = 3;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    
    if (selectedFile.size > MAX_SIZE_BYTES) {
      Swal.fire({
        icon: 'error',
        title: 'حجم الملف كبير جداً!',
        text: `حجم الملف يجب أن لا يتجاوز ${MAX_SIZE_MB} ميغابايت.`,
        confirmButtonColor: '#4B2D1F'
      });
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setSelectedFile(null);
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('products_media').upload(filePath, selectedFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('products_media').getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      // إضافة الحقلين لقاعدة البيانات
      const { error: dbError } = await supabase.from('products').insert([{
        title: newTitle,
        title_en: newTitleEn, // الاسم الإنجليزي
        price: parseFloat(newPrice),
        category: newCategory,
        image_url: publicUrl,
        is_hidden: false
      }]);

      if (dbError) throw dbError;

      await supabase.from('system_logs').insert([{ action_type: 'إضافة منتج', description: `تمت إضافة منتج جديد: ${newTitle}` }]);

      Swal.fire('نجاح', 'تم إضافة المنتج بنجاح!', 'success');
      setNewTitle(''); setNewTitleEn(''); setNewPrice(''); setSelectedFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchProducts();
    } catch (error: any) {
      Swal.fire('خطأ', error.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleVisibility = async (product: any) => {
    const { error } = await supabase.from('products').update({ is_hidden: !product.is_hidden }).eq('id', product.id);
    if (!error) {
      await supabase.from('system_logs').insert([{ action_type: 'تعديل رؤية منتج', description: `تم ${!product.is_hidden ? 'إخفاء' : 'إظهار'} المنتج: ${product.title}` }]);
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (product: any) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: "سيتم حذف المنتج نهائياً ولن تتمكن من استعادته!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء'
    });

    if (result.isConfirmed) {
      await supabase.from('products').delete().eq('id', product.id);
      const filePath = product.image_url.split('products_media/')[1];
      if (filePath) await supabase.storage.from('products_media').remove([filePath]);
      await supabase.from('system_logs').insert([{ action_type: 'حذف منتج', description: `تم حذف المنتج: ${product.title}` }]);
      Swal.fire('تم الحذف!', 'تم حذف المنتج بنجاح.', 'success');
      fetchProducts();
    }
  };

  return (
    <div>
      <h2 style={{ color: 'var(--dark-brown)', marginBottom: '30px', fontSize: '2rem' }}>إدارة المنتجات والأقسام</h2>
      
      <form onSubmit={handleAddProduct} style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', marginBottom: '40px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: 'var(--dark-brown)', marginBottom: '20px' }}>➕ إضافة منتج جديد</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>اسم المنتج (عربي)</label>
            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>اسم المنتج (إنجليزي)</label>
            <input type="text" dir="ltr" value={newTitleEn} onChange={(e) => setNewTitleEn(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', textAlign: 'left' }} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>السعر (د.ع)</label>
            <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>القسم</label>
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}>
              <option value="كوكيز">كوكيز</option>
              <option value="براونيز">براونيز</option>
              <option value="ترند">ترند</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>اختر صورة (الحد الأقصى 3MB)</label>
          <input id="file-upload" type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }} required />
        </div>
        <button type="submit" className="btn-primary" disabled={isUploading} style={{ padding: '12px 25px', opacity: isUploading ? 0.7 : 1 }}>
          {isUploading ? <><FaSpinner className="fa-spin" /> جاري الرفع...</> : 'رفع وإضافة المنتج'}
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {products.map((product) => (
          <div key={product.id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '15px', display: 'flex', gap: '15px', alignItems: 'center', opacity: product.is_hidden ? 0.5 : 1, transition: '0.3s' }}>
            <img src={product.image_url} alt={product.title} style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover' }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 5px 0', color: 'var(--dark-brown)' }}>
                {product.title}
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'gray', fontWeight: 'normal', marginTop: '3px' }}>{product.title_en}</span>
                {product.is_hidden && <span style={{ color: 'red', fontSize: '0.8rem' }}> (مخفي)</span>}
              </h4>
              <span style={{ backgroundColor: '#EADDCD', padding: '2px 8px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>{product.category}</span>
              <p style={{ margin: '5px 0 0 0', color: 'var(--gold)', fontWeight: 'bold' }}>{product.price.toLocaleString()} د.ع</p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => toggleVisibility(product)} style={{ background: '#e3f2fd', color: '#1565c0', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                {product.is_hidden ? <FaEyeSlash /> : <FaEye />}
              </button>
              <button onClick={() => handleDeleteProduct(product)} style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}