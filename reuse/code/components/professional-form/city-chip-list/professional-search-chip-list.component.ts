import { Component, effect, input, output, signal } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { TranslationPipe } from '@reuse/code/pipes/translation.pipe';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { CityResource } from '@reuse/code/openapi';
import { FormControl, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'city-chip-list',
  imports: [MatChipsModule, TranslationPipe, MatIconModule, TranslatePipe, MatButtonModule],
  templateUrl: './professional-search-chip-list.component.html',
  styleUrl: './professional-search-chip-list.component.scss',
})
export class ProfessionalSearchChipListComponent {
  readonly formGroup = input.required<
    FormGroup<{
      query: FormControl<string>;
      cities: FormControl<CityResource[]>;
    }>
  >();

  readonly hideUpdateSearchButton = input<boolean>(true);
  readonly searchCriteriaRemoval = output<void>();
  readonly goBackToSearch = output<void>();

  protected readonly cities = signal<CityResource[]>([]);
  protected readonly query = signal<string>('');

  constructor() {
    effect(onCleanup => {
      const { cities: citiesControl, query: queryControl } = this.formGroup().controls;

      this.cities.set(citiesControl.value ?? []);
      this.query.set(queryControl.value ?? '');

      const citySubscription = citiesControl.valueChanges.subscribe(v => this.cities.set(v ?? []));
      const querySubscription = queryControl.valueChanges.subscribe(v => this.query.set(v ?? ''));

      onCleanup(() => {
        citySubscription.unsubscribe();
        querySubscription.unsubscribe();
      });
    });
  }

  removeCity(city: CityResource) {
    const citiesControl = this.formGroup().controls.cities;
    const currentCities = citiesControl.value ?? [];
    const updatedCities = currentCities.filter(c => c.zipCode !== city.zipCode);

    if (updatedCities.length !== currentCities.length) {
      citiesControl.setValue(updatedCities);
      this.formGroup().controls.query.updateValueAndValidity();
      this.searchCriteriaRemoval.emit();
    }
  }

  clearQuery() {
    this.formGroup().controls.query.setValue('');
    this.searchCriteriaRemoval.emit();
  }

  backToSearch() {
    this.goBackToSearch.emit();
  }
}
