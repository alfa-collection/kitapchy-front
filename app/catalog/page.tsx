"use client";

import { CatalogClient } from "@/components/catalog-client";
import { Shell } from "@/components/shell";
import { useLanguage } from "@/lib/language";

export default function CatalogPage() { const { text } = useLanguage(); return <Shell><main className="catalog-page"><p className="eyebrow">{text("THE LIBRARY", "БИБЛИОТЕКА")}</p><h1>{text("Find a story you’ll love.", "Найдите историю, которая вам понравится.")}</h1><p className="page-intro">{text("Every book pairs the original English text with an easy translation, natural audio and progress tracking.", "В каждой книге оригинальный английский текст дополнен понятным переводом, естественным аудио и сохранением прогресса.")}</p><CatalogClient /></main></Shell>; }
