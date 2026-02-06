import NotificationDot from "@/components/NotificationDot";
import { IconCart, IconChat, IconHome, IconUser } from "@/components/Icons";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white md:hidden dark:border-slate-800 dark:bg-slate-950">
      <div className="page-container flex items-center justify-between py-2 text-xs text-slate-500 dark:text-slate-300">
        <button className="flex flex-col items-center gap-1 text-brand">
          <IconHome className="h-5 w-5" />
          Home
        </button>
        <button className="flex flex-col items-center gap-1">
          <IconChat className="h-5 w-5" />
          Chat
        </button>
        <button className="relative flex flex-col items-center gap-1">
          <IconCart className="h-5 w-5" />
          Cart
          <NotificationDot />
        </button>
        <button className="flex flex-col items-center gap-1">
          <IconUser className="h-5 w-5" />
          Profile
        </button>
      </div>
    </nav>
  );
}
