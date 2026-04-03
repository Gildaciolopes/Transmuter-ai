"use client";

import { useEffect, useRef, useState } from "react";

const LANGUAGES = [
  { code: "en", label: "English", flag: "EN" },
  { code: "pt", label: "Portugues", flag: "PT" },
  { code: "es", label: "Espanol", flag: "ES" },
  { code: "fr", label: "Francais", flag: "FR" },
  { code: "de", label: "Deutsch", flag: "DE" },
  { code: "ja", label: "Japanese", flag: "JA" },
  { code: "zh-CN", label: "Chinese", flag: "ZH" },
  { code: "ko", label: "Korean", flag: "KO" },
] as const;

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: {
          new (
            opts: { pageLanguage: string; autoDisplay: boolean },
            id: string,
          ): void;
          InlineLayout: { SIMPLE: number };
        };
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

function injectGoogleTranslateScript() {
  if (document.getElementById("google-translate-script")) return;
  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src =
    "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.head.appendChild(script);
}

function setGoogleTranslateLanguage(langCode: string) {
  // Google Translate stores the selection in a cookie and a hidden <select>
  const frame = document.querySelector<HTMLIFrameElement>(
    "iframe.goog-te-menu-frame",
  );
  if (frame?.contentDocument) {
    const links = frame.contentDocument.querySelectorAll("a");
    for (const link of links) {
      if (link.getAttribute("href")?.includes(`#${langCode}`)) {
        link.click();
        return;
      }
    }
  }
  // Fallback: set the cookie directly
  document.cookie = `googtrans=/en/${langCode};path=/;`;
  document.cookie = `googtrans=/en/${langCode};path=/;domain=${window.location.hostname}`;
  window.location.reload();
}

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("en");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Google Translate (hidden) — we control the UI ourselves
    window.googleTranslateElementInit = () => {
      if (window.google?.translate) {
        new window.google.translate.TranslateElement(
          { pageLanguage: "en", autoDisplay: false },
          "google_translate_element",
        );
      }
    };
    injectGoogleTranslateScript();

    // Read current language from cookie
    const match = document.cookie.match(/googtrans=\/en\/(\S+)/);
    if (match?.[1]) setCurrent(match[1]);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(code: string) {
    setCurrent(code);
    setOpen(false);
    if (code === "en") {
      // Reset to original
      document.cookie =
        "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = `googtrans=;path=/;domain=${window.location.hostname};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      window.location.reload();
      return;
    }
    setGoogleTranslateLanguage(code);
  }

  const currentLang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" className="hidden" />

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-tm text-tm-secondary hover:text-tm hover:bg-tm-subtle transition-all text-xs font-medium"
        aria-label="Change language"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802"
          />
        </svg>
        <span>{currentLang.flag}</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-tm bg-tm-card shadow-lg overflow-hidden z-50 animate-fade-in backdrop-blur-xl">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                current === lang.code
                  ? "bg-violet-500/10 text-violet-400 font-medium"
                  : "text-tm-secondary hover:bg-tm-subtle hover:text-tm"
              }`}
            >
              <span className="font-mono text-[10px] w-5 text-center opacity-60">
                {lang.flag}
              </span>
              <span>{lang.label}</span>
              {current === lang.code && (
                <svg
                  className="w-3.5 h-3.5 ml-auto text-violet-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
