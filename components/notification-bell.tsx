"use client";

import { usePushNotifications } from "@/lib/use-push-notifications";

export function NotificationBell() {
  const { isSubscribed, isLoading, error, subscribe, unsubscribe, isSupported } = usePushNotifications();

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        title={isSubscribed ? "Notifications on — tap to turn off" : "Tap to enable notifications"}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
          isSubscribed
            ? "bg-forest-700/30 border-forest-600/40 text-sage"
            : "bg-navy-700/50 border-white/10 text-navy-400 hover:text-navy-200"
        }`}
      >
        {isLoading ? (
          <span className="animate-pulse text-navy-400">...</span>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5A5 5 0 003 6.5v4L1.5 12h13L13 10.5v-4A5 5 0 008 1.5z"
                stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M6.5 13.5a1.5 1.5 0 003 0"
                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              {isSubscribed && (
                <circle cx="12" cy="3" r="2.5" fill="#52b788"/>
              )}
            </svg>
            <span className="hidden sm:inline">
              {isSubscribed ? "Notifs on" : "Enable notifs"}
            </span>
          </>
        )}
      </button>
      {error && (
        <p className="text-red-400 text-[10px] max-w-[120px] truncate" title={error}>
          {error}
        </p>
      )}
    </div>
  );
}
