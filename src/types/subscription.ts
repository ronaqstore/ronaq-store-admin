export type WhatsAppSupportUrlParams = {
  shopName?: string | null;
  message?: string;
};

export interface SubscriptionSource {
  subscriptionEndsAt?: string | null;
  subscriptionStatus?: 'TRIALING' | 'ACTIVE' | 'EXPIRED' | null;
  shopName?: string | null;
}

export interface EffectiveSubscriptionResult {
  endsAt: string | null;
  subscriptionStatus: 'TRIALING' | 'ACTIVE' | 'EXPIRED' | null;
  isPaid: boolean;
  daysLeft: number | null;
  shopName: string;
}
