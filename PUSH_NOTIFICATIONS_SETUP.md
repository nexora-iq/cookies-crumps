# Cookies Crumbs — إشعارات الطلبات الجديدة

تم تجهيز المشروع ليعمل بطريقتين:

1. **إشعار Push للهاتف** حتى لو صفحة الأدمن مغلقة، بعد السماح بالإشعارات.
2. **صوت `new-order.mp3` + تنبيه داخل لوحة الأدمن** عندما تكون صفحة الأدمن مفتوحة.

## 1) VAPID Public Key

المشروع يستخدم:

`VITE_VAPID_PUBLIC_KEY`

وهو موجود في `.env` حالياً. لا تضع الـ Private Key داخل `.env` الخاص بالواجهة ولا داخل أي ملف `src`.

## 2) Supabase Secrets

من Supabase Dashboard → Edge Functions → Secrets أضف:

- `VAPID_PUBLIC_KEY` = نفس قيمة `VITE_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY` = الـ VAPID Private Key
- `VAPID_SUBJECT` = `mailto:your-email@example.com`
- `WEBHOOK_SECRET` = كلمة سر عشوائية طويلة

ولا ترفع الـ Private Key إلى GitHub أو Vercel/Netlify كمتغير Vite.

`SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` متوفران تلقائياً داخل Edge Functions في Supabase.

## 3) قاعدة البيانات

نفّذ ملف:

`supabase/migrations/202608210001_push_order_notifications.sql`

هذا ينشئ جدول `admin_push_subscriptions` وسياسات RLS، ويضيف `orders` إلى Realtime إن أمكن.

## 4) نشر Edge Function

من داخل مجلد المشروع:

```bash
supabase functions deploy send-order-notification
```

إذا كنت لا تستخدم Supabase CLI، يمكنك إنشاء Function بنفس الاسم ونسخ محتوى:

`supabase/functions/send-order-notification/index.ts`

## 5) ربط orders بالـ Edge Function

من Supabase Dashboard افتح:

Database → Webhooks → Create webhook

الإعدادات:

- Name: `notify-admin-new-order`
- Table: `orders`
- Events: `Insert`
- Method: `POST`
- URL:
  `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-order-notification`

أضف Header:

```text
Authorization: Bearer YOUR_WEBHOOK_SECRET
```

واستبدل `YOUR_WEBHOOK_SECRET` بالقيمة نفسها الموجودة في Secret باسم `WEBHOOK_SECRET`.

بهذا، بمجرد إدخال سجل جديد في `orders`، Supabase يستدعي Edge Function، والـ Function ترسل Push لكل جهاز أدمن مسجل.

## 6) تفعيل الإشعارات على الهاتف

افتح رابط لوحة الإدارة:

`/iamnoor98naem`

سجّل الدخول من الهاتف، ثم اضغط:

**🔔 تفعيل الإشعارات**

واختر Allow / السماح.

كرر العملية على كل جهاز تريد أن يستقبل الطلبات.

## 7) الصوت داخل لوحة الأدمن

الملف:

`public/new-order.mp3`

يتم تشغيله عند وصول `INSERT` جديد إلى جدول `orders` بينما لوحة الأدمن مفتوحة.

إذا كان المتصفح منع الصوت التلقائي، اضغط/المس الصفحة مرة واحدة بعد فتح لوحة الإدارة، وسيتم تجهيز الصوت.

## 8) الاختبار

بعد تفعيل الإشعارات على الهاتف:

1. اترك الهاتف مقفلاً أو أغلق صفحة الأدمن.
2. أرسل طلباً جديداً من المتجر.
3. يجب أن يصل Push للهاتف.
4. إذا كانت لوحة الأدمن مفتوحة، سيظهر التنبيه ويعمل الصوت أيضاً.

> مهم: Push Notifications تحتاج HTTPS (أو localhost أثناء التطوير).
