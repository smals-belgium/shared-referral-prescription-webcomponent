import { Component, inject, output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { TranslateModule } from '@ngx-translate/core';
import { AsyncPipe } from '@angular/common';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { TranslationPipe } from '@reuse/code/pipes/translation.pipe';
import { CaregiverNamePatternValidator } from '@reuse/code/utils/validators';
import { CityResource, GeographyService } from '@reuse/code/openapi';
import { debounceTime, filter, map, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ResponsiveWrapperComponent } from '@reuse/code/components/responsive-wrapper/responsive-wrapper.component';

export type ProfessionalType = 'CAREGIVER' | 'ORGANIZATION' | 'ALL';

export interface SearchCriteria {
  query: string;
  zipCodes: number[];
}

export interface SearchFormData {
  query: string;
  cities: CityResource[];
  searchCity: string;
}

@Component({
  selector: 'professional-search-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMaskDirective,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    TranslateModule,
    MatAutocompleteModule,
    MatIconModule,
    TranslationPipe,
    TranslationPipe,
    AsyncPipe,
    MatButtonToggleModule,
    ResponsiveWrapperComponent,
  ],
  providers: [provideNgxMask()],
  templateUrl: './professional-search-form.component.html',
  styleUrl: './professional-search-form.component.scss',
})
export class ProfessionalSearchFormComponent {
  private readonly geographyService = inject(GeographyService);
  private readonly nameValidators = [Validators.minLength(2), CaregiverNamePatternValidator];

  protected readonly caregiverNameMaxLength = 50;

  readonly searchCriteria = output<SearchCriteria>();

  readonly queryControl = new FormControl('', { nonNullable: true });
  readonly cityControl = new FormControl<CityResource[]>([], { nonNullable: true });

  readonly formGroup = new FormGroup({
    query: this.queryControl,
    cities: this.cityControl,
  });

  readonly searchCityControl = new FormControl('', { nonNullable: true });

  queryIsNumeric = false;

  readonly cityOptions$ = this.searchCityControl.valueChanges.pipe(
    debounceTime(400),
    filter(value => typeof value === 'string'),
    switchMap(query => {
      if (query.length <= 1) {
        return of([]);
      }

      return this.geographyService.findCities(query).pipe(
        map(resource => resource.items ?? []),
        catchError(() => of([]))
      );
    })
  );
  cityControlmaxLength: number = 5;

  constructor() {
    this.setValidators();
  }

  private setValidators(): void {
    this.queryControl.setValidators([
      (control: AbstractControl) => (this.cityControl.value.length === 0 ? Validators.required(control) : null),
    ]);
    this.queryControl.addValidators(this.nameValidators);

    this.cityControl.setValidators((control: AbstractControl) =>
      Validators.required(this.queryControl) != null
        ? Validators.required(control) || Validators.minLength(1)(control)
        : null
    );
  }

  search(): void {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) return;

    const cities = this.cityControl.value ?? [];
    const zipCodes = cities.map(c => c.zipCode).filter((z): z is number => z !== undefined);

    this.searchCriteria.emit({
      query: this.queryControl.value,
      zipCodes,
    });
  }

  onInput(event: Event): void {
    this.cityControl.updateValueAndValidity();
    this.updateQueryTypeAndValidators(event);
  }

  addCity(event: MatAutocompleteSelectedEvent, searchInput: HTMLInputElement): void {
    if (!event.option.value) return;

    const selectedCity = event.option.value as CityResource;
    const cities = this.cityControl.value.filter(c => c.zipCode !== selectedCity.zipCode);
    cities.push(selectedCity);
    this.cityControl.setValue(cities);
    searchInput.value = '';
    this.queryControl.updateValueAndValidity();
  }

  removeCity(city: CityResource): void {
    const index = this.cityControl.value.indexOf(city);
    if (index >= 0) {
      this.cityControl.value.splice(index, 1);
      this.cityControl.updateValueAndValidity();
    }
    this.queryControl.updateValueAndValidity();
  }

  private updateQueryTypeAndValidators(event: Event): void {
    const previouslyNumeric = this.queryIsNumeric;
    const inputValue = (event.target as HTMLInputElement).value;

    this.queryIsNumeric = !!inputValue && !Number.isNaN(Number(inputValue[0]));

    if (this.queryIsNumeric) {
      const sanitized = inputValue.replace(/-/g, '');
      if (this.queryControl.value !== sanitized) {
        this.queryControl.setValue(sanitized, { emitEvent: false });
      }
    }

    if (this.queryIsNumeric !== previouslyNumeric) {
      if (this.queryIsNumeric) {
        this.queryControl.removeValidators(this.nameValidators);
      } else {
        this.queryControl.addValidators(this.nameValidators);
      }
      this.queryControl.updateValueAndValidity({ emitEvent: false });
    }
  }
}
