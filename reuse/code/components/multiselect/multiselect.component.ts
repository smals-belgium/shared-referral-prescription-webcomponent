import { LiveAnnouncer } from '@angular/cdk/a11y';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface MultiselectOption {
  name: string;
  value: string;
}

@Component({
  selector: 'app-multiselect',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatChipsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatAutocompleteModule,
    FormsModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './multiselect.component.html',
  styleUrl: './multiselect.component.scss',
})
export class MultiselectComponent implements OnChanges, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();
  @ViewChild('itemInput') inputField!: ElementRef<HTMLInputElement>;

  @Input() placeholder?: string;
  @Input() label?: string;
  @Input({ required: true }) data: MultiselectOption[] = [];
  @Input({ required: true }) key: string = '';
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() initialValue?: string[];

  private valueChangesSubscription?: Subscription;

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly selectedItems = signal<MultiselectOption[]>([]);
  readonly filteredItems = signal<MultiselectOption[]>([]);
  private filterString: string = '';

  readonly announcer = inject(LiveAnnouncer);

  get formControl(): FormControl | null {
    return this.formGroup.get(this.key) as FormControl | null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['formGroup'] || changes['key'] || changes['data']) && this.formGroup && this.key && this.data) {
      this.retsetSelectedItems();
    }

    if (changes['initialValue'] && this.initialValue === undefined && this.formGroup) {
      this.retsetSelectedItems();
    }
  }

  retsetSelectedItems() {
    this.selectedItems.set([]);
    this.setupAutocompleteOptions();
  }

  ngAfterViewInit(): void {
    if (this.formGroup && this.initialValue) {
      this.updateFormValue(this.initialValue);
    }
  }

  updateFormValue(value: string[]): void {
    if (this.formControl) {
      const defaultSelectedItems = !value ? [] : this.data.filter(option => value.includes(option.value));
      this.selectedItems.set(defaultSelectedItems);
      this.formControl.setValue(defaultSelectedItems);
      this.formControl.markAsDirty();
    }
  }

  setupAutocompleteOptions() {
    if (!this.formControl) return;

    if (!this.valueChangesSubscription) {
      this.filteredItems.set(this.getFilteredOptions('')); // Initialize filtered items

      this.valueChangesSubscription = this.formControl.valueChanges
        .pipe(
          distinctUntilChanged(),
          takeUntil(this.destroy$) // Automatically unsubscribes on destroy
        )
        .subscribe(value => {
          const filterValue = typeof value === 'string' ? value : this.filterString;
          this.filteredItems.set(this.getFilteredOptions(filterValue));
        });
    }
  }

  private getFilteredOptions(filter: string): MultiselectOption[] {
    this.filterString = filter;
    const currentSelectedItems = this.selectedItems();
    const lowerFilter = filter.toLowerCase();

    return this.data.filter(
      option =>
        (!filter || option.name.toLowerCase().includes(lowerFilter)) &&
        !currentSelectedItems.some(item => item.value === option.value)
    );
  }

  remove(item: MultiselectOption): void {
    this.selectedItems.update(items => {
      const filteredItems = items.filter(i => i.value !== item.value);
      this.announcer.announce(`Removed ${item.name}`);
      return filteredItems;
    });

    if (this.formControl) {
      this.formControl.setValue(this.selectedItems());
      this.formControl.markAsDirty();
    }

    this.resetFilter();
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const selectedValue = event.option.value;
    const item = this.data.find(e => e.value === selectedValue);

    if (item) {
      this.selectedItems.update(items => [...items, item]);
      this.announcer.announce(`added ${item.name}`);

      if (this.formControl) {
        this.formControl.setValue(this.selectedItems());
        this.formControl.markAsDirty();
      }

      event.option.deselect();
      this.resetFilter();
    }
  }

  resetFilter(): void {
    this.filterString = '';
    this.filteredItems.set(this.getFilteredOptions(''));

    if (this.inputField) {
      this.inputField.nativeElement.value = '';
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
