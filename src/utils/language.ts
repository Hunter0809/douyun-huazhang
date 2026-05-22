export type AppLanguage = "zh" | "en";

const LANGUAGE_KEY = "douyun_language";

export function loadAppLanguage(): AppLanguage {
  if (typeof window === "undefined" || typeof localStorage?.getItem !== "function") return "zh";
  try {
    return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

export function saveAppLanguage(language: AppLanguage): void {
  if (typeof window === "undefined" || typeof localStorage?.setItem !== "function") return;
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Keep the in-memory UI state even if the small preference write fails.
  }
}

export function languageLabel(language: AppLanguage): string {
  return language === "en" ? "English" : "中文";
}
