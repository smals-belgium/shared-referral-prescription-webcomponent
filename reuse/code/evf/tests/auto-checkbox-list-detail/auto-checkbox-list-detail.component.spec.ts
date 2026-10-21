import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AutoCheckboxListDetailComponent as DetailComponent } from '@reuse/code/evf/components/auto-checkbox-list/detail/auto-checkbox-list-detail.component';
import { AutoCheckboxListDetailComponent as Wrapper } from '@reuse/code/evf/tests/auto-checkbox-list-detail/auto-checkbox-list-detail.component';
import {
  evfElementConfigFeature,
  FormTemplate,
  provideEvfCore,
} from '@smals-belgium-shared/vas-evaluation-form-ui-core';

const formTemplate: FormTemplate = {
  elements: [
    {
      id: 'auto-checkbox-list',
      viewType: 'autoCheckboxList',
      dataType: {
        type: 'array',
        items: { type: 'string' },
      },
      labelTranslationId: 'auto-checkbox-list-label',
    },
  ],
  translations: {
    'auto-checkbox-list-label': {
      fr: 'Auto checkbox list',
      nl: 'Auto checkbox list',
    },
  },
};

describe('AutoCheckboxListDetailComponent', () => {
  let wrapperFixture: ComponentFixture<Wrapper>;
  let wrapperComponent: Wrapper;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Wrapper],
      providers: [
        provideEvfCore(
          evfElementConfigFeature({
            name: 'autoCheckboxList',
            detail: DetailComponent,
          })
        ),
      ],
    }).compileComponents();

    wrapperFixture = TestBed.createComponent(Wrapper);
    wrapperComponent = wrapperFixture.componentInstance;
  });

  it('should create wrapper component', () => {
    wrapperFixture.detectChanges();

    expect(wrapperComponent).toBeTruthy();
  });

  it('should accept a demo template input', () => {
    wrapperFixture.componentRef.setInput('demoTemplate', formTemplate);

    expect(wrapperComponent.demoTemplate).toEqual(formTemplate);
  });

  it('renders the checkbox list values through the detail component', () => {
    wrapperFixture.componentRef.setInput('demoTemplate', formTemplate);
    wrapperFixture.componentRef.setInput('responses', { 'auto-checkbox-list': ['Value A', 'Value B'] });
    wrapperFixture.detectChanges();

    const detailDebugElement = wrapperFixture.debugElement.query(By.directive(DetailComponent));

    expect(detailDebugElement).toBeTruthy();
    expect((detailDebugElement.nativeElement as HTMLElement).textContent).toContain('Value A');
    expect((detailDebugElement.nativeElement as HTMLElement).textContent).toContain('Value B');
  });
});
