import { pushApi } from '../api';

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// iOS only allows Push for a Home Screen web app — a normal Safari tab will
// have PushManager undefined entirely, so isPushSupported() already covers
// that case there. This helper is just for showing a clearer message.
export function isIosNotStandalone(): boolean {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = ('standalone' in navigator) && (navigator as any).standalone === true;
  return isIos && !standalone;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function enablePush(): Promise<void> {
  if (!isPushSupported()) throw new Error('הדפדפן הזה לא תומך בהתראות Push');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('לא ניתנה הרשאה להתראות');

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const { data } = await pushApi.getVapidKey();
  if (!data.publicKey) throw new Error('השרת עוד לא הוגדר להתראות Push (חסר VAPID_PUBLIC_KEY)');

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey) as unknown as BufferSource,
    });
  }

  await pushApi.subscribe(subscription.toJSON());
}

export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await pushApi.unsubscribe(subscription.endpoint);
    await subscription.unsubscribe();
  }
}
