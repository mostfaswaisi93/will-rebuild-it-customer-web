import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

export type AppLocale = 'en' | 'ar';

const STORAGE_KEY = 'grp-locale';
const DEFAULT_LOCALE: AppLocale = 'en';

type Dictionary = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly locale = signal<AppLocale>(this.readInitialLocale());
  readonly isRtl = computed(() => this.locale() === 'ar');

  private readonly dictionaryResource = httpResource<Dictionary>(
    () => `/i18n/${this.locale()}.json`,
  );

  readonly dictionary = computed<Dictionary>(() => this.dictionaryResource.value() ?? {});
  readonly isLoading = computed(() => this.dictionaryResource.isLoading());

  constructor() {
    effect(() => {
      const locale = this.locale();
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
      localStorage.setItem(STORAGE_KEY, locale);
    });
  }

  setLocale(locale: AppLocale): void {
    this.locale.set(locale);
  }

  toggleLocale(): void {
    this.locale.set(this.locale() === 'en' ? 'ar' : 'en');
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const resolved = this.resolve(key, this.dictionary());
    if (resolved === undefined) {
      return key;
    }
    return this.interpolate(resolved, params);
  }

  private readInitialLocale(): AppLocale {
    if (!isPlatformBrowser(this.platformId)) {
      return DEFAULT_LOCALE;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'en' || stored === 'ar' ? stored : DEFAULT_LOCALE;
  }

  private resolve(key: string, dictionary: Dictionary): string | undefined {
    let current: unknown = dictionary;
    for (const segment of key.split('.')) {
      if (current !== null && typeof current === 'object' && segment in (current as Dictionary)) {
        current = (current as Dictionary)[segment];
      } else {
        return undefined;
      }
    }
    return typeof current === 'string' ? current : undefined;
  }

  private interpolate(value: string, params?: Record<string, string | number>): string {
    if (!params) {
      return value;
    }
    return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, token: string) =>
      token in params ? String(params[token]) : '',
    );
  }
}
