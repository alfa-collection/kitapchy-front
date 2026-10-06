import { type PaymentMethod, type User, type UserSubscription } from "@/lib/api";

export type AccountPlan = "free" | "pro";
const cardsKey = (userId: User["id"]) => `kitapchy_payment_methods:${userId}`;

export function activeSubscription(subscriptions: UserSubscription[]) {
  return subscriptions
    .filter((subscription) => subscription.status === "active" && new Date(subscription.ends_at).getTime() > Date.now())
    .sort((left, right) => new Date(right.ends_at).getTime() - new Date(left.ends_at).getTime())[0] || null;
}

export function resolveAccountPlan(_user?: User | null, subscriptions: UserSubscription[] = []): AccountPlan {
  return activeSubscription(subscriptions) ? "pro" : "free";
}

export function resolvePaymentMethods(user: User): PaymentMethod[] {
  if (Array.isArray(user.payment_methods)) return user.payment_methods;
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(localStorage.getItem(cardsKey(user.id)) || "[]");
    return Array.isArray(stored)
      ? stored
          .filter(
            (item): item is PaymentMethod =>
              typeof item?.id === "string" &&
              typeof item?.brand === "string" &&
              typeof item?.last4 === "string",
          )
      : [];
  } catch {
    return [];
  }
}

export function saveFrontendPaymentMethods(userId: User["id"], methods: PaymentMethod[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(cardsKey(userId), JSON.stringify(methods));
  }
}
