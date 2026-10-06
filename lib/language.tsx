"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

export type AppLanguage = "en" | "ru";
type LanguageContextValue = { language: AppLanguage; setLanguage: (language: AppLanguage) => void; text: (english: string, russian: string) => string };

const LanguageContext = createContext<LanguageContextValue | null>(null);

const viewTranslations: Record<string, string> = {
  "Loading your reading space…": "Загружаем ваше пространство для чтения…", "Make every book yours.": "Сделайте каждую книгу своей.", "Sign in to choose a plan, keep reading progress, and build your bookshelf.": "Войдите, чтобы выбрать план, сохранять прогресс и собирать свою библиотеку.", "Create free account": "Создать бесплатный аккаунт",
  "Every story, translation, and audio track is open.": "Все истории, переводы и аудиодорожки открыты.", "Enjoy your first book part, then upgrade whenever you’re ready.": "Читайте первую часть книги бесплатно и подключите Pro, когда будете готовы.",
  "YOUR READING SPACE": "ВАШЕ ПРОСТРАНСТВО ДЛЯ ЧТЕНИЯ", "Account settings →": "Настройки аккаунта →", "books saved": "сохранено книг", "text parts per book": "частей текста на книгу", "payment methods": "способов оплаты",
  "MEMBERSHIP": "ПОДПИСКА", "Choose how you read": "Выберите формат чтения", "Frontend preview · API ready": "Предпросмотр фронтенда · готово к API", "FREE": "БЕСПЛАТНО", "Start every story": "Начните любую историю", "Explore the library and try the reading experience before upgrading.": "Изучайте библиотеку и попробуйте чтение перед оформлением подписки.", "First text JSON part": "Первая часть текста JSON", "Audio until that part ends": "Аудио до конца этой части", "Word translations": "Перевод слов", "No saved books": "Без сохранения книг", "Current plan": "Текущий план", "Switch to Free": "Перейти на бесплатный", "Promo is active": "Промокод активен",
  "FULL EXPERIENCE": "ПОЛНЫЙ ДОСТУП", "Keep every story going": "Продолжайте каждую историю", "Read without chapter limits and keep a personal shelf.": "Читайте без ограничений и собирайте личную библиотеку.", "All text JSON parts": "Все части текста JSON", "Full-book audio": "Полное аудио книги", "Translations and saved progress": "Переводы и сохранённый прогресс", "Save books to your profile": "Сохраняйте книги в профиле", "Pro is active": "Pro активен", "Preview Pro": "Попробовать Pro",
  "HAVE A PROMO CODE?": "ЕСТЬ ПРОМОКОД?", "Open a little more time to read.": "Откройте больше времени для чтения.", "Redeem a code for temporary Pro access—from a few days to a full year.": "Активируйте временный доступ Pro — от нескольких дней до целого года.", "ACTIVE": "АКТИВЕН", "Promo code": "Промокод", "Redeem": "Активировать", "Frontend test codes": "Тестовые коды фронтенда",
  "BILLING": "ОПЛАТА", "Payment methods": "Способы оплаты", "Store only your payment provider’s card ID and display details here. Full card numbers and security codes never belong in the frontend.": "Здесь хранятся только ID карты платёжного провайдера и данные для отображения. Полные номера карт и коды безопасности не сохраняются во фронтенде.", "No payment methods added yet.": "Способы оплаты ещё не добавлены.", "Add payment reference": "Добавить платёжные данные", "Payment card ID": "ID платёжной карты", "Brand": "Платёжная система", "Last 4 digits": "Последние 4 цифры", "Add card reference": "Добавить карту", "Remove": "Удалить",
  "SAVED FOR LATER": "СОХРАНЕНО НА ПОТОМ", "Your bookshelf": "Ваша книжная полка", "Browse library →": "Открыть библиотеку →", "Bookshelf is a Pro feature": "Книжная полка доступна в Pro", "Upgrade to save books here and return to them anytime.": "Подключите Pro, чтобы сохранять книги и возвращаться к ним в любое время.", "See Pro plan": "Посмотреть Pro", "Your bookshelf is empty. Save a book to find it here.": "Ваша полка пуста. Сохраните книгу, и она появится здесь.",
  "ACCOUNT SETTINGS": "НАСТРОЙКИ АККАУНТА", "Your profile": "Ваш профиль", "Display name": "Имя", "Email": "Эл. почта", "Save changes": "Сохранить", "Saving…": "Сохранение…",
  "Profile saved.": "Профиль сохранён.", "Your display name needs at least 2 characters.": "Имя должно содержать не менее 2 символов.", "We couldn’t save that change. Please try again.": "Не удалось сохранить изменения. Попробуйте снова.", "Payment method removed.": "Способ оплаты удалён.", "Payment method saved in this browser.": "Способ оплаты сохранён в этом браузере.", "That payment card ID is already saved.": "Этот ID карты уже сохранён.", "Add a payment card ID and exactly four ending digits.": "Укажите ID карты и ровно четыре последние цифры.",
  "Library": "Библиотека", "Ready when you are": "Можно начинать", "Your place is saved": "Ваше место сохранено", "Begin reading": "Начать чтение", "Continue reading": "Продолжить чтение", "See plans →": "Посмотреть планы →", "Full text, translation and audio included": "Полный текст, перевод и аудио включены", "First text part and matching audio included": "Первая часть текста и соответствующее аудио включены", "Reading level": "Уровень чтения", "Listen & read": "Слушайте и читайте", "At your own pace": "В своём темпе", "In this book": "В этой книге", "passages": "отрывков", "Short, focused lessons": "Короткие уроки", "First published": "Первая публикация", "A lasting favorite": "Книга вне времени", "THE READING EXPERIENCE": "ПРОЦЕСС ЧТЕНИЯ", "A story made": "История стала", "approachable.": "понятнее.", "Read with confidence": "Читайте уверенно", "Original text and a clear translation sit side by side.": "Оригинал и понятный перевод расположены рядом.", "Listen as you go": "Слушайте во время чтения", "Hear the story aloud and follow every sentence.": "Слушайте историю и следите за каждым предложением.", "Make it your own": "Сделайте чтение своим", "Save words and return to the parts that moved you.": "Сохраняйте слова и возвращайтесь к важным местам.",
  "A guided reading experience by": "Чтение с поддержкой от", "A remarkable story to read slowly, listen to carefully, and make your own.": "Замечательная история, которую хочется читать не спеша, внимательно слушать и проживать по-своему.", "Move through the text sentence by sentence, with helpful tools there when you want them — and quietly out of the way when you do not.": "Читайте предложение за предложением: полезные инструменты рядом, когда нужны, и не мешают в остальное время.", "This book is unavailable.": "Эта книга недоступна.", "Loading book…": "Загрузка книги…", "Saving books is a Pro feature. Upgrade from your profile.": "Сохранение книг доступно в Pro. Подключите его в профиле.", "Saved to your bookshelf.": "Книга сохранена на вашей полке.", "Sign in to save books.": "Войдите, чтобы сохранять книги.", "We could not save this book. Please try again.": "Не удалось сохранить книгу. Попробуйте снова.",
  "FREE PREVIEW COMPLETE": "БЕСПЛАТНЫЙ ФРАГМЕНТ ЗАВЕРШЁН", "Keep the story going.": "Продолжите историю.", "You reached the end of the free chapter. Upgrade to Pro for every text part, full audio, translations, and saved books.": "Вы дошли до конца бесплатной главы. Pro откроет весь текст, полное аудио, переводы и сохранение книг.", "Not now": "Не сейчас", "Free preview": "Бесплатный фрагмент", "Now reading": "Сейчас читается", "Preparing your reading room": "Готовим пространство для чтения", "Your book": "Ваша книга", "Opening the first passages and getting the audio ready.": "Открываем первые отрывки и готовим аудио.", "English reader": "Чтение на английском", "saved words": "сохранённых слов", "Translate words to": "Переводить слова на", "Russian": "Русский", "Turkish": "Турецкий", "Original text": "Оригинальный текст", "translation": "перевод", "Translation unavailable": "Перевод недоступен", "Loading previous passages…": "Загружаем предыдущие отрывки…", "Loading more…": "Загружаем ещё…", "Hide translation": "Скрыть перевод", "Show translation": "Показать перевод", "Switching to": "Переход к", "Save": "Сохранить", "Saved": "Сохранено", "Audio could not be loaded. Please try again.": "Не удалось загрузить аудио. Попробуйте снова.", "Unable to load the book text.": "Не удалось загрузить текст книги.", "Unable to load book details.": "Не удалось загрузить данные книги.", "Unable to load the book.": "Не удалось загрузить книгу.", "Unable to load that part of the book.": "Не удалось загрузить эту часть книги.", "Unable to translate this word.": "Не удалось перевести это слово.", "This book does not have readable text files yet.": "Для этой книги пока нет доступного текста."
};

