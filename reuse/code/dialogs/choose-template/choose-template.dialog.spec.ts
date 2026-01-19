import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { signal, Component, input, Input } from '@angular/core';
import { ChooseTemplateDialog } from './choose-template.dialog';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { ModelsState } from '@reuse/code/states/api/models.state';
import { Intent, DataState, LoadingStatus } from '@reuse/code/interfaces';
import { AccessMatrix, Template, ModelEntityDto, PageModelEntityDto } from '@reuse/code/openapi';
import { SelectPrescriptionTypeComponent } from '@reuse/code/components/select-prescription-type/select-prescription-type.component';

/**
 * Mock du composant enfant
 */
@Component({
  selector: 'app-select-prescription-type',
  template: '',
  standalone: true,
})
class MockSelectPrescriptionTypeComponent {
  @Input() formGroup!: FormGroup;
  @Input() templates!: Template[];
  @Input() models?: ModelEntityDto[];
  @Input() showTitle = true;
}

describe('ChooseTemplateDialog', () => {
  let component: ChooseTemplateDialog;
  let fixture: ComponentFixture<ChooseTemplateDialog>;

  const mockAccessMatrixState = {
    state: signal<DataState<AccessMatrix[]>>({
      data: [
        { templateName: 'TPL_001', createPrescription: true, createProposal: false },
        { templateName: 'TPL_002', createPrescription: false, createProposal: true },
      ],
      status: LoadingStatus.SUCCESS,
      error: undefined,
    }),
  };

  const mockTemplatesState = {
    state: signal<DataState<Template[]>>({
      data: [
        { id: 1000, code: 'TPL_001', label: 'Template 1' },
        { id: 1001, code: 'TPL_002', label: 'Template 2' },
      ],
      status: LoadingStatus.SUCCESS,
      error: undefined,
    }),
  };

  const mockModelsState = {
    state: signal<DataState<PageModelEntityDto>>({
      data: { content: [] },
      status: LoadingStatus.SUCCESS,
      error: undefined,
    }),
    loadModels: jest.fn(),
  };

  const mockDialogRef = { close: jest.fn() };
  const mockDialogData = { intent: Intent.ORDER };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ChooseTemplateDialog,
        NoopAnimationsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot({ defaultLanguage: 'fr' }),
      ],
      providers: [
        { provide: AccessMatrixState, useValue: mockAccessMatrixState },
        { provide: TemplatesState, useValue: mockTemplatesState },
        { provide: ModelsState, useValue: mockModelsState },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    })
      .overrideComponent(ChooseTemplateDialog, {
        remove: {
          imports: [SelectPrescriptionTypeComponent],
        },
        add: {
          imports: [MockSelectPrescriptionTypeComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ChooseTemplateDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load models on init for ORDER intent', () => {
    component.ngOnInit();
    expect(mockModelsState.loadModels).toHaveBeenCalledWith(0, -1);
  });

  it('should submit with template code', () => {
    const template: Template = { id: 1000, code: 'TPL_001', label: 'Template 1' };
    component.formGroup.patchValue({ template });
    component.submit();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      templateCode: 'TPL_001',
      model: null,
    });
  });

  it('should not submit invalid form', () => {
    component.formGroup.patchValue({ template: null, model: null });
    component.submit();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should submit with model', () => {
    const model: ModelEntityDto = { id: 1000, label: 'Model 1', templateId: 1001 };
    component.formGroup.patchValue({ model });
    component.submit();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
