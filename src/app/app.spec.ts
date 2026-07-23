import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a skip link as the first focusable element', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const skip: HTMLAnchorElement | null = fixture.nativeElement.querySelector('a[href="#main-content"]');
    expect(skip).withContext('skip link must exist').not.toBeNull();
    expect(skip!.classList).withContext('styled by app.css, not Tailwind utilities').toContain('skip-link');

    // It must be the first focusable thing on the page, otherwise a keyboard
    // user tabs through the whole nav before reaching it.
    const focusable = fixture.nativeElement.querySelectorAll('a[href], button, input, select, textarea');
    expect(focusable[0]).toBe(skip!);
  });

  it('moves focus to the main landmark when asked', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const main = document.createElement('main');
    main.id = 'main-content';
    main.tabIndex = -1;
    document.body.appendChild(main);

    // The clock must be installed BEFORE the call, so the deferred focus is
    // captured by the fake timer rather than the real one.
    jasmine.clock().install();
    try {
      (fixture.componentInstance as unknown as { focusMainContent(): void }).focusMainContent();
      jasmine.clock().tick(1);

      expect(document.activeElement).toBe(main);
    } finally {
      jasmine.clock().uninstall();
      main.remove();
    }
  });
});
