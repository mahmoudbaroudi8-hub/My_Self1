import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Shows a fixed banner when the device loses internet connection, and a
 * brief "back online" confirmation when it reconnects. Firestore already
 * queues writes locally while offline and syncs automatically once the
 * connection returns (see enableMultiTabIndexedDbPersistence in firebase.ts) —
 * this banner just makes that state visible to the user instead of silent.
 */
export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold text-white shadow-lg transition-all ${
        isOnline ? 'bg-emerald-600' : 'bg-amber-600'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0.5rem)' }}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>رجع الاتصال بالإنترنت — بيتم مزامنة أي تعديلات دلوقتي</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>مفيش اتصال بالإنترنت — أي تعديل بتعمله هيتزامن تلقائي أول ما النت يرجع</span>
        </>
      )}
    </div>
  );
};
