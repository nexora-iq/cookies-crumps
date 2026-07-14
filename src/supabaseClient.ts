import { createClient } from '@supabase/supabase-js';

// جلب المتغيرات من ملف .env الخاص بـ Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// التأكد من أن المتغيرات موجودة ولا توجد قيم فارغة لتجنب أخطاء التشغيل
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables in .env file');
}

// إنشاء وتصدير العميل ليتم استخدامه في باقي صفحات الموقع
export const supabase = createClient(supabaseUrl, supabaseAnonKey);