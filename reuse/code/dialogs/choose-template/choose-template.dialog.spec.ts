import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Component, Input, signal } from '@angular/core';
import { ChooseTemplateDialog } from './choose-template.dialog';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { TemplatesState } from '@reuse/code/states/api/templates.state';
import { ModelsState } from '@reuse/code/states/api/models.state';
import { DataState, Intent, LoadingStatus } from '@reuse/code/interfaces';
import { AccessMatrix, ModelEntityDto, PageModelEntityDto, Template } from '@reuse/code/openapi';
import { SelectPrescriptionTypeComponent } from '@reuse/code/components/select-prescription-type/select-prescription-type.component';
import { Lang } from '@reuse/code/constants/languages';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { NEVER, Observable, of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

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
  const mockAuthService = { isOrganization: jest.fn() };

  const createDialog = (isOrganization$: Observable<boolean>) => {
    mockModelsState.loadModels.mockClear();

    mockAuthService.isOrganization.mockReturnValue(isOrganization$);
    const dialogFixture = TestBed.createComponent(ChooseTemplateDialog);
    dialogFixture.detectChanges();
    return dialogFixture;
  };

  const getModelsInput = (dialogFixture: ComponentFixture<ChooseTemplateDialog>) =>
    dialogFixture.debugElement.query(By.directive(MockSelectPrescriptionTypeComponent))?.componentInstance.models as
      ModelEntityDto[] | undefined;

  beforeEach(async () => {
    mockModelsState.state.set({ data: { content: [] }, status: LoadingStatus.SUCCESS, error: undefined });
    mockDialogRef.close.mockClear();

    await TestBed.configureTestingModule({
      imports: [
        ChooseTemplateDialog,
        NoopAnimationsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot({ defaultLanguage: Lang.FR.short }),
      ],
      providers: [
        { provide: AccessMatrixState, useValue: mockAccessMatrixState },
        { provide: TemplatesState, useValue: mockTemplatesState },
        { provide: ModelsState, useValue: mockModelsState },
        { provide: AuthService, useValue: mockAuthService },
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

    fixture = createDialog(of(false));
    component = fixture.componentInstance;
  });

  it('should load models and show the model field for non-organizations', () => {
    expect(mockModelsState.loadModels).toHaveBeenCalledWith(0, -1);
    expect(getModelsInput(fixture)).toEqual([]);
  });

  it('should show templates without loading models nor the model field for an organization', () => {
    const organizationFixture = createDialog(of(true));

    expect(mockModelsState.loadModels).not.toHaveBeenCalled();
    expect(organizationFixture.componentInstance.viewState$().status).toBe(LoadingStatus.SUCCESS);
    expect(organizationFixture.componentInstance.viewState$().data?.templates).toHaveLength(1);
    expect(getModelsInput(organizationFixture)).toBeUndefined();

    organizationFixture.destroy();
  });

  it('should show a spinner while the organization check is pending', () => {
    const pendingFixture = createDialog(NEVER);

    expect(pendingFixture.componentInstance.viewState$().status).toBe(LoadingStatus.LOADING);
    expect(mockModelsState.loadModels).not.toHaveBeenCalled();

    pendingFixture.destroy();
  });

  it('should fall back to loading models when the organization check fails', () => {
    const errorFixture = createDialog(throwError(() => new Error('auth error')));

    expect(mockModelsState.loadModels).toHaveBeenCalledWith(0, -1);
    expect(getModelsInput(errorFixture)).toEqual([]);

    errorFixture.destroy();
  });

  it('should ignore the models state and skip the organization check for a proposal', () => {
    mockDialogData.intent = Intent.PROPOSAL;
    mockAuthService.isOrganization.mockClear();
    mockModelsState.state.set({ status: LoadingStatus.LOADING });
    try {
      const proposalFixture = createDialog(NEVER);

      expect(mockAuthService.isOrganization).not.toHaveBeenCalled();
      expect(mockModelsState.loadModels).not.toHaveBeenCalled();
      expect(proposalFixture.componentInstance.viewState$().status).toBe(LoadingStatus.SUCCESS);
      expect(proposalFixture.componentInstance.viewState$().data?.templates?.map(t => t.code)).toEqual(['TPL_002']);
      expect(getModelsInput(proposalFixture)).toBeUndefined();

      proposalFixture.destroy();
    } finally {
      mockDialogData.intent = Intent.ORDER;
    }
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
