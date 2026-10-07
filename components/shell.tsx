"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearAuth,
  getCurrentUser,
  listUserSubscriptions,
  restoreAuthToken,
  type User,
} from "@/lib/api";
import { resolveAccountPlan, type AccountPlan } from "@/lib/account";
import { useLanguage } from "@/lib/language";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BrandLogo } from "@/components/brand-logo";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<AccountPlan>("free");
  const { text } = useLanguage();
  const copy = { library: text("Library", "Библиотека"), books: text("My books", "Мои книги"), login: text("Log in", "Войти"), signup: text("Sign up", "Регистрация"), signout: text("Sign out", "Выйти"), free: text("Free", "Бесплатно"), profile: text("Open profile", "Открыть профиль"), language: text("Language", "Язык") };
  const nav = [[copy.library, "/catalog"], [copy.books, "/profile"]];
  useEffect(() => {
    if (!restoreAuthToken()) return;
    Promise.all([getCurrentUser(), listUserSubscriptions().catch(() => [])])
      .then(([current, subscriptions]) => {
        localStorage.setItem("kitapchy_user", JSON.stringify(current));
        setUser(current);
        setPlan(resolveAccountPlan(current, subscriptions));
      })
      .catch(() => clearAuth());
  }, []);
  useEffect(() => {
    const refreshMembership = () => { if (user) listUserSubscriptions().then((subscriptions) => setPlan(resolveAccountPlan(user, subscriptions))).catch(() => undefined); };
    window.addEventListener("kitapchy-membership-change", refreshMembership);
    return () => window.removeEventListener("kitapchy-membership-change", refreshMembership);
  }, [user]);
  const initial = (user?.username || user?.email || "A")
    .trim()
    .charAt(0)
    .toUpperCase();
  return (
    <div className="app-shell">
      <header className="topbar">
        <BrandLogo />
        <nav>
          {nav.map(([label, href]) => (
            <Link
              key={href}
              className={pathname === href ? "active" : ""}
              href={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="top-actions">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link className={`shell-plan ${plan}`} href="/profile#plans">{plan === "pro" ? "✦ Pro" : copy.free}</Link>
              <Link
                className="profile-dot"
                href="/profile"
                aria-label={copy.profile}
              >
                {initial}
              </Link>
              <button
                className="sign-out"
                type="button"
                onClick={() => {
                  clearAuth();
                  setUser(null);
                  router.push("/");
                }}
              >
                {copy.signout}
              </button>
            </>
          ) : (
            <>
              <Link className="login-link" href="/auth?mode=signin">
                {copy.login}
              </Link>
              <Link className="signup-link" href="/auth?mode=signup">
                {copy.signup}
              </Link>
            </>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