function translateViewText(value: string) {
  const fixed = viewTranslations[value] || ({ "Pro · full book": "Pro · полная книга", "by": "автор:" } as Record<string, string>)[value];
  if (fixed) return fixed;
  const passage = value.match(/^Passage (\d+)$/); if (passage) return `Отрывок ${passage[1]}`;
  const saved = value.match(/^(\d+) saved$/); if (saved) return `${saved[1]} сохранено`;
  const savedWords = value.match(/^(\d+) saved words$/); if (savedWords) return `${savedWords[1]} сохранённых слов`;
  return undefined;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const originalText = useRef(new WeakMap<Text, string>());
  useEffect(() => {
    const stored = localStorage.getItem("kitapchy_language");
    const next = stored === "ru" ? "ru" : "en";
    setLanguageState(next); document.documentElement.lang = next;
  }, []);
  const setLanguage = (next: AppLanguage) => { setLanguageState(next); localStorage.setItem("kitapchy_language", next); document.documentElement.lang = next; };
  const value = useMemo(() => ({ language, setLanguage, text: (english: string, russian: string) => language === "ru" ? russian : english }), [language]);
  useEffect(() => {
    const translateNode = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null = root.nodeType === Node.TEXT_NODE ? root : walker.nextNode();
      while (node) {
        const textNode = node as Text; const stored = originalText.current.get(textNode); const currentEnglish = translateViewText(textNode.data.trim()) ? textNode.data : null; const raw = currentEnglish && currentEnglish !== stored ? currentEnglish : stored || textNode.data; const normalized = raw.trim(); const translated = translateViewText(normalized);
        if (translated) { originalText.current.set(textNode, raw); const leading = raw.match(/^\s*/)?.[0] || ""; const trailing = raw.match(/\s*$/)?.[0] || ""; const next = language === "ru" ? `${leading}${translated}${trailing}` : raw; if (textNode.data !== next) textNode.data = next; }
        node = walker.nextNode();
      }
    };
    translateNode(document.body);
    const observer = new MutationObserver((mutations) => mutations.forEach((mutation) => { mutation.addedNodes.forEach(translateNode); if (mutation.type === "characterData") translateNode(mutation.target); }));
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  const standaloneView = pathname.startsWith("/auth") || pathname.endsWith("/read");
  return <LanguageContext.Provider value={value}>{standaloneView && <select className="language standalone-language" aria-label={value.text("Language", "Язык")} value={language} onChange={(event) => setLanguage(event.target.value as AppLanguage)}><option value="en">EN</option><option value="ru">RU</option></select>}{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
