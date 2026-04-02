import { cn } from "@/lib/utils";

export default function GlassCard({ children, className, variant = "default", onClick }) {
  const variants = {
    default: "glass-card",
    light: "glass-light",
    gold: "glass-gold",
    nav: "glass-nav",
  };

  return (
    <div 
      className={cn(
        variants[variant],
        "rounded-2xl",
        onClick && "cursor-pointer hover:bg-white/10 transition-all duration-300",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}