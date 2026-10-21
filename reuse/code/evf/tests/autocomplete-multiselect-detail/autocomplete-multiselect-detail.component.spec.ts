import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AutocompleteMultiselectDetailComponent } from '@reuse/code/evf/components/autocomplete-multiselect/detail/autocomplete-multiselect-detail.component';
import { EvfTranslateService } from '@smals-belgium-shared/vas-evaluation-form-ui-core';

describe('AutocompleteMultiselectDetailComponent', () => {
  let fixture: ComponentFixture<AutocompleteMultiselectDetailComponent>;
  let component: AutocompleteMultiselectDetailComponent;

  const setElementControl = (elementControl: Record<string, unknown>) => {
    Object.defineProperty(component, 'elementControl', {
      configurable: true,
      get: () => elementControl,
    });
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutocompleteMultiselectDetailComponent],
      providers: [
        {
          provide: EvfTranslateService,
          useValue: {
            currentLang: 'en',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AutocompleteMultiselectDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the current language from the translate service', () => {
    expect(component.currentLang).toBe('en');
  });

  it('exposes the element and id from the elementControl', () => {
    const element = { id: 'autocomplete-multiselect', labelTranslationId: 'autocomplete-multiselect-label' };
    setElementControl({ element });

    expect(component.element).toEqual(element);
    expect(component.id).toBe('autocomplete-multiselect');
  });
});
