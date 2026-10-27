import { afterEach, describe, expect, it, vi } from 'vitest';
import { subscribeToBrowserNetwork } from '../src/state/browser-network';

afterEach(() => vi.unstubAllGlobals());

describe('browser connectivity', () => {
  it('reports the initial connection and follows offline/online events', () => {
    const browser = new EventTarget();
    const status = { onLine: true };
    vi.stubGlobal('window', browser);
    vi.stubGlobal('navigator', status);
    const listener = vi.fn();
    const unsubscribe = subscribeToBrowserNetwork(listener);
    expect(listener).toHaveBeenLastCalledWith(true);

    status.onLine = false;
    browser.dispatchEvent(new Event('offline'));
    expect(listener).toHaveBeenLastCalledWith(false);

    status.onLine = true;
    browser.dispatchEvent(new Event('online'));
    expect(listener).toHaveBeenLastCalledWith(true);
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    browser.dispatchEvent(new Event('offline'));
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('starts offline if the browser was already disconnected at mount', () => {
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('navigator', { onLine: false });
    const listener = vi.fn();
    const unsubscribe = subscribeToBrowserNetwork(listener);
    expect(listener).toHaveBeenCalledWith(false);
    unsubscribe();
  });
});
