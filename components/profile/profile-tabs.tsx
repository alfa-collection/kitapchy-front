"use client";

import { useLanguage } from "@/lib/language";

export type ProfileTab = "overview" | "membership" | "billing" | "bookshelf";

export function ProfileTabs({
  active,
  bookmarksCount,
  onSelect,
}: {
  active: ProfileTab;
  bookmarksCount: number;
  onSelect: (tab: ProfileTab) => void;
}) {
  const { text } = useLanguage();
  const tabs: Array<[ProfileTab, string]> = [
    ["overview", text("Overview", "Обзор", "Umumy")],
    ["membership", text("Membership", "Подписка", "Agzalyk")],
    ["billing", text("Billing", "Оплата", "Töleg")],
    ["bookshelf", text("Bookshelf", "Книжная полка", "Kitap tekjesi")],
  ];

  return (
    <nav className="profile-tabs" aria-label={text("Profile sections", "Разделы профиля", "Profil bölümleri")}>
      {tabs.map(([tab, label]) => (
        <button type="button" className={active === tab ? "active" : ""} aria-current={active === tab ? "page" : undefined} onClick={() => onSelect(tab)} key={tab}>
          {label}
          {tab === "bookshelf" && <span>{bookmarksCount}</span>}
        </button>
      ))}
    </nav>
  );
}
