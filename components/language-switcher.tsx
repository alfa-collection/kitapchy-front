"use client";

import { useLanguage } from "@/lib/language";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage, text } = useLanguage();
  return <select className={`language ${className}`} aria-label={text("Language", "Язык")} value={language} onChange={(event) => setLanguage(event.target.value as "en" | "ru")}><option value="en">EN</option><option value="ru">RU</option></select>;
}
