"use client";

import { UiIcon } from "@/components/ui-icon";
import type { AccountPlan } from "@/lib/account";
import { useLanguage } from "@/lib/language";

export function ProfileSummary({
  name,
  plan,
  membershipDetail,
  bookmarksCount,
  savedWordsCount,
  onOpenSettings,
}: {
  name: string;
  plan: AccountPlan;
  membershipDetail: string;
  bookmarksCount: number;
  savedWordsCount: number;
  onOpenSettings: () => void;
}) {
  const { text } = useLanguage();
  const isPro = plan === "pro";

  return (
    <>
      <section className="profile-hero profile-hero-upgraded">
        <div className="avatar">{name.charAt(0).toUpperCase()}</div>
        <div className="profile-identity">
          <div className="profile-title-row">
            <p className="eyebrow">YOUR READING SPACE</p>
            <span className={`plan-pill ${plan}`}>
              {isPro && <UiIcon name="sparkle" size={12} />} {isPro ? "Pro" : text("Free", "Бесплатно")}
            </span>
          </div>
          <h1>{text("Welcome back", "С возвращением")}, {name}.</h1>
          <p>{isPro ? "Every story, translation, and audio track is open." : "Enjoy your first book part, then upgrade whenever you’re ready."}</p>
        </div>
        <button type="button" className="text-link account-trigger" onClick={onOpenSettings}>
          Account settings <UiIcon name="arrow-right" size={14} />
        </button>
      </section>
      <section className="stats">
        <div><strong>{bookmarksCount}</strong><span>{text("saved books", "сохранённых книг")}</span></div>
        <div><strong>{savedWordsCount}</strong><span>{text("saved words", "сохранённых слов")}</span></div>
        <div><strong>{isPro ? "Pro" : text("Free", "Бесплатно")}</strong><span>{membershipDetail}</span></div>
      </section>
    </>
  );
}
