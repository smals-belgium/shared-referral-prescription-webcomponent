import { EvfTextareaComponent } from './evf-textarea.component';
import { SimpleChange } from '@angular/core';
import { ElementGroup, FormElement } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('EvfTextareaComponent', () => {
  let component: EvfTextareaComponent;
  let elementGroup: ElementGroup;
  let fixture: ComponentFixture<EvfTextareaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EvfTextareaComponent],
    });

    fixture = TestBed.createComponent(EvfTextareaComponent);
    component = fixture.componentInstance;
    const element: FormElement = {
      id: 'question1',
      viewType: 'textarea',
      dataType: { type: 'string' },
      validations: [{ name: 'maxLength', maxLength: 100 }],
    };
    elementGroup = new ElementGroup([element], {});
    component.elementControl = elementGroup.get('question1');
    component.ngOnChanges({ elementControl: new SimpleChange(null, null, false) });
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger change detection', () => {
    const markForCheckSpy = jest.spyOn(EvfTextareaComponent.prototype as any, 'markForCheck');

    component.ngOnChanges({
      submitted: new SimpleChange(null, null, false),
    });

    expect(markForCheckSpy).toHaveBeenCalled();
  });
});
