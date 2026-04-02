import { ChevronLeft, Bell } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function PageHeader({ title, subtitle, showBack = false, showNotification = false, rightAction }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-6 pt-14 pb-4">
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 glass-light rounded-xl flex items-center justify-center text-mora-white/80 hover:text-mora-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-display font-semibold text-mora-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-mora-neutral/70 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rightAction}
        {showNotification && (
          <Link 
            to="/notifications"
            className="w-10 h-10 glass-light rounded-xl flex items-center justify-center text-mora-neutral/70 hover:text-gold transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-mora-gold rounded-full" />
          </Link>
        )}
      </div>
    </div>
  );
}