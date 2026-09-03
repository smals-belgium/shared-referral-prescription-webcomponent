import { TestBed } from '@angular/core/testing';

import { ProfessionalSearchChipListComponent } from './professional-search-chip-list.component';
import { FormControl, FormGroup } from '@angular/forms';
import { CityResource } from '@reuse/code/openapi';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconTestingModule } from '@angular/material/icon/testing';

const cityA: CityResource = {
  zipCode: 1000,
};
const cityB: CityResource = {
  zipCode: 2000,
};

describe('CityChipListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessionalSearchChipListComponent, TranslateModule.forRoot(), MatIconTestingModule],
    }).compileComponents();
  });

  it('should create', () => {
    const formGroup = createFormGroup();
    const fixture = setup(formGroup);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
  it('should remove the right city when cities control is updated ', () => {
    const formGroup = createFormGroup([cityA, cityB]);
    const fixture = setup(formGroup);
    const component = fixture.componentInstance;
    const spyEmit = jest.spyOn(component.searchCriteriaRemoval, 'emit');
    const removeCity: CityResource = cityA;

    component.removeCity(removeCity);

    expect(formGroup.controls.cities.value).toEqual([cityB]);
    expect(spyEmit).toHaveBeenCalledTimes(1);
  });
  it('should trigger removeCity when the chip remove button is clicked', () => {
    const formGroup = createFormGroup([cityA]);
    const fixture = setup(formGroup);
    const component = fixture.componentInstance;

    const spyEmit = jest.spyOn(component.searchCriteriaRemoval, 'emit');

    const removeBtn = fixture.nativeElement.querySelector('[data-cy="prescription-selected-city-remove"]');
    expect(removeBtn).toBeTruthy();
    removeBtn.click();

    expect(formGroup.controls.cities.value.length).toBe(0);
    expect(spyEmit).toHaveBeenCalledTimes(1);
  });

  it('should clear query and emit when query chip is removed', () => {
    const formGroup = createFormGroup([cityA], 'Some Search');
    const fixture = setup(formGroup);
    const component = fixture.componentInstance;

    const spyEmit = jest.spyOn(component.searchCriteriaRemoval, 'emit');
    fixture.componentRef.setInput('hideUpdateSearchButton', false);
    fixture.detectChanges();

    const removeBtn = fixture.nativeElement.querySelector('[data-cy="prescription-selected-query-remove"]');
    expect(removeBtn).toBeTruthy();
    removeBtn.click();

    expect(formGroup.controls.query.value).toBe('');
    expect(spyEmit).toHaveBeenCalled();
  });

  it('should trigger goBackSearch when clicking go back button', () => {
    const formGroup = createFormGroup([cityA]);
    const fixture = setup(formGroup);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('hideUpdateSearchButton', false);
    fixture.detectChanges();

    const spyEmitter = jest.spyOn(component.goBackToSearch, 'emit');
    const backBtn = fixture.nativeElement.querySelector('button.go_back_search');

    backBtn.click();
    expect(spyEmitter).toHaveBeenCalledTimes(1);
  });

  it('updates cities() when the cities control emits a new value', () => {
    const formGroup = createFormGroup([cityA]);
    const fixture = setup(formGroup);
    const component = fixture.componentInstance;

    formGroup.controls.cities.setValue([cityA, cityB]);

    expect((component as any).cities()).toEqual([cityA, cityB]);
  });

  it('updates query() when the query control emits a new value', () => {
    const formGroup = createFormGroup();
    const fixture = setup(formGroup);
    const component = fixture.componentInstance;

    formGroup.controls.query.setValue('Ghent');

    expect((component as any).query()).toBe('Ghent');
  });

  it('unsubscribes from the old FormGroup when a new one is bound', () => {
    const oldFormGroup = createFormGroup([cityA]);
    const fixture = setup(oldFormGroup);
    const component = fixture.componentInstance;

    const newFormGroup = createFormGroup([cityB]);
    fixture.componentRef.setInput('formGroup', newFormGroup);
    fixture.detectChanges();

    expect((component as any).cities()).toEqual([cityB]);

    oldFormGroup.controls.cities.setValue([cityA, cityB]);

    expect((component as any).cities()).toEqual([cityB]);
  });

  function createFormGroup(cities: CityResource[] = [], query = '') {
    return new FormGroup({
      query: new FormControl(query, { nonNullable: true }),
      cities: new FormControl(cities, { nonNullable: true }),
    });
  }

  function setup(formGroup: ReturnType<typeof createFormGroup>) {
    const fixture = TestBed.createComponent(ProfessionalSearchChipListComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();
    return fixture;
  }
});
