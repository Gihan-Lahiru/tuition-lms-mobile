import { Bell, LogOut, Smartphone, Monitor, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLMSAuth } from '../../context/LMSAuthContext';
import InstallLMSButton from '../../pwa/InstallLMSButton';
import LMSLogo from '../branding/LMSLogo';

export default function MobileTopBar({
  title = 'MW Tuition LMS',
  subtitle = 'Learning Management System',
  unreadCount = 0,
  notificationsPath = '/lms/notifications',
  phoneFrame,
  onTogglePhoneFrame,
}) {
  const { user, logout } = useLMSAuth();

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 px-4 pb-3 pt-3 text-white shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <LMSLogo size="sm" variant="glass" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold leading-tight">{title}</h1>
              <p className="truncate text-[11px] text-blue-100">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <InstallLMSButton compact />
          {onTogglePhoneFrame && (
            <button
              type="button"
              onClick={onTogglePhoneFrame}
              className="hidden md:inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/25"
              title={phoneFrame ? 'Expand to Responsive View' : 'Mobile App Frame (412px)'}
            >
              {phoneFrame ? (
                <Monitor className="h-3.5 w-3.5" />
              ) : (
                <Smartphone className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {user && (
            <>
              <Link
                to={notificationsPath}
                className="relative rounded-full bg-white/15 p-2 hover:bg-white/25 active:scale-95 transition"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </Link>
              <Link
                to="/lms/security"
                className="rounded-full bg-white/15 p-2 hover:bg-white/25 active:scale-95 transition"
                aria-label="Account Profile"
                title="Account Profile"
              >
                <User className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full bg-white/15 p-2 hover:bg-white/25 active:scale-95 transition"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

