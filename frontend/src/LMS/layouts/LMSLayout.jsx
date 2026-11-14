import { useEffect, useState } from 'react';
import MobileTopBar from '../components/navigation/MobileTopBar';
import BottomTabBar from '../components/navigation/BottomTabBar';
import MoreDrawerSheet from '../components/navigation/MoreDrawerSheet';
import UpdatePrompt from '../pwa/UpdatePrompt';
import OfflineFallback from '../pwa/OfflineFallback';
import InstallInstructions from '../pwa/InstallInstructions';
import { contentService } from '../services/contentService';
import { useLMSAuth } from '../context/LMSAuthContext';

export default function LMSLayout({
  title,
  subtitle,
  tabs = [],
  moreItems = [],
  moreTitle = 'More LMS Tools',
  notificationsPath = '/lms/notifications',
  children,
}) {
  const { user } = useLMSAuth();
  const [phoneFrame, setPhoneFrame] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    contentService
      .listNotifications()
      .then((list) => setUnreadCount(list.filter((n) => !n.isRead).length))
      .catch(() => {});
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-200/80 md:py-5 md:px-4">
      <div
        className={`relative mx-auto flex h-[100dvh] md:h-[min(calc(100dvh-2.5rem),840px)] flex-col overflow-hidden bg-slate-50 shadow-app transition-all duration-200 ${
          phoneFrame
            ? 'max-w-[430px] md:rounded-[34px] md:border-[6px] md:border-slate-900'
            : 'max-w-3xl md:rounded-3xl md:border md:border-slate-200'
        }`}
      >
        <MobileTopBar
          title={title}
          subtitle={subtitle}
          unreadCount={unreadCount}
          notificationsPath={notificationsPath}
          phoneFrame={phoneFrame}
          onTogglePhoneFrame={() => setPhoneFrame((v) => !v)}
        />

        <UpdatePrompt />
        <OfflineFallback />

        <main className="flex-1 overflow-y-auto pb-6">{children}</main>

        {tabs.length > 0 && (
          <BottomTabBar
            tabs={tabs}
            onMoreClick={() => setMoreOpen(true)}
            moreActive={moreOpen}
          />
        )}

        <MoreDrawerSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          title={moreTitle}
          items={moreItems}
        />

        <InstallInstructions />
      </div>
    </div>
  );
}

