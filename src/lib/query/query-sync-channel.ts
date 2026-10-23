import type { QuerySyncBroadcastMessage, QuerySyncDomain } from '@/types/query-sync';

const CHANNEL_NAME = 'ronaq-admin-query-sync';

export function publishQuerySyncInvalidate(domains: readonly QuerySyncDomain[]): void {
  if (typeof BroadcastChannel === 'undefined') return;
  const message: QuerySyncBroadcastMessage = {
    type: 'invalidate-domains',
    domains: [...domains]
  };
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage(message);
  channel.close();
}

export function subscribeQuerySyncInvalidate(
  onInvalidate: (domains: readonly QuerySyncDomain[]) => void
): () => void {
  if (typeof BroadcastChannel === 'undefined') {
    return () => undefined;
  }
  const channel = new BroadcastChannel(CHANNEL_NAME);
  const handleMessage = (event: MessageEvent<QuerySyncBroadcastMessage>) => {
    if (event.data?.type !== 'invalidate-domains') return;
    if (!Array.isArray(event.data.domains) || event.data.domains.length === 0) return;
    onInvalidate(event.data.domains);
  };
  channel.addEventListener('message', handleMessage);
  return () => {
    channel.removeEventListener('message', handleMessage);
    channel.close();
  };
}
