'use client';

import { Button } from '..//ui/button';
import { useAppStore } from '../../lib/kv-store';
import { Menu, Bell, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function Header() {
  const { setSidebarOpen, notifications, notificationPrefs, generateNotifications, deleteNotification, markNotificationAsRead, clearAllNotifications, updateNotificationPrefs } = useAppStore();
  const [open, setOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // İlk yüklemede ve her 60 saniyede bir bildirimleri tazele
  useEffect(() => {
    // İlk mount sonrası kısa gecikme ile tetikle (hydration sonrası state hazır)
    const t = setTimeout(() => generateNotifications(), 300);
    const id = setInterval(() => generateNotifications(), 60000);
    return () => { clearTimeout(t); clearInterval(id); };
  }, [generateNotifications]);

  // Yeni bildirim geldiğinde ses çal (liste boyutu arttıysa)
  const prevCountRef = useRef<number>(0);
  useEffect(() => {
    if (notificationPrefs.enableSound && notifications.length > prevCountRef.current && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    prevCountRef.current = notifications.length;
  }, [notifications, notificationPrefs.enableSound]);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 dark:bg-gray-900 dark:border-gray-700">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      <div className="flex-1 lg:pl-0">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
      </div>

      {/* Actions */}
      <div className="relative flex items-center space-x-2">
        <audio ref={audioRef} preload="auto" src="/assets/sounds/ios-notification.mp3" />
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} className="relative">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </Button>
        {open && (
          <div className="absolute right-0 top-10 w-96 max-h-96 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bildirimler</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => clearAllNotifications()} className="text-red-600">Tümünü Temizle</Button>
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={notificationPrefs.enableNotifications} onChange={(e) => updateNotificationPrefs({ enableNotifications: e.target.checked })} />
                  Bildirimler Açık
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={notificationPrefs.enableSound} onChange={(e) => updateNotificationPrefs({ enableSound: e.target.checked })} />
                  Ses
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={notificationPrefs.enableNative} onChange={(e) => updateNotificationPrefs({ enableNative: e.target.checked })} />
                  Tarayıcı Bildirimi
                </label>
                {notificationPrefs.enableNative && (
                  <Button variant="outline" size="xs" onClick={async () => { try { await Notification.requestPermission(); } catch {} }}>İzin İste</Button>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Bildirim yok</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`p-3 flex items-start gap-3 ${n.read ? '' : 'bg-blue-50 dark:bg-blue-900/20'}`} onMouseEnter={() => markNotificationAsRead(n.id)}>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{n.title}</div>
                      {n.description && (
                        <div className="text-xs text-muted-foreground mt-1">{n.description}</div>
                      )}
                      <div className="text-[11px] text-muted-foreground mt-1">{format(n.date, 'dd MMM yyyy', { locale: tr })}</div>
                      {n.link && (
                        <a href={n.link} className="text-xs text-blue-600 hover:underline mt-1 inline-block" onClick={() => markNotificationAsRead(n.id)}>Git</a>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteNotification(n.id)} className="text-red-600">
                      Sil
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
