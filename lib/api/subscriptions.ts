import { api } from "@/lib/api/client";
import type { CollectionResponse, PaymentConfirmation, PromoApplication, PromoValidation, SubscriptionPlan, SubscriptionPlanRecord, SubscriptionPurchase, UserSubscription } from "@/lib/api/types";

// Memberships and promo codes
export const listUserSubscriptions = async () => {
  const response = await api.get<
    CollectionResponse<UserSubscription> | UserSubscription[]
  >("/user-subscriptions");
  const rows = Array.isArray(response.data)
    ? response.data
    : response.data.data || [];
  return rows.map((row) => {
    const wrapped = row as UserSubscription & { attributes?: UserSubscription };
    return wrapped.attributes
      ? {
          ...wrapped.attributes,
          id: wrapped.id,
          documentId: wrapped.documentId,
        }
      : row;
  });
};
export const validatePromoCode = (code: string) =>
  api
    .post<PromoValidation>("/promo-codes/validate", { code })
    .then(({ data }) => data);
export const applyPromoCode = (code: string) =>
  api
    .post<PromoApplication>("/promo-codes/apply", { code })
    .then(({ data }) => data);
export const listSubscriptionPlans = async () => {
  const response = await api.get<
    CollectionResponse<SubscriptionPlanRecord> | SubscriptionPlanRecord[]
  >("/subscription-plans");
  const rows = Array.isArray(response.data)
    ? response.data
    : response.data.data || [];
  return rows.map((row) => {
    const wrapped = row as SubscriptionPlanRecord & {
      attributes?: SubscriptionPlanRecord;
    };
    return wrapped.attributes
      ? {
          ...wrapped.attributes,
          id: wrapped.id,
          documentId: wrapped.documentId,
        }
      : row;
  });
};
export const purchaseSubscription = (plan: SubscriptionPlan) =>
  api
    .post<SubscriptionPurchase>("/user-subscriptions/purchase", { plan })
    .then(({ data }) => data);
export const confirmMockSubscriptionPayment = (purchaseId: number) =>
  api
    .post<PaymentConfirmation>(
      `/user-subscriptions/purchases/${purchaseId}/mock-confirm`,
    )
    .then(({ data }) => data);
