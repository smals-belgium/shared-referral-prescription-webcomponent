import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfessionalSearchChipListComponent } from './professional-search-chip-list.component';
import { FormControl, FormGroup } from '@angular/forms';
import { CityResource } from '@reuse/code/openapi';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('CityChipListComponent', () => {
  let component: ProfessionalSearchChipListComponent;
  let fixture: ComponentFixture<ProfessionalSearchChipListComponent>;
  let formGroup: FormGroup;
  let citiesControl: FormControl;
  let queryControl: FormControl;

  beforeEach(async () => {
    citiesControl = new FormControl<CityResource[]>([]);
    queryControl = new FormControl<string>('');

    formGroup = new FormGroup({
      query: queryControl,
      cities: citiesControl,
    });
    await TestBed.configureTestingModule({
      imports: [ProfessionalSearchChipListComponent, TranslateModule.forRoot(), MatIconTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessionalSearchChipListComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should remove the right city when cities control is updated ', () => {
    const spyEmit = jest.spyOn(component.searchCriteriaRemoval, 'emit');
    const removeCity: CityResource = { zipCode: 1000 };
    citiesControl.setValue([{ zipCode: 1000 }, { zipCode: 2000 }]);

    component.removeCity(removeCity);

    expect(citiesControl.value).toEqual([{ zipCode: 2000 }]);
    expect(spyEmit).toHaveBeenCalledTimes(1);
  });
  it('should trigger removeCity when the chip remove button is clicked', () => {
    const spyEmit = jest.spyOn(component.searchCriteriaRemoval, 'emit');
    citiesControl.setValue([{ zipCode: 1000 }]);
    fixture.detectChanges();

    const removeBtn = fixture.nativeElement.querySelector('button[matChipRemove]');
    expect(removeBtn).toBeTruthy();
    removeBtn.click();

    expect(citiesControl.value.length).toBe(0);
    expect(spyEmit).toHaveBeenCalledTimes(1);
  });

  it('should clear query and emit when query chip is removed', () => {
    const spyEmit = jest.spyOn(component.searchCriteriaRemoval, 'emit');
    queryControl.setValue('Some Search');
    fixture.componentRef.setInput('hideUpdateSearchButton', false);
    fixture.detectChanges();

    const removeBtn = fixture.nativeElement.querySelector('[data-cy="prescription-selected-query-remove"]');
    expect(removeBtn).toBeTruthy();
    removeBtn.click();

    expect(queryControl.value).toBe('');
    expect(spyEmit).toHaveBeenCalled();
  });

  it('should trigger goBackSearch when clicking go back button', () => {
    fixture.componentRef.setInput('hideUpdateSearchButton', false);
    fixture.detectChanges();

    const spyEmitter = jest.spyOn(component.goBackToSearch, 'emit');
    const backBtn = fixture.nativeElement.querySelector('button.go_back_search');

    backBtn.click();
    expect(spyEmitter).toHaveBeenCalledTimes(1);
  });
});
