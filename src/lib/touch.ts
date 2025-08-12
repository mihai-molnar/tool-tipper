/**
 * Utilities for detecting and handling touch devices
 */

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - for older browsers
    navigator.msMaxTouchPoints > 0
  );
}

export function useIsTouchDevice() {
  if (typeof window === 'undefined') return false;
  return isTouchDevice();
}

// Media query to detect mobile viewport
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
}