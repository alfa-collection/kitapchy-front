import { LanguageDropdown } from "@/lib/language";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  return <LanguageDropdown className={className} />;
}
