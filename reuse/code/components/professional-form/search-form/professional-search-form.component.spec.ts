import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfessionalSearchFormComponent } from './professional-search-form.component';
import { CityResource } from '@reuse/code/openapi';
import { GeographyService } from '@reuse/code/services/api/geography.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideNgxMask } from 'ngx-mask';
import { ProfessionalSearchChipListComponent } from '@reuse/code/components/professional-form/city-chip-list/professional-search-chip-list.component';

describe('ProfessionalSearchFormComponent', () => {
  let component: ProfessionalSearchFormComponent;
  let fixture: ComponentFixture<ProfessionalSearchFormComponent>;
  let formGroup;

  beforeEach(async () => {
    formGroup = new FormGroup({
      query: new FormControl<string>(''),
      cities: new FormControl<CityResource[]>([]),
    });
    const geographyServiceMock = {
      findAll: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        ProfessionalSearchFormComponent,
        ProfessionalSearchChipListComponent,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: GeographyService, useValue: geographyServiceMock },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideNgxMask(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessionalSearchFormComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('formGroup', formGroup);

    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form validation', () => {
    it('should be invalid when query and cities are empty', () => {
      component.formGroup().setValue({
        query: '',
        cities: [],
      });

      component.formGroup().updateValueAndValidity();
      expect(component.formGroup().valid).toBe(false);
    });

    it('should be valid with query only', () => {
      component.formGroup().setValue({
        query: 'John',
        cities: [],
      });

      component.formGroup().updateValueAndValidity();
      expect(component.formGroup().valid).toBe(true);
    });

    it('should be valid with cities only', () => {
      component.formGroup().setValue({
        query: '',
        cities: [{ zipCode: 1000, cityName: 'Brussels' } as any],
      });

      component.formGroup().updateValueAndValidity();
      component.formGroup().get('query')!.updateValueAndValidity();
      component.formGroup().get('cities')!.updateValueAndValidity();

      expect(component.formGroup().valid).toBe(true);
    });
  });

  describe('City management', () => {
    it('should add city', () => {
      const city = { zipCode: 1000, cityName: 'Brussels' };
      const event = { option: { value: city } } as any;
      const input = { value: 'test' } as HTMLInputElement;

      component.citiesControl.setValue([]);

      component.addCity(event, input);

      expect(component.citiesControl.value).toEqual([city]);

      expect(input.value).toBe('');
    });

    it('should remove city', () => {
      const city: CityResource = { zipCode: 1000 };

      component.citiesControl.setValue([city]);

      component.removeCity(city);

      expect(component.citiesControl.value).toEqual([]);
    });
  });

  describe('setValidators (via OnInit)', () => {
    it('should require query when no cities are selected', () => {
      component.citiesControl.setValue([]);
      component.queryControl.setValue('');
      component.queryControl.updateValueAndValidity();

      expect(component.queryControl.valid).toBe(false);
      expect(component.queryControl.errors).toEqual(expect.objectContaining({ required: true }));
    });

    it('should not require query when a city is selected', () => {
      component.citiesControl.setValue([{ zipCode: 1000 }]);
      component.queryControl.setValue('');
      component.queryControl.updateValueAndValidity();

      expect(component.queryControl.valid).toBe(true);
    });
  });

  describe('search', () => {
    it('should not emit searchCriteria when form is invalid', () => {
      const emitSpy = jest.spyOn(component.searchCriteria, 'emit');
      component.citiesControl.setValue([]);
      component.queryControl.setValue('');

      component.search();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit query and zipCodes when form is valid', () => {
      const emitSpy = jest.spyOn(component.searchCriteria, 'emit');

      const mockCities = [{ zipCode: 1000 }, { zipCode: 2000 }];

      component.queryControl.setValue('Janssens');
      component.citiesControl.setValue(mockCities);

      component.search();

      expect(emitSpy).toHaveBeenCalledWith({
        query: 'Janssens',
        cities: mockCities,
      });
    });
  });

  describe('onInput / updateQueryTypeAndValidators', () => {
    const createInputEvent = (value: string): Event => ({ target: { value } }) as unknown as Event;

    it('should sanitize hyphens from numeric input', () => {
      component.onInput(createInputEvent('123-456-789'));

      expect(component.queryControl.value).toBe('123456789');
      expect(component.queryIsNumeric).toBe(true);
    });

    it('should remove name validators for numeric input and restore them for text input', () => {
      component.onInput(createInputEvent('12345'));
      expect(component.queryIsNumeric).toBe(true);

      component.queryControl.updateValueAndValidity();
      const validWhileNumeric = component.queryControl.valid;

      component.onInput(createInputEvent('AB'));
      expect(component.queryIsNumeric).toBe(false);

      component.queryControl.updateValueAndValidity();
      const validAfterSwitch = component.queryControl.valid;

      expect(validWhileNumeric).not.toEqual(validAfterSwitch);
    });
  });
});
