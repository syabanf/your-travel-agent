import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

/**
 * Package prices are member content (Icon Membership 3.6). A guest sees an
 * invitation to sign in where the price would be; a member sees `children`.
 * Inside a card that is already a link, pass `inLink` so the invitation is
 * plain text: the card opens the package, whose page carries the sign-in link.
 */
export default function MemberPrice({ children, compact = false, inLink = false }) {
  const { isGuest } = useAuth();
  if (!isGuest) return children;
  const Tag = inLink ? "span" : Link;
  return (
    <Tag
      {...(inLink ? {} : { to: "/login" })}
      className={`inline-flex items-center gap-1.5 rounded-full bg-accent-soft font-semibold text-accent-strong transition-colors hover:bg-accent/15 ${
        compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1.5 text-xs"
      }`}
    >
      <Lock className={compact ? "size-3" : "size-3.5"} aria-hidden="true" />
      Sign in to see price
    </Tag>
  );
}
