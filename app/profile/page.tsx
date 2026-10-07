"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { BookCard } from "@/components/book-card";
import { Shell } from "@/components/shell";
import {
  activeSubscription,
  resolveAccountPlan,
  resolvePaymentMethods,
  saveFrontendPaymentMethods,
  type AccountPlan,
} from "@/lib/account";
import {
  apiErrorMessage,
  applyPromoCode,
  clearAuth,
  confirmMockSubscriptionPayment,
  getCurrentUser,
  listBookmarks,
  listDictionaryEntries,
  listSubscriptionPlans,
  listUserSubscriptions,
  purchaseSubscription,
  restoreAuthToken,
  updateUser,
  type PaymentMethod,
  type SubscriptionPlan,
  type SubscriptionPlanRecord,
  type SubscriptionPurchase,
  type User,
  type UserSubscription,
} from "@/lib/api";
import { type Book } from "@/lib/books";
import { useLanguage } from "@/lib/language";
import { PageLoading } from "@/components/loading-state";

type ProfileTab = "overview" | "membership" | "billing" | "bookshelf";

const displayName = (user: User) =>
  (user.username || user.email.split("@")[0]).trim();

export default function ProfilePage() {
  const { text } = useLanguage();
  const [bookmarks, setBookmarks] = useState<Book[]>([]);
  const [savedWordsCount, setSavedWordsCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<AccountPlan>("free");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [cardNotice, setCardNotice] = useState("");
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );
  const [availablePlans, setAvailablePlans] = useState<
    SubscriptionPlanRecord[]
  >([]);
  const [pendingPurchase, setPendingPurchase] =
    useState<SubscriptionPurchase | null>(null);
  const [purchasingPlan, setPurchasingPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [purchaseNotice, setPurchaseNotice] = useState("");
  const [promoNotice, setPromoNotice] = useState("");
  const [promoNoticeTone, setPromoNoticeTone] = useState<"success" | "error">(
    "success",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  useEffect(() => {
    const syncTabWithHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash === "plans") setActiveTab("membership");
      else if (hash === "billing") setActiveTab("billing");
      else if (hash === "bookshelf") setActiveTab("bookshelf");
      else setActiveTab("overview");
    };
    syncTabWithHash();
    window.addEventListener("hashchange", syncTabWithHash);
    return () => window.removeEventListener("hashchange", syncTabWithHash);
  }, []);

  function selectTab(tab: ProfileTab) {
    setActiveTab(tab);
    const hash = tab === "membership" ? "plans" : tab === "overview" ? "" : tab;
    window.history.replaceState(null, "", `${window.location.pathname}${hash ? `#${hash}` : ""}`);
  }

  useEffect(() => {
    if (!restoreAuthToken()) {
      setLoaded(true);
      return;
    }
    Promise.all([
      getCurrentUser(),
      listUserSubscriptions().catch(() => []),
      listSubscriptionPlans().catch(() => []),
      listDictionaryEntries().catch(() => []),
    ])
      .then(async ([current, subscriptions, plans, dictionaryEntries]) => {
        localStorage.setItem("kitapchy_user", JSON.stringify(current));
        const currentPlan = resolveAccountPlan(current, subscriptions);
        const currentSubscription = activeSubscription(subscriptions);
        setUser(current);
        setPlan(currentPlan);
        setPaymentMethods(resolvePaymentMethods(current));
        setSubscription(currentSubscription);
        setAvailablePlans(plans);
        setSavedWordsCount(dictionaryEntries.length);
        if (currentPlan === "pro")
          setBookmarks(await listBookmarks().catch(() => []));
      })
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setLoaded(true));
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const username = String(
      new FormData(event.currentTarget).get("username"),
    ).trim();
    if (username.length < 2) {
      setNotice("Your display name needs at least 2 characters.");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const updated = await updateUser(user.id, { username });
      localStorage.setItem("kitapchy_user", JSON.stringify(updated));
      setUser(updated);
      setNotice("Profile saved.");
    } catch {
      setNotice("We couldn’t save that change. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function addPaymentMethod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    const id = String(form.get("paymentId") || "").trim();
    const brand = String(form.get("brand") || "Card").trim();
    const userName = String(form.get("userName") || "").trim();
    const cvc = String(form.get("cvc") || "").trim();
    if (!id || !userName || !/^\d{3,4}$/.test(cvc)) {
      setCardNotice("Add the card ID, cardholder name, and a valid CVC.");
      return;
    }
    if (paymentMethods.some((method) => method.id === id)) {
      setCardNotice("That payment card ID is already saved.");
      return;
    }
    const next = [...paymentMethods, { id, brand, userName }];
    setPaymentMethods(next);
    saveFrontendPaymentMethods(user.id, next);
    setCardNotice("Payment method saved in this browser.");
    event.currentTarget.reset();
  }

  function removePaymentMethod(id: string) {
    if (!user) return;
    const next = paymentMethods.filter((method) => method.id !== id);
    setPaymentMethods(next);
    saveFrontendPaymentMethods(user.id, next);
    setCardNotice("Payment method removed.");
  }

  async function redeemPromo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const form = event.currentTarget;
    const code = String(new FormData(form).get("promoCode") || "").trim();
    setPromoNotice("");
    setPromoNoticeTone("success");
    try {
      const result = await applyPromoCode(code);
      if (!result.valid || !result.success) {
        setPromoNoticeTone("error");
        setPromoNotice(translatePromoError(result.message));
        return;
      }
      const activated =
        result.subscription ||
        (result.plan && result.starts_at && result.ends_at
          ? {
              plan: result.plan,
              status: "active" as const,
              starts_at: result.starts_at,
              ends_at: result.ends_at,
            }
          : null);
      if (!activated) {
        setPromoNoticeTone("error");
        setPromoNotice(
          text(
            "The subscription was not returned by the server.",
            "Сервер не вернул данные подписки.",
          ),
        );
        return;
      }
      setSubscription(activated);
      setPlan("pro");
      form.reset();
      window.dispatchEvent(new Event("kitapchy-membership-change"));
      setPromoNotice(
        text(
          `Promo activated. Enjoy Pro until ${new Date(activated.ends_at).toLocaleDateString()}.`,
          `Промокод активирован. Pro доступен до ${new Date(activated.ends_at).toLocaleDateString()}.`,
        ),
      );
      setBookmarks(await listBookmarks().catch(() => []));
    } catch (error) {
      setPromoNoticeTone("error");
      setPromoNotice(
        translatePromoError(
          apiErrorMessage(
            error,
            "Could not apply this promo code. Please try again.",
          ),
        ),
      );
    }
  }

  async function beginPurchase(selectedPlan: SubscriptionPlan) {
    setPurchasingPlan(selectedPlan);
    setPurchaseNotice("");
    try {
      const purchase = await purchaseSubscription(selectedPlan);
      setPendingPurchase(purchase);
      setPurchaseNotice(purchase.message);
    } catch {
      setPurchaseNotice(
        text(
          "Could not create the purchase. Please try again.",
          "Не удалось создать покупку. Попробуйте снова.",
        ),
      );
    } finally {
      setPurchasingPlan(null);
    }
  }

  async function confirmPayment() {
    if (!pendingPurchase) return;
    setPurchasingPlan(pendingPurchase.plan);
    setPurchaseNotice("");
    try {
      const result = await confirmMockSubscriptionPayment(
        pendingPurchase.purchase_id,
      );
      if (!result.success || !result.subscription)
        throw new Error(result.message);
      setSubscription(result.subscription);
      setPlan("pro");
      setPendingPurchase(null);
      setPurchaseNotice(result.message);
      window.dispatchEvent(new Event("kitapchy-membership-change"));
      setBookmarks(await listBookmarks().catch(() => []));
    } catch {
      setPurchaseNotice(
        text(
          "Payment could not be confirmed. Mock confirmation may be disabled on this server.",
          "Не удалось подтвердить оплату. Возможно, тестовое подтверждение отключено на сервере.",
        ),
      );
    } finally {
      setPurchasingPlan(null);
    }
  }

  if (!loaded)
    return (
      <Shell>
        <main className="profile-page">
          <PageLoading
            label={text(
              "Loading your reading space…",
              "Загружаем ваше пространство для чтения…",
            )}
          />
        </main>
      </Shell>
    );
  if (!user)
    return (
      <Shell>
        <main className="profile-page profile-guest">
          <p className="eyebrow">YOUR READING SPACE</p>
          <h1>Make every book yours.</h1>
          <p className="page-intro">
            Sign in to choose a plan, keep reading progress, and build your
            bookshelf.
          </p>
          <div className="hero-buttons">
            <Link href="/auth?mode=signin" className="button primary">
              Log in <span>→</span>
            </Link>
            <Link href="/auth?mode=signup" className="button ghost">
              Create free account
            </Link>
          </div>
        </main>
      </Shell>
    );

  const name = displayName(user);
  const initial = name.charAt(0).toUpperCase();
  const isPro = plan === "pro";
  const membershipDetail =
    isPro && subscription
      ? `${text("Active until", "Активна до")} ${new Date(subscription.ends_at).toLocaleDateString()}`
      : text("Upgrade anytime", "Можно улучшить в любое время");
  function translatePromoError(message?: string) {
    const english = message || "This promo code is not valid.";
    const russian: Record<string, string> = {
      "Promo code is required.": "Введите промокод.",
      "Promo code not found.": "Промокод не найден.",
      "This promo code is not active.": "Этот промокод неактивен.",
      "This promo code has reached its usage limit.":
        "Лимит использований этого промокода исчерпан.",
      "You have already used this promo code.":
        "Вы уже использовали этот промокод.",
      "Could not apply this promo code. Please try again.":
        "Не удалось применить промокод. Попробуйте снова.",
    };
    return text(english, russian[english] || "Не удалось применить промокод.");
  }
  const promoLabel = (value: UserSubscription["plan"]) =>
    ({
      one_month: text("1 month of Pro", "1 месяц Pro"),
      three_month: text("3 months of Pro", "3 месяца Pro"),
      six_month: text("6 months of Pro", "6 месяцев Pro"),
      one_year: text("1 year of Pro", "1 год Pro"),
    })[value];
  return (
    <Shell>
      <main className="profile-page profile-dashboard">
        <section className="profile-hero profile-hero-upgraded">
          <div className="avatar">{initial}</div>
          <div className="profile-identity">
            <div className="profile-title-row">
              <p className="eyebrow">YOUR READING SPACE</p>
              <span className={`plan-pill ${plan}`}>
                {isPro ? "✦ Pro" : text("Free", "Бесплатно")}
              </span>
            </div>
            <h1>
              {text("Welcome back", "С возвращением")}, {name}.
            </h1>
            <p>
              {isPro
                ? "Every story, translation, and audio track is open."
                : "Enjoy your first book part, then upgrade whenever you’re ready."}
            </p>
          </div>
          <button
            type="button"
            className="text-link account-trigger"
            onClick={() => setSettingsOpen(true)}
          >
            Account settings →
          </button>
        </section>
        <section className="stats">
          <div>
            <strong>{bookmarks.length}</strong>
            <span>{text("saved books", "сохранённых книг")}</span>
          </div>
          <div>
            <strong>{savedWordsCount}</strong>
            <span>{text("saved words", "сохранённых слов")}</span>
          </div>
          <div>
            <strong>{isPro ? "Pro" : text("Free", "Бесплатно")}</strong>
            <span>{membershipDetail}</span>
          </div>
        </section>

        <nav className="profile-tabs" aria-label={text("Profile sections", "Разделы профиля", "Profil bölümleri")}>
          {([
            ["overview", text("Overview", "Обзор", "Umumy")],
            ["membership", text("Membership", "Подписка", "Agzalyk")],
            ["billing", text("Billing", "Оплата", "Töleg")],
            ["bookshelf", text("Bookshelf", "Книжная полка", "Kitap tekjesi")],
          ] as Array<[ProfileTab, string]>).map(([tab, label]) => (
            <button type="button" className={activeTab === tab ? "active" : ""} aria-current={activeTab === tab ? "page" : undefined} onClick={() => selectTab(tab)} key={tab}>
              {label}
              {tab === "bookshelf" && <span>{bookmarks.length}</span>}
            </button>
          ))}
        </nav>

        {activeTab === "overview" && (
          <section className="profile-overview" aria-label={text("Account overview", "Обзор аккаунта", "Hasabyň syny")}>
            <button type="button" className="overview-card membership" onClick={() => selectTab("membership")}>
              <span className="overview-icon">✦</span>
              <small>{text("CURRENT ACCESS", "ТЕКУЩИЙ ДОСТУП", "HÄZIRKI ELÝETERLILIK")}</small>
              <strong>{isPro ? "Kitapchy Pro" : text("Free reader", "Бесплатный доступ", "Mugt okaýyş")}</strong>
              <p>{membershipDetail}</p>
              <i>→</i>
            </button>
            <button type="button" className="overview-card bookshelf" onClick={() => selectTab("bookshelf")}>
              <span className="overview-icon">▤</span>
              <small>{text("YOUR LIBRARY", "ВАША БИБЛИОТЕКА", "KITAPHANAŇYZ")}</small>
              <strong>{text("Saved stories", "Сохранённые книги", "Saklanan kitaplar")}</strong>
              <p>{bookmarks.length} {text("books ready to continue", "книг для продолжения", "kitap dowam etmäge taýýar")}</p>
              <i>→</i>
            </button>
            <button type="button" className="overview-card billing" onClick={() => selectTab("billing")}>
              <span className="overview-icon">◇</span>
              <small>{text("PAYMENT", "ОПЛАТА", "TÖLEG")}</small>
              <strong>{text("Payment methods", "Способы оплаты", "Töleg usullary")}</strong>
              <p>{paymentMethods.length} {text("saved methods", "сохранённых способов", "saklanan usul")}</p>
              <i>→</i>
            </button>
          </section>
        )}

        {activeTab === "membership" && <>
        <section className="profile-section" id="plans">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MEMBERSHIP</p>
              <h2>Choose how you read</h2>
            </div>
            <span className="frontend-note">
              {text("Synced with your account", "Синхронизировано с аккаунтом")}
            </span>
          </div>
          <div className="plan-grid">
            <article className={`plan-card ${!isPro ? "selected" : ""}`}>
              <div>
                <span className="plan-icon">01</span>
                <p className="eyebrow">FREE</p>
              </div>
              <h3>Start every story</h3>
              <p>
                Explore the library and try the reading experience before
                upgrading.
              </p>
              <ul>
                <li>Read the first part of every book</li>
                <li>Audio until that part ends</li>
                <li>Word translations</li>
                <li className="muted">No saved books</li>
              </ul>
              <button type="button" className="button ghost" disabled>
                {!isPro
                  ? "Current plan"
                  : text("Subscription active", "Подписка активна")}
              </button>
            </article>
            <article
              className={`plan-card featured ${isPro ? "selected" : ""}`}
            >
              <div>
                <span className="plan-icon">✦</span>
                <p className="eyebrow">PRO</p>
                <span className="recommended">FULL EXPERIENCE</span>
              </div>
              <h3>Keep every story going</h3>
              <p>Read without chapter limits and keep a personal shelf.</p>
              <ul>
                <li>Read every book from start to finish</li>
                <li>Full-book audio</li>
                <li>Translations and saved progress</li>
                <li>Save books to your profile</li>
              </ul>
              <button
                type="button"
                className="button primary"
                onClick={() =>
                  document
                    .getElementById("purchase-plans")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
                disabled={isPro}
              >
                {isPro
                  ? "Pro is active"
                  : text("Choose a plan", "Выбрать план")}{" "}
                <span>→</span>
              </button>
            </article>
          </div>
          {availablePlans.length > 0 && (
            <div className="purchase-plans" id="purchase-plans">
              <div className="purchase-plans-heading">
                <div>
                  <p className="eyebrow">{text("PRO PLANS", "ПЛАНЫ PRO")}</p>
                  <h3>
                    {text("Select your reading time", "Выберите срок подписки")}
                  </h3>
                </div>
                {/* <span>{text("Prices from the server", "Цены с сервера")}</span> */}
              </div>
              <div className="purchase-plan-grid">
                {availablePlans.map((item) => (
                  <article
                    key={item.documentId || item.id || item.plan}
                    className={
                      subscription?.plan === item.plan ? "current" : ""
                    }
                  >
                    <span>{promoLabel(item.plan)}</span>
                    <strong>
                      {Number(item.price).toLocaleString()}{" "}
                      <small>{item.currency}</small>
                    </strong>
                    <button
                      type="button"
                      onClick={() => void beginPurchase(item.plan)}
                      disabled={purchasingPlan !== null}
                    >
                      {purchasingPlan === item.plan
                        ? text("Creating…", "Создание…")
                        : text("Choose plan", "Выбрать")}
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
          {pendingPurchase && (
            <div className="pending-purchase" role="status">
              <div>
                <span>{text("PAYMENT READY", "ОПЛАТА ГОТОВА")}</span>
                <strong>
                  {promoLabel(pendingPurchase.plan)} ·{" "}
                  {Number(pendingPurchase.amount).toLocaleString()}{" "}
                  {pendingPurchase.currency}
                </strong>
                <small>
                  {text("Reference", "Номер операции")}:{" "}
                  {pendingPurchase.payment_reference}
                </small>
              </div>
              <button
                type="button"
                onClick={() => void confirmPayment()}
                disabled={purchasingPlan !== null}
              >
                {purchasingPlan
                  ? text("Confirming…", "Подтверждение…")
                  : text("Confirm mock payment", "Подтвердить тестовую оплату")}
              </button>
            </div>
          )}
          {purchaseNotice && (
            <p className="profile-notice" role="status">
              {purchaseNotice}
            </p>
          )}
          {notice && (
            <p className="profile-notice" role="status">
              {notice}
            </p>
          )}
        </section>

        <section className="promo-section">
          <div className="promo-art" aria-hidden="true">
            <span>✦</span>
            <i>P</i>
          </div>
          <div className="promo-copy">
            <p className="eyebrow">HAVE A PROMO CODE?</p>
            <h2>Open a little more time to read.</h2>
            <p>
              Redeem a code for temporary Pro access managed by your account.
            </p>
            {subscription && (
              <div className="active-promo">
                <span>ACTIVE</span>
                <strong>{promoLabel(subscription.plan)}</strong>
                <small>
                  {text("Ends", "До")}{" "}
                  {new Date(subscription.ends_at).toLocaleDateString()}
                </small>
              </div>
            )}
          </div>
          <div className="promo-redeem">
            <form onSubmit={redeemPromo}>
              <label htmlFor="promo-code">Promo code</label>
              <div>
                <input
                  id="promo-code"
                  name="promoCode"
                  placeholder={text("Enter your code", "Введите код")}
                  autoComplete="off"
                  required
                  aria-invalid={
                    promoNoticeTone === "error" && Boolean(promoNotice)
                  }
                />
                <button type="submit">
                  Redeem <span>→</span>
                </button>
              </div>
            </form>
            {promoNotice && (
              <p
                className={`promo-notice ${promoNoticeTone}`}
                role={promoNoticeTone === "error" ? "alert" : "status"}
              >
                {promoNotice}
              </p>
            )}
          </div>
        </section>
        </>}

        {activeTab === "billing" && (
        <section className="profile-section payment-panel" id="billing">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BILLING</p>
              <h2>Payment methods</h2>
            </div>
            <span>{paymentMethods.length} saved</span>
          </div>
          <p className="section-copy">
            Store only your payment provider’s card ID and display details here.
            Full card numbers and security codes never belong in the frontend.
          </p>
          <div className="payment-layout">
            <div className="payment-grid">
              {paymentMethods.map((method) => (
                <article className="payment-card-ui" key={method.id}>
                  <div>
                    <span className="card-chip" />
                    <strong>{method.brand}</strong>
                  </div>
                  <p>{method.userName || user.username}</p>
                  <small>ID · {method.id}</small>
                  <button
                    type="button"
                    onClick={() => removePaymentMethod(method.id)}
                    aria-label={`Remove ${method.brand} card`}
                  >
                    Remove
                  </button>
                </article>
              ))}
              {!paymentMethods.length && (
                <p className="bookmark-empty">No payment methods added yet.</p>
              )}
            </div>
            <form className="payment-form" onSubmit={addPaymentMethod}>
              <h3>Add payment reference</h3>
              <label>
                Payment card ID
                <input
                  name="paymentId"
                  autoComplete="off"
                  placeholder="pm_card_..."
                  required
                />
              </label>
              <label>
                Cardholder name
                <input
                  name="userName"
                  autoComplete="cc-name"
                  defaultValue={user.username}
                  placeholder="Name on card"
                  required
                />
              </label>
              <div>
                <label>
                  Brand
                  <select name="brand" defaultValue="Halk bank">
                    <option>Halk bank</option>
                    <option>Senagat bank</option>
                    <option>Rysgal bank</option>
                  </select>
                </label>
                <label>
                  CVC
                  <input
                    name="cvc"
                    type="password"
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    minLength={3}
                    maxLength={4}
                    pattern="[0-9]{3,4}"
                    placeholder="•••"
                    required
                  />
                </label>
              </div>
              <p className="payment-security-note">
                CVC is checked for this form only and is never saved.
              </p>
              <button className="button primary" type="submit">
                Add card reference
              </button>
              {cardNotice && (
                <p className="account-notice" role="status">
                  {cardNotice}
                </p>
              )}
            </form>
          </div>
        </section>
        )}

        {activeTab === "bookshelf" && (
        <section className="profile-section" id="bookshelf">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SAVED FOR LATER</p>
              <h2>Your bookshelf</h2>
            </div>
            <Link href="/catalog">Browse library →</Link>
          </div>
          {!isPro ? (
            <div className="profile-lock">
              <span>♢</span>
              <div>
                <h3>Bookshelf is a Pro feature</h3>
                <p>Upgrade to save books here and return to them anytime.</p>
              </div>
              <a href="#plans" className="button primary" onClick={() => setActiveTab("membership")}>
                See Pro plan
              </a>
            </div>
          ) : bookmarks.length ? (
            <div className="book-grid featured-grid">
              {bookmarks.map((book) => (
                <BookCard key={book.documentId || book.slug} book={book} />
              ))}
            </div>
          ) : (
            <p className="bookmark-empty">
              Your bookshelf is empty. Save a book to find it here.
            </p>
          )}
        </section>
        )}

        {settingsOpen && (
          <div
            className="account-modal-backdrop"
            role="presentation"
            onMouseDown={() => setSettingsOpen(false)}
          >
            <section
              className="account-settings account-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="account-settings-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="modal-close"
                aria-label="Close account settings"
                onClick={() => setSettingsOpen(false)}
              >
                ×
              </button>
              <p className="eyebrow">ACCOUNT SETTINGS</p>
              <h2 id="account-settings-title">Your profile</h2>
              <form onSubmit={saveProfile}>
                <label>
                  Display name
                  <input
                    name="username"
                    defaultValue={user.username}
                    minLength={2}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    value={user.email}
                    readOnly
                    aria-label="Email address"
                  />
                </label>
                <div>
                  <button
                    className="button primary"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  {notice && (
                    <span className="account-notice" role="status">
                      {notice}
                    </span>
                  )}
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </Shell>
  );
}
