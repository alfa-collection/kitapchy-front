"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const nav = [["Library", "/catalog"], ["My books", "/profile"]];
  return <div className="app-shell"><header className="topbar"><Link href="/" className="brand"><span>k</span>kitapchy</Link><nav>{nav.map(([label, href]) => <Link key={href} className={pathname === href ? "active" : ""} href={href}>{label}</Link>)}</nav><div className="top-actions"><button className="language">EN <i>⌄</i></button><Link className="profile-dot" href="/profile">A</Link></div></header>{children}</div>;
}
