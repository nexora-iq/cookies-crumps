import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function NewsBar({ lang }: { lang: string }) {
  const [news, setNews] = useState<string>('');

  useEffect(() => {
    setNews(lang === 'ar' ? 'جاري تحميل الأخبار...' : 'Loading news...');

    async function fetchNews() {
      // جلب النصين العربي والإنجليزي
      const { data, error } = await supabase
        .from('news_ticker')
        .select('text_content, text_content_en')
        .eq('is_hidden', false);
      
      if (!error && data && data.length > 0) {
        // إذا اللغة انجليزية والنص الانجليزي موجود، اعرضه. وإلا اعرض العربي.
        const combined = data.map(item => {
          if (lang === 'en' && item.text_content_en) {
            return item.text_content_en;
          }
          return item.text_content;
        }).join('  🍪  ');
        
        setNews(combined);
      } else {
        setNews(
          lang === 'ar' 
            ? 'صاير ببالك شي حلو ويدفي قلبك ؟ الكوكيز مالتنا ينتظرك'
            : 'Craving something sweet to warm your heart? Our cookies are waiting for you🤎'
        );
      }
    }
    
    fetchNews();
  }, [lang]);

  return (
    <div className="news-ticker">
      <div className="news-ticker-content">
        {news}
      </div>
    </div>
  );
}