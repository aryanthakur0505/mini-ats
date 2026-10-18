"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, KanbanSquare, LayoutDashboard, Users } from "lucide-react";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-slate-200 bg-white md:w-56 md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 px-4 py-4 md:px-5 md:py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Briefcase size={16} />
        </div>
        <span className="text-lg font-semibold tracking-tight">Mini ATS</span>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
