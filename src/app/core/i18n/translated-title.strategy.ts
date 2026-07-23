import { Injectable, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { signal } from '@angular/core';
import { TranslationService } from './translation.service';

/**
 * Sets the document title from each route's `title`, treated as a TRANSLATION
 * KEY rather than literal text, and re-applies it when the locale changes.
 *
 * Two reasons this matters beyond cosmetics:
 * - Accessibility: screen readers announce the document title on navigation.
 * With a single static title across all 44 routes, a non-sighted user gets no
 * confirmation that anything changed.
 * - Bilingual correctness: a title set once at navigation time would stay in
 * the old language after the user toggles EN/AR, so the tab and the page would
 * disagree. Re-running on locale change keeps them in sync.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(TranslationService);

  /** The current route's title key, retained so a locale switch can re-render it. */
  private readonly currentKey = signal<string | undefined>(undefined);

  constructor() {
    super();
    effect(() => {
      // Depend on both the key and the dictionary so this re-runs when the
      // language changes or the dictionary finishes loading.
      const key = this.currentKey();
      const brand = this.resolve('brand.nameEn') ?? BRAND_FALLBACK;
      const pageTitle = key ? this.resolve(key) : undefined;
      this.title.setTitle(pageTitle ? `${pageTitle} · ${brand}` : brand);
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.currentKey.set(this.buildTitle(snapshot));
  }

  /**
   * Translates a key, returning `undefined` rather than the key itself when it
   * cannot be resolved. The dictionary loads over HTTP, so on a cold page load
   * the very first title runs before it arrives — without this, the raw dotted
   * key (e.g. "brand.nameEn") is briefly shown in the browser tab.
   */
  private resolve(key: string): string | undefined {
    const value = this.i18n.translate(key);
    return value === key ? undefined : value;
  }
}

/** Used only in the window before the dictionary loads; matches `brand.nameEn`. */
const BRAND_FALLBACK = 'Gaza Reconstruction Platform';
