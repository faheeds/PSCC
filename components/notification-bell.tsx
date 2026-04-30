"use client";

import { usePushNotifications } from "@/lib/use-push-notifications";

export function NotificationBell() {
  const { isSubscribed, isLoading, error, subscribe, unsubscribe, isSupported, permission } = usePushNotifications();

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
          isSubscribed
            ? "bg-forest-700/30 border-forest-600/40 text-sage hover:bg-forest-700/50"
            : "bg-navy-700/50 border-white/10 text-navy-300 hover:bg-navy-700 hover:text-navy-100"
        }`}
        title={isSubscribed ? "Turn off notifications" : "Turn on notifications"}
      >
        {isLoading ? (
          <span className="animate-pulse">...</span>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5A5 5 0 003 6.5v4L1.5 12h13L13 10.5v-4A5 5 0 008 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M6.5 13.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              {isSubscribed && <circle cx="12" cy="3" r="2.5" fill="#52b788"/>}
            </svg>
            {isSubscribed ? "Notifications on" : "Enable notifications"}
          </>
        )}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
