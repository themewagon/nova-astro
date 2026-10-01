/// <reference types="astro/client" />

interface Window {
  WebScaleCookies?: {
    openSettings: () => void;
  };
  __floatingBarInitialized?: boolean;
  __lenis?: {
    scrollTo: (target: number) => void;
  };
}
