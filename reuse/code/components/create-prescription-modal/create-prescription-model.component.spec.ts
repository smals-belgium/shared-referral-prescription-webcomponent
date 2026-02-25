import { signal, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PrescriptionModelState } from '@reuse/code/states/helpers/prescriptionModel.state';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CreatePrescriptionModelComponent } from '@reuse/code/components/create-prescription-modal/create-prescription-model.component';
import { of, throwError } from 'rxjs';
import { PrescriptionModelService } from '@reuse/code/services/api/prescriptionModel.service';
import { LoadingStatus, PrescriptionModelStatus } from '@reuse/code/interfaces';
import { UniqueModelNameValidator } from '@reuse/code/directives/unique-model-name.directive';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';

describe('CreatePrescriptionModelComponent', () => {
  let component: CreatePrescriptionModelComponent;
  let fixture: ComponentFixture<CreatePrescriptionModelComponent>;
  let mockModelState: PrescriptionModelState;
  let mockPrescriptionModelService: Partial<PrescriptionModelService>;
  let mockNameValidator: Partial<UniqueModelNameValidator>;
  let translate: TranslateService;
  let mockTemplateNamePipe: Partial<TemplateNamePipe>;

  beforeEach(async () => {
    mockModelState = {
      modalStates: signal<PrescriptionModelStatus[]>([
        {
          state: LoadingStatus.INITIAL,
          error: undefined,
          success: undefined,
          prescriptionTrackById: 0,
        },
      ]),
      setInitialState: jest.fn(),
      setModalState: jest.fn(),
      getModalState: jest.fn(),
      resetAll: jest.fn(),
    };

    mockPrescriptionModelService = {
      updateModel: jest.fn().mockReturnValue(of({})),
      createModel: jest.fn().mockReturnValue(of({ id: '123' })),
    };
    mockNameValidator = {
      validate: jest.fn(() => of(null)),
    };

    mockTemplateNamePipe = {
      transform: jest.fn().mockReturnValue(''),
    };

    await TestBed.configureTestingModule({
      imports: [CreatePrescriptionModelComponent, TranslateModule.forRoot()],
      providers: [
        { provide: PrescriptionModelState, useValue: mockModelState },
        { provide: PrescriptionModelService, useValue: mockPrescriptionModelService },
        { provide: UniqueModelNameValidator, useValue: mockNameValidator },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(CreatePrescriptionModelComponent, {
        set: {
          providers: [{ provide: TemplateNamePipe, useValue: mockTemplateNamePipe }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CreatePrescriptionModelComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('prescriptionTrackById', 0);
    fixture.componentRef.setInput('template', {});
    fixture.componentRef.setInput('templateCode', 'TEST_TEMPLATECODE');
    fixture.componentRef.setInput('responses', {});
    fixture.componentRef.setInput('disabled', true);

    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('nl-BE');
    translate.use('nl-BE');

    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should create form with a required name control', () => {
      const nameControl = component.formGroup.controls.name;
      nameControl.enable();
      nameControl.setValue('');
      nameControl.updateValueAndValidity();

      expect(nameControl.hasError('required')).toBe(true);
    });

    it('should initialise name control as disabled when disabled input is true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      expect(component.formGroup.controls.name.disabled).toBe(true);
    });
  });

  describe('effect', () => {
    it('should set name from templateNamePipe when templateCode changes', () => {
      mockTemplateNamePipe.transform = jest.fn().mockReturnValue('Generated Name');
      fixture.componentRef.setInput('templateCode', 'TPL_02');
      fixture.detectChanges();

      expect(component.formGroup.controls.name.value).toBe('Generated Name');
    });

    it('should not overwrite name when pipe returns false', () => {
      component.formGroup.controls.name.setValue('Existing');
      mockTemplateNamePipe.transform = jest.fn().mockReturnValue('');
      fixture.componentRef.setInput('templateCode', 'TPL_03');
      fixture.detectChanges();

      expect(component.formGroup.controls.name.value).toBe('Existing');
    });
  });

  describe('ngOnChanges', () => {
    it('should disable name control when disabled changes to true', () => {
      fixture.componentRef.setInput('disabled', true);
      component.ngOnChanges({
        disabled: new SimpleChange(false, true, false),
      });

      expect(component.formGroup.controls.name.disabled).toBe(true);
    });

    it('should enable name control when disabled changes to false', () => {
      component.formGroup.controls.name.disable();
      fixture.componentRef.setInput('disabled', false);
      component.ngOnChanges({
        disabled: new SimpleChange(true, false, false),
      });

      expect(component.formGroup.controls.name.enabled).toBe(true);
    });
  });

  describe('getModelState', () => {
    it('should delegate to prescriptionModelState with trackById', () => {
      const state = {
        prescriptionTrackById: 0,
        state: LoadingStatus.INITIAL,
      };
      mockModelState.getModalState = jest.fn().mockReturnValue(state);
      const result = component.getModelState();

      expect(mockModelState.getModalState).toHaveBeenCalledWith(0);
      expect(result).toBe(state);
    });
  });

  describe('createPrescriptionModel', () => {
    it('should not call service when form is invalid', () => {
      const nameControl = component.formGroup.controls.name;
      nameControl.enable();
      nameControl.setValue('');
      nameControl.updateValueAndValidity();
      component.createPrescriptionModel();

      expect(mockPrescriptionModelService.createModel).not.toHaveBeenCalled();
    });

    it('should call service and emit id on success', () => {
      const emitSpy = jest.spyOn(component.modelSaved, 'emit');
      mockPrescriptionModelService.createModel = jest.fn().mockReturnValue(of({ id: 'abc-123' }));
      const nameControl = component.formGroup.controls.name;
      nameControl.enable();
      nameControl.setValue('My Model');
      nameControl.updateValueAndValidity();

      component.createPrescriptionModel();

      expect(mockModelState.setModalState).toHaveBeenCalledWith(0, LoadingStatus.LOADING);
      expect(mockPrescriptionModelService.createModel).toHaveBeenCalledWith({
        name: 'My Model',
        templateCode: 'TEST_TEMPLATECODE',
        responses: {},
      });
      expect(mockModelState.setModalState).toHaveBeenCalledWith(0, LoadingStatus.SUCCESS, 'My Model');
      expect(emitSpy).toHaveBeenCalledWith('abc-123');
    });

    it('should set error state and emit undefined on failure', () => {
      const error = new HttpErrorResponse({ status: 500 });
      const emitSpy = jest.spyOn(component.modelSaved, 'emit');
      mockPrescriptionModelService.createModel = jest.fn().mockReturnValue(throwError(() => error));
      const nameControl = component.formGroup.controls.name;
      nameControl.enable();
      nameControl.setValue('My Model');
      nameControl.updateValueAndValidity();

      component.createPrescriptionModel();

      expect(mockModelState.setModalState).toHaveBeenCalledWith(0, LoadingStatus.ERROR, undefined, error);
      expect(emitSpy).toHaveBeenCalledWith(undefined);
    });
  });

  describe('formValuesToModel', () => {
    it('should filter out freeText fields from responses', () => {
      fixture.componentRef.setInput('responses', {
        field1: 'keep',
        freeTextField: 'remove me',
      });

      fixture.componentRef.setInput('template', {
        elements: [{ id: 'field1' }, { id: 'freeTextField', tags: ['freeText'] }],
      });
      fixture.detectChanges();
      mockPrescriptionModelService.createModel = jest.fn().mockReturnValue(of({ id: '1' }));
      const nameControl = component.formGroup.controls.name;
      nameControl.enable();
      nameControl.setValue('Test');
      nameControl.updateValueAndValidity();

      component.createPrescriptionModel();

      expect(mockPrescriptionModelService.createModel).toHaveBeenCalledWith({
        name: 'Test',
        responses: {
          field1: 'keep',
        },
        templateCode: 'TEST_TEMPLATECODE',
      });
    });

    it('should filter out date-type fields from responses', () => {
      fixture.componentRef.setInput('responses', {
        field1: 'keep',
        dateField: '2025-01-01',
      });

      fixture.componentRef.setInput('template', {
        elements: [{ id: 'field1' }, { id: 'dateField', dataType: { type: 'DATE' } }],
      });

      fixture.detectChanges();
      mockPrescriptionModelService.createModel = jest.fn().mockReturnValue(of({ id: '1' }));
      const nameControl = component.formGroup.controls.name;
      nameControl.enable();
      nameControl.setValue('Test');
      nameControl.updateValueAndValidity();

      component.createPrescriptionModel();

      expect(mockPrescriptionModelService.createModel).toHaveBeenCalledWith({
        name: 'Test',
        responses: {
          field1: 'keep',
        },
        templateCode: 'TEST_TEMPLATECODE',
      });
    });
  });
});
