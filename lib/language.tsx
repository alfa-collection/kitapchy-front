"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { UiIcon } from "@/components/ui-icon";
import { enTranslations } from "@/lib/languages/en/translations";
import { ruTranslations } from "@/lib/languages/ru/translations";
import { tkTranslations } from "@/lib/languages/tk/translations";

export type AppLanguage = "en" | "ru" | "tk";
type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  text: (english: string, russian: string, turkmen?: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const languageTranslations: Record<AppLanguage, Record<string, string>> = {
  en: enTranslations,
  ru: ruTranslations,
  tk: tkTranslations,
};

function translateViewText(value: string, language: AppLanguage) {
  if (language === "en") return undefined;
  const fixed = languageTranslations[language][value];
  if (fixed) return fixed;
  const passage = value.match(/^Passage (\d+)$/);
  if (passage)
    return language === "tk" ? `Bölek ${passage[1]}` : `Отрывок ${passage[1]}`;
  const saved = value.match(/^(\d+) saved$/);
  if (saved)
    return language === "tk" ? `${saved[1]} saklandy` : `${saved[1]} сохранено`;
  const savedWords = value.match(/^(\d+) saved words$/);
  if (savedWords)
    return language === "tk"
      ? `${savedWords[1]} söz saklandy`
      : `${savedWords[1]} сохранённых слов`;
  return undefined;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const originalText = useRef(new WeakMap<Text, string>());
  useEffect(() => {
    const stored = localStorage.getItem("kitapchy_language");
    const next = stored === "ru" || stored === "tk" ? stored : "en";
    setLanguageState(next);
    document.documentElement.lang = next;
  }, []);
  const setLanguage = (next: AppLanguage) => {
    setLanguageState(next);
    localStorage.setItem("kitapchy_language", next);
    document.documentElement.lang = next;
  };
  const value = useMemo(
    () => ({
      language,
      setLanguage,
      text: (english: string, russian: string, turkmen?: string) =>
        language === "ru"
          ? russian
          : language === "tk"
            ? turkmen || tkTranslations[english] || english
            : english,
    }),
    [language],
  );
  useEffect(() => {
    const translateNode = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null =
        root.nodeType === Node.TEXT_NODE ? root : walker.nextNode();
      while (node) {
        const textNode = node as Text;
        const stored = originalText.current.get(textNode);
        if (language === "en") {
          if (stored && textNode.data !== stored) textNode.data = stored;
          node = walker.nextNode();
          continue;
        }
        const hasTranslation = translateViewText(
          textNode.data.trim(),
          language,
        );
        const currentEnglish = hasTranslation ? textNode.data : null;
        const raw =
          currentEnglish && currentEnglish !== stored
            ? currentEnglish
            : stored || textNode.data;
        const normalized = raw.trim();
        const translated = translateViewText(normalized, language);
        if (translated) {
          originalText.current.set(textNode, raw);
          const leading = raw.match(/^\s*/)?.[0] || "";
          const trailing = raw.match(/\s*$/)?.[0] || "";
          const next = `${leading}${translated}${trailing}`;
          if (textNode.data !== next) textNode.data = next;
        }
        node = walker.nextNode();
      }
    };
    translateNode(document.body);
    const observer = new MutationObserver((mutations) =>
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(translateNode);
        if (mutation.type === "characterData") translateNode(mutation.target);
      }),
    );
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [language]);
  const standaloneView =
    pathname.startsWith("/auth") || pathname.endsWith("/read");
  return (
    <LanguageContext.Provider value={value}>
      {standaloneView && <LanguageDropdown standalone />}
      {children}
    </LanguageContext.Provider>
  );
}

const languageOptions: Array<{
  code: AppLanguage;
  short: string;
  name: string;
}> = [
  { code: "en", short: "EN", name: "English" },
  { code: "ru", short: "RU", name: "Русский" },
  { code: "tk", short: "TM", name: "Türkmençe" },
];

export function LanguageDropdown({
  standalone = false,
  className = "",
}: {
  standalone?: boolean;
  className?: string;
}) {
  const { language, setLanguage, text } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected =
    languageOptions.find((option) => option.code === language) ||
    languageOptions[0];
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <div
      ref={rootRef}
      className={`language-dropdown ${standalone ? "standalone-language" : ""} ${className}`}
    >
      <button
        className="language-trigger"
        type="button"
        aria-label={text("Language", "Язык", "Dil")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="language-code">{selected.short}</span>
        <span className="language-current">{selected.name}</span>
        <UiIcon className="language-chevron" name="chevron-down" size={15} />
      </button>
      {open && (
        <div
          className="language-menu"
          role="listbox"
          aria-label={text("Language", "Язык", "Dil")}
        >
          {languageOptions.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={language === option.code}
              className={language === option.code ? "active" : ""}
              key={option.code}
              onClick={() => {
                setLanguage(option.code);
                setOpen(false);
              }}
            >
              <span>{option.short}</span>
              <strong>{option.name}</strong>
              {language === option.code && <UiIcon name="check" size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
