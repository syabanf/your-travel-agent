import { ChevronLeft, Bell } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function PageHeader({ title, subtitle, showBack = false, showNotification = false, rightAction }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-6 pt-4 pb-4">
      <div className="flex items-center gap-3 min-w-0">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-10 h-10 glass-light shadow-soft rounded-full flex items-center justify-center text-mora-primary hover:text-gold press-spring shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-[22px] leading-tight tracking-tight font-display font-bold text-mora-primary truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-mora-neutral mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {rightAction}
        {showNotification && (
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="w-10 h-10 glass-light shadow-soft rounded-full flex items-center justify-center text-mora-neutral hover:text-gold press-spring relative"
          >
            <Bell className="w-5 h-5" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-mora-gold rounded-full" />
          </Link>
        )}
      </div>
    </div>
  );
}