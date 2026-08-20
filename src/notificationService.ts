import { supabase } from './supabaseClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) => char.charCodeAt(0))
  );
}

export async function enablePushNotifications() {
  try {
    if (!('serviceWorker' in navigator)) {
      throw new Error('المتصفح لا يدعم Service Worker');
    }

    if (!('PushManager' in window)) {
      throw new Error('هذا المتصفح لا يدعم Push Notifications');
    }

    if (!VAPID_PUBLIC_KEY) {
      throw new Error('VAPID Public Key غير موجود');
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      throw new Error('لم يتم السماح بالإشعارات');
    }

    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          VAPID_PUBLIC_KEY
        ),
      });
    }

    const subscriptionJson = subscription.toJSON();

    if (
      !subscriptionJson.endpoint ||
      !subscriptionJson.keys?.p256dh ||
      !subscriptionJson.keys?.auth
    ) {
      throw new Error('بيانات الاشتراك غير مكتملة');
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('يجب تسجيل الدخول كمدير أولاً');
    }

    const { error } = await supabase
      .from('admin_push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: subscriptionJson.endpoint,
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth,
          device_name: getDeviceName(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,endpoint',
        }
      );

    if (error) {
      throw error;
    }

    return {
      success: true,
      subscription,
    };
  } catch (error: any) {
    console.error('Push notification error:', error);

    return {
      success: false,
      error: error.message || 'حدث خطأ غير معروف',
    };
  }
}

function getDeviceName() {
  const ua = navigator.userAgent;

  if (/iPhone|iPad|iPod/i.test(ua)) {
    return 'iPhone / iPad';
  }

  if (/Android/i.test(ua)) {
    return 'Android';
  }

  if (/Windows/i.test(ua)) {
    return 'Windows';
  }

  if (/Macintosh/i.test(ua)) {
    return 'Mac';
  }

  return 'Unknown Device';
}