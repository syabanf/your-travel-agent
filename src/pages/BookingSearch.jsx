import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";

export default function BookingSearch() {
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get("type") || "all";
  const label = type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ");

  return (
    <div className="animate-fade-in">
      <PageHeader title={`Search ${label}s`} subtitle="Find the best deals" showBack />
      <div className="px-6 mb-6">
        <GlassCard className="p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-mora-neutral/40" />
          <input
            placeholder={`Search ${label.toLowerCase()}s...`}
            className="flex-1 bg-transparent text-sm text-mora-white placeholder:text-mora-neutral/40 outline-none"
          />
        </GlassCard>
      </div>
      <div className="px-6 flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-mora-white/70 text-sm font-display">Search coming soon</p>
        <p className="text-mora-neutral/40 text-xs text-center">Real-time {label.toLowerCase()} search will be available soon</p>
      </div>
    </div>
  );
}