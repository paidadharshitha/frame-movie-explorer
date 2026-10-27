/** Browser connectivity events avoid cross-origin reachability probe failures. */
export function subscribeToBrowserNetwork(listener: (isOnline: boolean) => void): () => void {
  const update = () => listener(typeof navigator === 'undefined' || navigator.onLine !== false);
  update();
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  };
}
