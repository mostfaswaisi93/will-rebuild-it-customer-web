import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@core/i18n/translate.pipe';

export interface DataTableColumn<T> {
  key: string;
  headerKey: string;
  cell: (row: T) => string;
  align?: 'start' | 'end' | 'center';
}

/**
 * Generic tabular list. Renders a real `<table>` on `md:` and up, and
 * stacked "label: value" cards on mobile so small screens never get
 * horizontal scroll.
 */
@Component({
  selector: 'app-data-table',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './data-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T> {
  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly loading = input(false);
  readonly rowLink = input<(row: T) => string | undefined>();
  readonly trackByFn = input<(row: T) => string>();

  protected readonly skeletonRows: readonly number[] = [0, 1, 2, 3];

  protected trackRow(row: T, index: number): string | number {
    const fn = this.trackByFn();
    return fn ? fn(row) : index;
  }

  protected alignClass(align: DataTableColumn<T>['align']): string {
    if (align === 'end') {
      return 'text-end';
    }
    if (align === 'center') {
      return 'text-center';
    }
    return 'text-start';
  }

  protected linkFor(row: T): string | undefined {
    const fn = this.rowLink();
    return fn ? fn(row) : undefined;
  }

  protected rowClasses(row: T): string {
    const base = 'border-b border-ink-300/60 last:border-b-0';
    return this.linkFor(row)
      ? `${base} cursor-pointer hover:bg-surface-container-low focus-visible:bg-surface-container-low`
      : base;
  }

  protected cardClasses(row: T): string {
    const base = 'rounded-card border border-ink-300 bg-surface p-4';
    return this.linkFor(row)
      ? `${base} cursor-pointer hover:border-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500`
      : base;
  }
}
