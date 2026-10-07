"use client";

import Link from "next/link";
import { CatalogClient } from "@/components/catalog-client";
import { Shell } from "@/components/shell";
import { useLanguage } from "@/lib/language";

export default function Home() {
  const { text } = useLanguage();
  return (
    <Shell>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              {text(
                "READ • LISTEN • UNDERSTAND",
                "ЧИТАЙТЕ • СЛУШАЙТЕ • ПОНИМАЙТЕ",
              )}
            </p>
            <h1>
              {text("English books,", "Книги на английском,")}
              <br />
              <em>{text("made friendly.", "которые легко читать.")}</em>
            </h1>
            <p className="hero-lead">
              {text(
                "Read original stories line by line, with translation and audio always beside you.",
                "Читайте оригинальные истории строка за строкой — перевод и аудио всегда рядом.",
              )}
            </p>
            <div className="hero-buttons">
              <Link href="/catalog" className="button primary">
                {text("Explore books", "Смотреть книги")} <span>→</span>
              </Link>
              <Link href="/auth" className="button ghost">
                {text("Create free account", "Создать бесплатный аккаунт")}
              </Link>
            </div>
            <div className="proof">
              <span className="proof-icon">✓</span>
              <span>
                {text("Learn at your own pace", "Учитесь в своём темпе")}
              </span>
              <span className="proof-icon">✓</span>
              <span>
                {text(
                  "Classic stories, modern tools",
                  "Классика и современные инструменты",
                )}
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="sun"></div>
            <div className="book-stack">
              <div className="tiny-book b1">
                THE
                <br />
                STORY
              </div>
              <div className="tiny-book b2">
                READ
                <br />
                MORE
              </div>
              <div className="tiny-book b3">
                Jane
                <br />
                Austen
              </div>
            </div>
            <div className="reader-window">
              <div className="reader-header">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>
                “I have been a selfish being all my life, in practice, though
                not in principle.”
              </p>
              <div className="reader-line"></div>
              <div className="reader-line short"></div>
              <button>▶ {text("Listen", "Слушать")}</button>
            </div>
          </div>
        </section>
        <section className="home-library">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {text("FIND YOUR NEXT STORY", "НАЙДИТЕ СЛЕДУЮЩУЮ ИСТОРИЮ")}
              </p>
              <h2>
                {text("Books for every mood", "Книги для любого настроения")}
              </h2>
            </div>
            <Link href="/catalog">{text("See all books", "Все книги")} →</Link>
          </div>
          <CatalogClient featured />
        </section>
        <section className="how">
          <div>
            <span>01</span>
            <h3>{text("Pick a book", "Выберите книгу")}</h3>
            <p>
              {text(
                "Choose a story at your reading level.",
                "Выберите историю своего уровня.",
              )}
            </p>
          </div>
          <div>
            <span>02</span>
            <h3>{text("Read with confidence", "Читайте уверенно")}</h3>
            <p>
              {text(
                "See a clear translation whenever you need it.",
                "Открывайте понятный перевод, когда он нужен.",
              )}
            </p>
          </div>
          <div>
            <span>03</span>
            <h3>{text("Listen and repeat", "Слушайте и повторяйте")}</h3>
            <p>
              {text(
                "Train your ear with natural audio.",
                "Тренируйте слух с естественным аудио.",
              )}
            </p>
          </div>
        </section>
      </main>
    </Shell>
  );
}
