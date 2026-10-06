"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { authenticate, persistAuth, restoreAuthToken } from "@/lib/api";
import { useLanguage } from "@/lib/language";

export default function AuthPage() {
  const router = useRouter(); const { text } = useLanguage();
  const [mode, setMode] = useState<"signin" | "signup">("signup"); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setMode(new URLSearchParams(window.location.search).get("mode") === "signin" ? "signin" : "signup"), 0); if (restoreAuthToken()) router.replace("/profile"); return () => window.clearTimeout(timer); }, [router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const email = String(form.get("email")).trim(); const password = String(form.get("password"));
    if (password.length < 8) { setError(text("Use a password with at least 8 characters.", "Используйте пароль не короче 8 символов.")); return; }
    setLoading(true); setError(""); let data;
    try { data = await authenticate(mode, email, password); }
    catch (reason) { const detail = typeof reason === "object" && reason && "response" in reason ? (reason as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message : undefined; setError(detail || text("We couldn’t sign you in. Check your details and try again.", "Не удалось войти. Проверьте данные и попробуйте снова.")); setLoading(false); return; }
    if (!data?.jwt || !data.user) { setError(text("Sign-in succeeded, but no usable session was returned. Please contact support.", "Вход выполнен, но сессия не получена. Обратитесь в поддержку.")); setLoading(false); return; }
    persistAuth(data); setMessage(mode === "signup" ? text("Your account is ready. Opening your reading space…", "Аккаунт готов. Открываем ваше пространство для чтения…") : text("Welcome back. Opening your reading space…", "С возвращением. Открываем ваше пространство для чтения…")); window.setTimeout(() => router.push("/profile"), 500); setLoading(false);
  }
  const switchMode = () => { const next = mode === "signup" ? "signin" : "signup"; setMode(next); setMessage(""); setError(""); router.replace(`/auth?mode=${next}`); };
  return <main className="auth-page"><Link href="/" className="brand"><span>k</span>kitapchy</Link><section className="auth-card"><div className="auth-art"><p>{text("One page at a time.", "Страница за страницей.")}</p><span>✦</span></div><div className="auth-form"><p className="eyebrow">{mode === "signup" ? text("CREATE YOUR ACCOUNT", "СОЗДАЙТЕ АККАУНТ") : text("WELCOME BACK", "С ВОЗВРАЩЕНИЕМ")}</p><h1>{mode === "signup" ? text("Start your reading habit.", "Начните читать регулярно.") : text("Welcome back.", "С возвращением.")}</h1><p>{mode === "signup" ? text("Create an account to save your books and learning progress.", "Создайте аккаунт, чтобы сохранять книги и прогресс.") : text("Sign in to pick up where you left off.", "Войдите, чтобы продолжить с места остановки.")}</p><form onSubmit={submit}><label>{text("Email", "Эл. почта")}<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label><label>{text("Password", "Пароль")}<input name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required placeholder={text("At least 8 characters", "Не менее 8 символов")} /></label>{mode === "signup" && <label className="check"><input type="checkbox" required /> {text("I agree to the terms of use", "Я принимаю условия использования")}</label>}{error && <p className="auth-message error" role="alert">{error}</p>}{message && <p className="auth-message success" role="status">{message}</p>}<button className="button primary" type="submit" disabled={loading}>{loading ? text("Connecting…", "Подключение…") : mode === "signup" ? text("Create account", "Создать аккаунт") : text("Sign in", "Войти")} <span>→</span></button></form><div className="switch-auth">{mode === "signup" ? text("Already have an account?", "Уже есть аккаунт?") : text("New to Kitapchy?", "Впервые в Kitapchy?")} <button type="button" onClick={switchMode}>{mode === "signup" ? text("Sign in", "Войти") : text("Create one", "Создать")}</button></div></div></section></main>;
}
