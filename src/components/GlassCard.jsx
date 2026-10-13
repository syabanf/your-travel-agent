import { cn } from "@/lib/utils";

export default function GlassCard({ children, className, variant = "default", onClick }) {
  const variants = {
    default: "bg-card shadow-card",
    light: "bg-card shadow-card",
    gold: "bg-accent-soft",
    nav: "bg-card shadow-up",
  };

  return (
    <div 
      className={cn(
        variants[variant],
        "rounded-2xl",
        onClick && "cursor-pointer hover:bg-surface transition-all duration-300",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}