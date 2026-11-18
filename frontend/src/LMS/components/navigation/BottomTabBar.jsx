import { NavLink } from 'react-router-dom';

export default function BottomTabBar({ tabs, onMoreClick, moreActive }) {
  return (
    <nav
      aria-label="Primary mobile navigation"
      className="sticky bottom-0 z-30 border-t border-slate-100 bg-white/95 px-3 py-2 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
    >
      <div className="grid grid-cols-5 items-center gap-1.5">
        {tabs.map((tab) => {
          if (tab.isMoreButton) {
            const Icon = tab.icon;
            return (
              <button
                key="more"
                type="button"
                onClick={onMoreClick}
                className={`flex flex-col items-center justify-center rounded-2xl py-2 px-1 text-[11px] font-semibold transition ${
                  moreActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-0.5 truncate">{tab.label}</span>
              </button>
            );
          }

          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center rounded-2xl py-2 px-1 text-[11px] font-semibold transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="mt-0.5 truncate">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

