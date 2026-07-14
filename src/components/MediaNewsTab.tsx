import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaPlus, FaTrash, FaEye, FaEyeSlash, FaSpinner, FaVideo, FaNewspaper } from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function MediaNewsTab() {
  const [billboards, setBillboards] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  
  // حقول اللوحة الإعلانية
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // حقول الأخبار (تم فصلها لعربي وإنجليزي)
  const [newsTextAr, setNewsTextAr] = useState('');
  const [newsTextEn, setNewsTextEn] = useState('');
  const [isAddingNews, setIsAddingNews] = useState(false);

  const fetchData = async () => {
    // جلب الإعلانات
    const { data: bData } = await supabase.from('billboard').select('*').order('created_at', { ascending: false });
    if (bData) setBillboards(bData);

    // جلب الأخبار
    const { data: nData } = await supabase.from('news_ticker').select('*').order('created_at', { ascending: false });
    if (nData) setNews(nData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- دوال اللوحة الإعلانية ---
  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return Swal.fire('تنبيه', 'الرجاء اختيار ملف', 'warning');

    const MAX_SIZE_MB = 10; 
    if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      return Swal.fire('خطأ', `حجم الملف كبير. الحد الأقصى ${MAX_SIZE_MB}MB`, 'error');
    }

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${fileName}`; // تم تعديل المسار لتجنب مشكلة المجلدات

      const { error: uploadError } = await supabase.storage.from('products_media').upload(filePath, selectedFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('products_media').getPublicUrl(filePath);
      
      const mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image';

      await supabase.from('billboard').insert([{ 
        media_url: publicUrlData.publicUrl, 
        media_type: mediaType,
        is_hidden: false 
      }]);

      await supabase.from('system_logs').insert([{ action_type: 'إضافة إعلان', description: `تمت إضافة ${mediaType} للوحة الإعلانية` }]);

      Swal.fire('نجاح', 'تم رفع الملف وعرضه في اللوحة', 'success');
      setSelectedFile(null);
      (document.getElementById('media-upload') as HTMLInputElement).value = '';
      fetchData();
    } catch (error: any) {
      Swal.fire('خطأ', error.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleMediaVisibility = async (media: any) => {
    await supabase.from('billboard').update({ is_hidden: !media.is_hidden }).eq('id', media.id);
    fetchData();
  };

  const handleDeleteMedia = async (media: any) => {
    const result = await Swal.fire({ title: 'هل أنت متأكد؟', icon: 'warning', showCancelButton: true, confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء' });
    if (result.isConfirmed) {
      await supabase.from('billboard').delete().eq('id', media.id);
      const filePath = media.media_url.split('products_media/')[1];
      if (filePath) await supabase.storage.from('products_media').remove([filePath]);
      
      await supabase.from('system_logs').insert([{ action_type: 'حذف إعلان', description: 'تم حذف ملف من اللوحة الإعلانية' }]);
      fetchData();
    }
  };

  // --- دوال الأخبار (محدثة لدعم اللغتين) ---
  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTextAr.trim() || !newsTextEn.trim()) {
      Swal.fire('تنبيه', 'الرجاء كتابة الخبر باللغتين العربية والإنجليزية', 'warning');
      return;
    }

    setIsAddingNews(true);
    const { error } = await supabase.from('news_ticker').insert([{ 
      text_content: newsTextAr, 
      text_content_en: newsTextEn, 
      is_hidden: false 
    }]);
    setIsAddingNews(false);

    if (!error) {
      await supabase.from('system_logs').insert([{ action_type: 'إضافة خبر', description: 'تم إضافة نص لشريط الأخبار' }]);
      setNewsTextAr('');
      setNewsTextEn('');
      fetchData();
    } else {
      Swal.fire('خطأ', 'حدث خطأ أثناء الإضافة', 'error');
    }
  };

  const toggleNewsVisibility = async (item: any) => {
    await supabase.from('news_ticker').update({ is_hidden: !item.is_hidden }).eq('id', item.id);
    fetchData();
  };

  const handleDeleteNews = async (id: string) => {
    await supabase.from('news_ticker').delete().eq('id', id);
    fetchData();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
      
      {/* قسم اللوحة الإعلانية */}
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: 'var(--dark-brown)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><FaVideo /> صور وفيديوهات الواجهة</h3>
        
        <form onSubmit={handleAddMedia} style={{ marginBottom: '30px' }}>
          <input id="media-upload" type="file" accept="image/*,video/*" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '8px' }} required />
          <button type="submit" className="btn-primary" disabled={isUploading} style={{ width: '100%', padding: '10px' }}>
            {isUploading ? <><FaSpinner className="fa-spin" /> جاري الرفع...</> : 'إضافة للوحة'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {billboards.map(media => (
            <div key={media.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', border: '1px solid #eee', borderRadius: '10px', opacity: media.is_hidden ? 0.5 : 1 }}>
              {media.media_type === 'video' ? (
                <video src={media.media_url} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '5px' }} muted />
              ) : (
                <img src={media.media_url} alt="إعلان" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '5px' }} />
              )}
              <div style={{ flex: 1, fontWeight: 'bold', fontSize: '0.9rem' }}>
                {media.media_type === 'video' ? 'فيديو إعلاني' : 'صورة إعلانية'}
                {media.is_hidden && <span style={{ color: 'red', display: 'block', fontSize: '0.8rem' }}>مخفي حالياً</span>}
              </div>
              <button onClick={() => toggleMediaVisibility(media)} style={{ background: 'none', border: 'none', color: '#1565c0', cursor: 'pointer' }}>{media.is_hidden ? <FaEyeSlash size={20}/> : <FaEye size={20}/>}</button>
              <button onClick={() => handleDeleteMedia(media)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}><FaTrash size={20}/></button>
            </div>
          ))}
        </div>
      </div>

      {/* قسم شريط الأخبار */}
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: 'var(--dark-brown)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><FaNewspaper /> نصوص شريط الأخبار</h3>
        
        <form onSubmit={handleAddNews} style={{ marginBottom: '30px' }}>
          <textarea value={newsTextAr} onChange={(e) => setNewsTextAr(e.target.value)} placeholder="اكتب الخبر العاجل (بالعربي)..." rows={2} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '8px', resize: 'none' }} required />
          <textarea value={newsTextEn} onChange={(e) => setNewsTextEn(e.target.value)} placeholder="اكتب الخبر العاجل (English)..." rows={2} dir="ltr" style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '8px', resize: 'none', textAlign: 'left' }} required />
          <button type="submit" className="btn-primary" disabled={isAddingNews} style={{ width: '100%', padding: '10px' }}>
            {isAddingNews ? 'جاري الإضافة...' : 'إضافة لشريط الأخبار'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {news.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '10px', opacity: item.is_hidden ? 0.5 : 1 }}>
              <div style={{ flex: 1, fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--dark-brown)', marginBottom: '5px' }}>عربي: {item.text_content}</div>
                <div style={{ color: 'gray', direction: 'ltr', textAlign: 'left' }}>EN: {item.text_content_en || 'لا يوجد'}</div>
              </div>
              <button onClick={() => toggleNewsVisibility(item)} style={{ background: 'none', border: 'none', color: '#1565c0', cursor: 'pointer' }}>{item.is_hidden ? <FaEyeSlash size={18}/> : <FaEye size={18}/>}</button>
              <button onClick={() => handleDeleteNews(item.id)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}><FaTrash size={18}/></button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}