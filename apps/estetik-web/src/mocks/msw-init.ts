export async function initMSW() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'development') return;
  if (process.env.NEXT_PUBLIC_API_URL) return; // Don't use MSW if a real API URL is configured

  const { worker } = await import('./browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
  console.log('[MSW] Mock service worker started');
}
