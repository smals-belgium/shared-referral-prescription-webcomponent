import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { CreatePrescriptionModelComponent } from './create-prescription-model.component';
import { Component, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { PrescriptionModelState } from '@reuse/code/states/helpers/prescriptionModel.state';
import { CreatePrescriptionForm, DataState, LoadingStatus, PrescriptionModelStatus } from '@reuse/code/interfaces';
import { ElementGroup } from '@smals-belgium-shared/vas-evaluation-form-ui-core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormDataType, FormElement, TemplateVersion } from '@reuse/code/openapi';
import { PrescriptionModelService } from '@reuse/code/services/api/prescriptionModel.service';
import { UniqueModelNameValidator } from '@reuse/code/directives/unique-model-name.directive';
import { ReactiveFormsModule } from '@angular/forms';
import { EvfFormWebComponent } from '../evf-form/evf-form.component';
import TypeEnum = FormDataType.TypeEnum;
import { Lang } from '@reuse/code/constants/languages';

@Component({
  selector: 'evf-form',
  template: '',
  standalone: true,
})
class MockEvfFormComponent {}

describe('CreatePrescriptionModelComponent', () => {
  let component: CreatePrescriptionModelComponent;
  let fixture: ComponentFixture<CreatePrescriptionModelComponent>;
  let mockModelState: PrescriptionModelState;
  let mockPrescriptionModelService: Partial<PrescriptionModelService>;
  let mockNameValidator: Partial<UniqueModelNameValidator>;
  let translate: TranslateService;

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
      validate: jest.fn().mockReturnValue(of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [
        CreatePrescriptionModelComponent,
        TranslateModule.forRoot(),
        MatIconModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
      ],
      providers: [
        { provide: PrescriptionModelState, useValue: mockModelState },
        { provide: PrescriptionModelService, useValue: mockPrescriptionModelService },
        { provide: UniqueModelNameValidator, useValue: mockNameValidator },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(CreatePrescriptionModelComponent, {
        remove: { imports: [EvfFormWebComponent] },
        add: { imports: [MockEvfFormComponent] },
      })
      .compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang(Lang.NL.full);
    translate.use(Lang.NL.full);

    fixture = TestBed.createComponent(CreatePrescriptionModelComponent);
    component = fixture.componentInstance;
    component.lang = Lang.NL.full;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should not render wrapper when prescriptionForm is undefined', () => {
      component.prescriptionForm = undefined as any;
      fixture.detectChanges();

      const wrapper = fixture.debugElement.query(By.css('.wrapper'));
      expect(wrapper).toBeFalsy();
    });

    it('should render wrapper when prescriptionForm is provided', () => {
      component.prescriptionForm = createMockPrescriptionForm();
      fixture.detectChanges();

      const wrapper = fixture.debugElement.query(By.css('.wrapper'));
      expect(wrapper).toBeTruthy();
    });
  });

  describe('Template Display', () => {
    it('should display template name from prescriptionForm', () => {
      component.prescriptionForm = createMockPrescriptionForm();
      fixture.detectChanges();

      const templateLabel = fixture.debugElement.query(By.css('[data-cy="template-label"]'));
      expect(templateLabel).toBeTruthy();
    });

    it('should show check_circle icon when status is SUCCESS', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        status: LoadingStatus.SUCCESS,
      });
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.css('mat-icon[color="accent"]'));
      expect(icon).toBeTruthy();
      expect(icon.nativeElement.textContent.trim()).toBe('check_circle');
    });

    it('should show error icon when status is ERROR', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        status: LoadingStatus.ERROR,
      });
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.css('mat-icon[color="warn"]'));
      expect(icon).toBeTruthy();
      expect(icon.nativeElement.textContent.trim()).toBe('error');
    });

    it('should apply invalid class when submitted and elementGroup is invalid', () => {
      const mockElementGroup = createMockElementGroup({ valid: false });

      component.prescriptionForm = createMockPrescriptionForm({
        submitted: true,
        elementGroup: mockElementGroup,
        status: LoadingStatus.INITIAL,
      });
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('[data-cy="template-label"]'));
      expect(header.nativeElement.classList).toContain('invalid');
    });

    it('should apply invalid class when submitted and status is ERROR', () => {
      const mockElementGroup = createMockElementGroup({ valid: true });

      component.prescriptionForm = createMockPrescriptionForm({
        submitted: true,
        elementGroup: mockElementGroup,
        status: LoadingStatus.ERROR,
      });
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('[data-cy="template-label"]'));
      expect(header.nativeElement.classList).toContain('invalid');
    });

    it('should not apply invalid class when not submitted', () => {
      const mockElementGroup = createMockElementGroup({ valid: false });

      component.prescriptionForm = createMockPrescriptionForm({
        submitted: false,
        elementGroup: mockElementGroup,
      });
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('[data-cy="template-label"]'));
      expect(header.nativeElement.classList).not.toContain('invalid');
    });
  });

  describe('Model State Alerts', () => {
    it('should show error alert when modelState is ERROR', () => {
      mockModelState.getModalState = jest.fn().mockReturnValue({
        state: LoadingStatus.ERROR,
        error: new HttpErrorResponse({ error: 'Test error', status: 500 }),
        prescriptionTrackById: 0,
      });

      component.prescriptionForm = createMockPrescriptionForm();

      fixture.detectChanges();

      const alerts = fixture.debugElement.queryAll(By.css('app-alert'));

      const errorAlert = alerts.find(alert =>
        alert.nativeElement.textContent.includes('prescription.errors.failedToCreateModel')
      );
      expect(errorAlert).toBeTruthy();
    });

    it('should show success alert when modelState is SUCCESS', () => {
      mockModelState.getModalState = jest.fn().mockReturnValue({
        state: LoadingStatus.SUCCESS,
        success: 'Test Model Name',
        prescriptionTrackById: 0,
      });
      component.prescriptionForm = createMockPrescriptionForm();
      fixture.detectChanges();

      const alerts = fixture.debugElement.queryAll(By.css('app-alert'));
      const successAlert = alerts.find(alert => alert.componentInstance.alert === 'success');
      expect(successAlert).toBeTruthy();
      expect(successAlert?.componentInstance.message).toBe('prescription.model.create.success');
    });

    it('should show spinner when modelState is LOADING', () => {
      mockModelState.getModalState = jest.fn().mockReturnValue({
        state: LoadingStatus.LOADING,
        prescriptionTrackById: 0,
      });
      component.prescriptionForm = createMockPrescriptionForm();
      fixture.detectChanges();

      const spinners = fixture.debugElement.queryAll(By.css('app-overlay-spinner'));
      expect(spinners.length).toBeGreaterThan(0);
    });

    it('should not show alerts when modelState is INITIAL', () => {
      mockModelState.modalStates.set([
        {
          state: LoadingStatus.INITIAL,
          prescriptionTrackById: 0,
        },
      ]);
      component.prescriptionForm = createMockPrescriptionForm();
      fixture.detectChanges();

      const alerts = fixture.debugElement.queryAll(By.css('app-alert'));
      expect(alerts.length).toBe(0);
    });
  });

  describe('Form Template State', () => {
    it('should show spinner when formTemplateState is LOADING', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        formTemplateState$: signal(
          createMockDataState({
            status: LoadingStatus.LOADING,
          })
        ),
      });
      fixture.detectChanges();

      const spinners = fixture.debugElement.queryAll(By.css('app-overlay-spinner'));
      expect(spinners.length).toBe(1);
    });

    it('should show spinner when formTemplateState is UPDATING', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        formTemplateState$: signal(
          createMockDataState({
            status: LoadingStatus.UPDATING,
          })
        ),
      });
      fixture.detectChanges();

      const spinners = fixture.debugElement.queryAll(By.css('app-overlay-spinner'));
      expect(spinners.length).toBe(1);
    });

    it('should show error message when formTemplateState is ERROR', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        formTemplateState$: signal(
          createMockDataState({
            status: LoadingStatus.ERROR,
          })
        ),
      });
      fixture.detectChanges();

      // const errorDiv = fixture.nativeElement.textContent;
      // expect(errorDiv).toContain('Failed to load prescription form template');

      //prescription.errors.failedToLoadTemplate

      const alerts = fixture.debugElement.queryAll(By.css('app-alert'));

      const errorAlert = alerts.find(alert =>
        alert.nativeElement.textContent.includes('prescription.errors.failedToLoadTemplate')
      );
      expect(errorAlert).toBeTruthy();
    });

    it('should render evf-form when formTemplateState is SUCCESS', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        formTemplateState$: signal(
          createMockDataState({
            status: LoadingStatus.SUCCESS,
            data: createMockTemplateVersion(),
          })
        ),
      });
      fixture.detectChanges();

      const evfForm = fixture.debugElement.query(By.css('evf-form'));
      expect(evfForm).toBeTruthy();
    });
  });

  describe('Model Name Input (Edit Mode)', () => {
    it('should display model name input when modelId exists', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        modelName: 'Test Model',
        formTemplateState$: signal(
          createMockDataState({
            status: LoadingStatus.SUCCESS,
            data: createMockTemplateVersion(),
          })
        ),
      });

      component.ngOnChanges({
        prescriptionForm: {
          currentValue: component.prescriptionForm,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('[data-cy="prescription-modal-dialog-input"]'));
      expect(input).toBeTruthy();
      expect(component.titleControl.value).toBe('Test Model');
    });

    it('should show required error when title is empty', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        formTemplateState$: signal(
          createMockDataState({
            status: LoadingStatus.SUCCESS,
            data: createMockTemplateVersion(),
          })
        ),
      });

      component.ngOnChanges({
        prescriptionForm: {
          currentValue: component.prescriptionForm,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      component.titleControl.setValue('');
      component.titleControl.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('mat-error'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain('common.mandatory');
    });

    it('should show unique name error when name is not unique', fakeAsync(() => {
      mockNameValidator.validate = jest.fn().mockReturnValue(of({ uniqueName: true }));

      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        modelName: 'Some Other Name',
        formTemplateState$: signal(
          createMockDataState({
            status: LoadingStatus.SUCCESS,
            data: createMockTemplateVersion(),
          })
        ),
      });

      component.ngOnChanges({
        prescriptionForm: {
          currentValue: component.prescriptionForm,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      component.titleControl.setValue('Duplicate Name');
      component.titleControl.markAsTouched();

      tick(100);
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('mat-error'));
      expect(errorElement).toBeTruthy();
    }));

    it('should set originalName signal on ngOnChanges', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        modelName: 'Original Name',
      });

      component.ngOnChanges({
        prescriptionForm: {
          currentValue: component.prescriptionForm,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.originalName()).toBe('Original Name');
    });

    it('should mark titleControl as touched on ngOnChanges', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        modelName: 'Test',
      });

      component.ngOnChanges({
        prescriptionForm: {
          currentValue: component.prescriptionForm,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.titleControl.touched).toBe(true);
    });

    it('should handle empty modelName in ngOnChanges', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        modelName: undefined,
      });

      component.ngOnChanges({
        prescriptionForm: {
          currentValue: component.prescriptionForm,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.titleControl.value).toBe('');
      expect(component.originalName()).toBe('');
    });
  });

  describe('Buttons (Create vs Update)', () => {
    it('should show create button when modelId does not exist', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        modelId: undefined,
        formTemplateState$: signal(
          createMockDataState({
            status: LoadingStatus.SUCCESS,
            data: createMockTemplateVersion(),
          })
        ),
      });
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const createButton = buttons.find(btn => btn.nativeElement.textContent.includes('save'));
      expect(createButton).toBeTruthy();
    });

    it('should show update button when modelId exists', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        formTemplateState$: signal(
          createMockDataState({
            status: LoadingStatus.SUCCESS,
            data: createMockTemplateVersion(),
          })
        ),
      });
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const updateButton = buttons.find(btn => btn.nativeElement.textContent.includes('update'));
      expect(updateButton).toBeTruthy();
    });

    it('should not show both create and update buttons simultaneously', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        formTemplateState$: signal(
          createMockDataState({
            status: LoadingStatus.SUCCESS,
            data: createMockTemplateVersion(),
          })
        ),
      });
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const createButton = buttons.find(btn => btn.nativeElement.textContent.includes('save'));
      const updateButton = buttons.find(btn => btn.nativeElement.textContent.includes('update'));

      expect(createButton).toBeFalsy();
      expect(updateButton).toBeTruthy();
    });
  });

  describe('mapResponsesToRepeatObject', () => {
    it('should map repeat object correctly with count and when array', () => {
      const responses = {
        occurrenceTiming: {
          repeat: {
            count: 3,
            when: ['AM'],
            frequency: 1,
            period: 1,
          },
        },
      };

      const result = component.mapResponsesToRepeatObject(responses);
      expect(result['nbSessions']).toBe(3);
      expect(result['dayPeriod']).toBe('AM');
      expect(result['frequency']).toBe(1);
      expect(result['period']).toBe(1);
    });

    it('should handle when as single value', () => {
      const responses = {
        occurrenceTiming: {
          repeat: {
            count: 2,
            when: 'PM',
          },
        },
      };

      const result = component.mapResponsesToRepeatObject(responses);
      expect(result['dayPeriod']).toBe('PM');
      expect(result['nbSessions']).toBe(2);
    });

    it('should handle when as array with multiple values', () => {
      const responses = {
        occurrenceTiming: {
          repeat: {
            count: 2,
            when: ['PM', 'AM', 'NIGHT'],
          },
        },
      };

      const result = component.mapResponsesToRepeatObject(responses);
      expect(result['dayPeriod']).toBe('PM'); // Takes first element
    });

    it('should return responses unchanged if no occurrenceTiming', () => {
      const responses = { someField: 'value', anotherField: 123 };
      const result = component.mapResponsesToRepeatObject(responses);
      expect(result).toEqual(responses);
    });

    it('should return responses unchanged if occurrenceTiming is not valid', () => {
      const responses = {
        occurrenceTiming: 'invalid',
      };
      const result = component.mapResponsesToRepeatObject(responses);
      expect(result).toEqual(responses);
    });

    it('should return responses unchanged if no repeat', () => {
      const responses = {
        occurrenceTiming: {
          someOtherField: 'value',
        },
      };
      const result = component.mapResponsesToRepeatObject(responses);
      expect(result).toEqual(responses);
    });

    it('should handle repeat without count', () => {
      const responses = {
        occurrenceTiming: {
          repeat: {
            frequency: 1,
            period: 2,
          },
        },
      };

      const result = component.mapResponsesToRepeatObject(responses);
      expect(result['frequency']).toBe(1);
      expect(result['period']).toBe(2);
      expect(result['nbSessions']).toBeUndefined();
    });

    it('should return undefined responses unchanged', () => {
      const result = component.mapResponsesToRepeatObject(undefined as any);
      expect(result).toBeUndefined();
    });

    it('should return null responses unchanged', () => {
      const result = component.mapResponsesToRepeatObject(null as any);
      expect(result).toBeNull();
    });
  });

  describe('setElementGroup', () => {
    it('should set elementGroup and merge with modelResponses', () => {
      const setValue = jest.fn();
      const mockElementGroup = createMockElementGroup({
        setValue,
        getOutputValue: () => ({ foo: 'bar' }),
      });

      const mockForm = createMockPrescriptionForm({
        elementGroup: undefined,
        modelResponses: { a: 1, b: null, c: 'test' },
      });

      component.setElementGroup(mockForm, mockElementGroup);

      expect(mockForm.elementGroup).toBe(mockElementGroup);
      expect(setValue).toHaveBeenCalledWith(
        expect.objectContaining({
          a: 1,
          c: 'test',
          foo: 'bar',
        })
      );
    });

    it('should apply mapResponsesToRepeatObject transformation', () => {
      const setValue = jest.fn();
      const mockElementGroup = createMockElementGroup({
        setValue,
        getOutputValue: () => ({}),
      });

      const mockForm = createMockPrescriptionForm({
        modelResponses: {
          occurrenceTiming: {
            repeat: {
              count: 5,
              when: ['AM'],
            },
          },
        },
      });

      component.setElementGroup(mockForm, mockElementGroup);

      expect(setValue).toHaveBeenCalledWith(
        expect.objectContaining({
          nbSessions: 5,
          dayPeriod: 'AM',
        })
      );
    });

    it('should remove null values from modelResponses', () => {
      const setValue = jest.fn();
      const mockElementGroup = createMockElementGroup({
        setValue,
        getOutputValue: () => ({}),
      });

      const mockForm = createMockPrescriptionForm({
        modelResponses: {
          field1: 'value1',
          field2: null,
          field3: 'value3',
          field4: null,
        },
      });

      component.setElementGroup(mockForm, mockElementGroup);

      const callArg = setValue.mock.calls[0][0];
      expect(callArg).toHaveProperty('field1', 'value1');
      expect(callArg).toHaveProperty('field3', 'value3');
      expect(callArg).not.toHaveProperty('field2');
      expect(callArg).not.toHaveProperty('field4');
    });
  });

  describe('getResponses', () => {
    it('should merge modelResponses with elementGroup output', () => {
      const mockElementGroup = createMockElementGroup({
        getOutputValue: () => ({ field1: 'new value', field3: 'another value' }),
      });

      const mockForm = createMockPrescriptionForm({
        modelResponses: { field2: 'old value', field4: 'more data' },
        elementGroup: mockElementGroup,
      });

      const result = component.getResponses(mockForm);

      expect(result).toEqual({
        field2: 'old value',
        field4: 'more data',
        field1: 'new value',
        field3: 'another value',
      });
    });

    it('should return only elementGroup output when no modelResponses', () => {
      const mockElementGroup = createMockElementGroup({
        getOutputValue: () => ({ field1: 'value' }),
      });

      const mockForm = createMockPrescriptionForm({
        modelResponses: undefined,
        elementGroup: mockElementGroup,
      });

      const result = component.getResponses(mockForm);

      expect(result).toEqual({ field1: 'value' });
    });

    it('should apply mapResponsesToRepeatObject when modelResponses exist', () => {
      const mockElementGroup = createMockElementGroup({
        getOutputValue: () => ({ otherField: 'value' }),
      });

      const mockForm = createMockPrescriptionForm({
        modelResponses: {
          occurrenceTiming: {
            repeat: {
              count: 7,
              when: 'NIGHT',
            },
          },
        },
        elementGroup: mockElementGroup,
      });

      const result = component.getResponses(mockForm);

      expect(result).toEqual(
        expect.objectContaining({
          nbSessions: 7,
          dayPeriod: 'NIGHT',
          otherField: 'value',
        })
      );
    });

    it('should prioritize elementGroup values over modelResponses', () => {
      const mockElementGroup = createMockElementGroup({
        getOutputValue: () => ({ field1: 'new value' }),
      });

      const mockForm = createMockPrescriptionForm({
        modelResponses: { field1: 'old value' },
        elementGroup: mockElementGroup,
      });

      const result = component.getResponses(mockForm);

      expect(result['field1']).toBe('new value');
    });
  });

  describe('handleClick (Create Model)', () => {
    it('should call createPrescriptionModel on handleClick', () => {
      const mockElementGroup = createMockElementGroup({
        getOutputValue: () => ({ field: 'value', anotherField: 123 }),
      });

      const createPrescriptionModelSpy = jest.spyOn(component, 'createPrescriptionModel');

      const form = createMockPrescriptionForm({
        templateCode: 'TEST_TEMPLATE',
        elementGroup: mockElementGroup,
      });

      const template = createMockTemplateVersion({ id: 1 });

      component.handleClick(form, template);

      expect(createPrescriptionModelSpy).toHaveBeenCalled();
    });

    it('should emit modelSaved when fields are filled and title is valid returns true', () => {
      const mockElementGroup = createMockElementGroup({
        getOutputValue: () => ({}),
      });

      component.titleControl.setValue('Valid Name');
      const form = createMockPrescriptionForm({
        templateCode: 'TEST_TEMPLATE',
        elementGroup: mockElementGroup,
      });

      const template = createMockTemplateVersion();

      jest.spyOn(component.modelSaved, 'emit');

      component.handleClick(form, template);

      expect(mockPrescriptionModelService.createModel).toHaveBeenCalledWith({
        name: 'Valid Name',
        responses: {},
        templateCode: 'TEST_TEMPLATE',
      });

      expect(component.modelSaved.emit).toHaveBeenCalled();
    });

    it('should set error state when template is missing', () => {
      const error = new HttpErrorResponse({ error: 'Creation failed', status: 500 });
      mockPrescriptionModelService.createModel = jest.fn().mockReturnValue(throwError(() => error));

      const form = createMockPrescriptionForm({
        templateCode: 'TEST_TEMPLATE',
      });

      component.handleClick(form, undefined);

      expect(mockModelState.setModalState).toHaveBeenCalledWith(
        0,
        LoadingStatus.ERROR,
        undefined,
        expect.any(HttpErrorResponse)
      );
    });

    it('should merge modelResponses with elementGroup output', () => {
      jest.spyOn(component.modelSaved, 'emit');

      component.titleControl.setValue('Valid Name');

      const mockElementGroup = createMockElementGroup({
        getOutputValue: () => ({ elementField: 'element value' }),
      });

      const form = createMockPrescriptionForm({
        templateCode: 'TEST_TEMPLATE',
        modelResponses: { modelField: 'model value' },
        elementGroup: mockElementGroup,
      });

      component.handleClick(form, createMockTemplateVersion());

      expect(mockPrescriptionModelService.createModel).toHaveBeenCalledWith({
        name: 'Valid Name',
        responses: {
          elementField: 'element value',
          modelField: 'model value',
        },
        templateCode: 'TEST_TEMPLATE',
      });

      expect(component.modelSaved.emit).toHaveBeenCalled();
    });
  });

  describe('handleUpdate (Update Model)', () => {
    it('should call updateModel service with correct data', () => {
      const mockElementGroup = createMockElementGroup({
        getOutputValue: () => ({ field: 'updated value' }),
      });

      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        modelName: 'Test Model',
        elementGroup: mockElementGroup,
      });

      component.ngOnChanges({
        prescriptionForm: {
          currentValue: component.prescriptionForm,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      component.titleControl.setValue('Updated Name');
      component.titleControl.markAsTouched();

      const template = createMockTemplateVersion();

      component.handleUpdate(component.prescriptionForm, template);

      expect(mockPrescriptionModelService.updateModel).toHaveBeenCalledWith(123, {
        name: 'Updated Name',
        responses: { field: 'updated value' },
      });
    });

    it('should emit modelSaved on successful update', () => {
      const mockElementGroup = createMockElementGroup({
        getOutputValue: () => ({}),
      });

      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        modelName: 'Test',
        elementGroup: mockElementGroup,
      });

      component.ngOnChanges({
        prescriptionForm: {
          currentValue: component.prescriptionForm,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      component.titleControl.setValue('Valid Name');

      jest.spyOn(component.modelSaved, 'emit');

      component.handleUpdate(component.prescriptionForm, createMockTemplateVersion());

      expect(component.modelSaved.emit).toHaveBeenCalled();
    });

    it('should set LOADING state before update', () => {
      const mockElementGroup = createMockElementGroup({
        getOutputValue: () => ({}),
      });

      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        modelName: 'Test',
        elementGroup: mockElementGroup,
      });

      component.ngOnChanges({
        prescriptionForm: {
          currentValue: component.prescriptionForm,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      component.titleControl.setValue('Valid Name');

      component.handleUpdate(component.prescriptionForm, createMockTemplateVersion());

      expect(mockModelState.setModalState).toHaveBeenCalledWith(0, LoadingStatus.LOADING);
    });

    it('should set error state on update failure', () => {
      const error = new HttpErrorResponse({ error: 'Update failed', status: 500 });
      mockPrescriptionModelService.updateModel = jest.fn().mockReturnValue(throwError(() => error));

      const mockElementGroup = createMockElementGroup({
        getOutputValue: () => ({}),
      });

      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        modelName: 'Test',
        elementGroup: mockElementGroup,
      });

      component.ngOnChanges({
        prescriptionForm: {
          currentValue: component.prescriptionForm,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      component.titleControl.setValue('Valid Name');

      component.handleUpdate(component.prescriptionForm, createMockTemplateVersion());

      expect(mockModelState.setModalState).toHaveBeenCalledWith(0, LoadingStatus.ERROR, undefined, error);
    });

    it('should not call service when title is invalid', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        modelName: '',
      });

      component.ngOnChanges({
        prescriptionForm: {
          currentValue: component.prescriptionForm,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      component.titleControl.setValue('');
      component.titleControl.markAsTouched();

      component.handleUpdate(component.prescriptionForm, createMockTemplateVersion());

      expect(mockPrescriptionModelService.updateModel).not.toHaveBeenCalled();
      expect(mockModelState.setModalState).toHaveBeenCalledWith(0, LoadingStatus.UPDATING);
    });

    it('should mark all controls as touched when validating', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
        modelName: 'Test',
      });

      component.ngOnChanges({
        prescriptionForm: {
          currentValue: component.prescriptionForm,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      const markAllAsTouched = jest.spyOn(component.titleControl, 'markAllAsTouched');

      component.handleUpdate(component.prescriptionForm, createMockTemplateVersion());

      expect(markAllAsTouched).toHaveBeenCalled();
    });

    it('should set error when template is missing', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        modelId: 123,
      });

      component.handleUpdate(component.prescriptionForm, undefined);

      expect(mockModelState.setModalState).toHaveBeenCalledWith(
        0,
        LoadingStatus.ERROR,
        undefined,
        expect.any(HttpErrorResponse)
      );
    });

    it('should set error when modelId is missing', () => {
      component.prescriptionForm = createMockPrescriptionForm({
        modelId: undefined,
      });

      component.handleUpdate(component.prescriptionForm, createMockTemplateVersion());

      expect(mockModelState.setModalState).toHaveBeenCalledWith(
        0,
        LoadingStatus.ERROR,
        undefined,
        expect.objectContaining({
          error: 'No model id found.',
        })
      );
    });
  });

  describe('filterElements', () => {
    it('should filter out elements with notInModels tag', () => {
      const elements: FormElement[] = [
        { id: '1', tags: ['notInModels'] } as FormElement,
        { id: '2', tags: [] } as FormElement,
        { id: '3', tags: ['someOtherTag'] } as FormElement,
      ];

      const result = (component as any).filterElements(elements);

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
    });

    it('should filter out elements with a case-insensitive notInModels tag', () => {
      const elements: FormElement[] = [
        { id: '1', tags: ['notInModels'] } as FormElement,
        { id: '2', tags: ['NOTINMODELS'] } as FormElement,
        { id: '3', tags: ['nOTInMOdelS'] } as FormElement,
        { id: '3', tags: ['notinmodels'] } as FormElement,
      ];

      const result = (component as any).filterElements(elements);

      expect(result.length).toBe(0);
    });

    it('should filter out Date type elements', () => {
      const elements: FormElement[] = [
        { id: '1', dataType: { type: TypeEnum.Date } } as FormElement,
        { id: '2', dataType: { type: TypeEnum.String } } as FormElement,
        { id: '3', dataType: { type: TypeEnum.Number } } as FormElement,
      ];

      const result = (component as any).filterElements(elements);

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
    });

    it('should remove required validations', () => {
      const elements: FormElement[] = [
        {
          id: '1',
          validations: [{ name: 'required' }, { name: 'minLength' }, { name: 'maxLength' }],
        } as FormElement,
      ];

      const result = (component as any).filterElements(elements);

      expect(result[0].validations?.length).toBe(2);
      expect(result[0].validations?.[0].name).toBe('minLength');
      expect(result[0].validations?.[1].name).toBe('maxLength');
    });

    it('should recursively filter nested elements', () => {
      const elements: FormElement[] = [
        {
          id: '1',
          elements: [
            { id: '1-1', tags: ['notInModels'] } as FormElement,
            { id: '1-2', tags: [] } as FormElement,
            {
              id: '1-3',
              elements: [{ id: '1-3-1', tags: ['notInModels'] } as FormElement, { id: '1-3-2' } as FormElement],
            } as FormElement,
          ],
        } as FormElement,
      ];

      const result = (component as any).filterElements(elements);

      expect(result[0].elements?.length).toBe(2);
      expect(result[0].elements?.[0].id).toBe('1-2');
      expect(result[0].elements?.[1].id).toBe('1-3');
      expect(result[0].elements?.[1].elements?.length).toBe(1);
      expect(result[0].elements?.[1].elements?.[0].id).toBe('1-3-2');
    });

    it('should filter out elements with empty nested elements array after filtering', () => {
      const elements: FormElement[] = [
        {
          id: '1',
          elements: [
            { id: '1-1', tags: ['notInModels'] } as FormElement,
            { id: '1-2', tags: ['notInModels'] } as FormElement,
          ],
        } as FormElement,
        { id: '2' } as FormElement,
      ];

      const result = (component as any).filterElements(elements);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
    });

    it('should handle elements without tags', () => {
      const elements: FormElement[] = [{ id: '1', tags: undefined } as FormElement, { id: '2' } as FormElement];

      const result = (component as any).filterElements(elements);

      expect(result.length).toBe(2);
    });

    it('should handle elements without validations', () => {
      const elements: FormElement[] = [
        { id: '1', validations: undefined } as FormElement,
        { id: '2', validations: [] } as FormElement,
      ];

      const result = (component as any).filterElements(elements);

      expect(result.length).toBe(2);
    });

    it('should apply all filters simultaneously', () => {
      const elements: FormElement[] = [
        {
          id: '1',
          tags: ['notInModels'],
          validations: [{ name: 'required' }],
        } as FormElement,
        {
          id: '2',
          dataType: { type: TypeEnum.Date },
        } as FormElement,
        {
          id: '3',
          tags: [],
          validations: [{ name: 'required' }, { name: 'minLength' }],
        } as FormElement,
      ];

      const result = (component as any).filterElements(elements);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('3');
      expect(result[0].validations?.length).toBe(1);
      expect(result[0].validations?.[0].name).toBe('minLength');
    });
  });

  describe('getTemplateData', () => {
    it('should filter elements in template data', () => {
      const formTemplateState = createMockDataState({
        status: LoadingStatus.SUCCESS,
        data: createMockTemplateVersion({
          elements: [{ id: '1', tags: ['notInModels'] } as FormElement, { id: '2', tags: [] } as FormElement],
        }),
      });

      const result = component.getTemplateData(formTemplateState);

      expect(result?.elements?.length).toBe(1);
      expect(result?.elements?.[0].id).toBe('2');
    });

    it('should return data unchanged when no elements', () => {
      const formTemplateState = createMockDataState({
        status: LoadingStatus.SUCCESS,
        data: createMockTemplateVersion({
          id: 1,
          elements: undefined,
        }),
      });

      const result = component.getTemplateData(formTemplateState);

      expect(result).toEqual(formTemplateState.data);
      expect(result?.id).toBe(1);
    });

    it('should filter Date type elements from template', () => {
      const formTemplateState = createMockDataState({
        status: LoadingStatus.SUCCESS,
        data: createMockTemplateVersion({
          elements: [
            { id: '1', dataType: { type: TypeEnum.Date } } as FormElement,
            { id: '2', dataType: { type: TypeEnum.String } } as FormElement,
          ],
        }),
      });

      const result = component.getTemplateData(formTemplateState);

      expect(result?.elements?.length).toBe(1);
      expect(result?.elements?.[0].id).toBe('2');
    });

    it('should preserve other template properties', () => {
      const formTemplateState = createMockDataState({
        status: LoadingStatus.SUCCESS,
        data: createMockTemplateVersion({
          id: 123,
          version: '1.0',
          templateId: 456,
          elements: [{ id: '1', tags: [] } as FormElement],
        }),
      });

      const result = component.getTemplateData(formTemplateState);

      expect(result?.id).toBe(123);
      expect(result?.version).toBe('1.0');
      expect(result?.templateId).toBe(456);
    });
  });

  describe('ngOnDestroy', () => {
    it('should reset prescription model state', () => {
      component.ngOnDestroy();
      expect(mockModelState.resetAll).toHaveBeenCalled();
    });
  });

  // Helper functions
  function createMockPrescriptionForm(overrides?: Partial<CreatePrescriptionForm>): CreatePrescriptionForm {
    const defaultFormTemplateState = signal(
      createMockDataState({
        status: LoadingStatus.INITIAL,
      })
    );

    return {
      generatedUUID: 'uuid-123',
      trackId: 0,
      templateCode: 'TEST_TEMPLATE',
      formTemplateState$: defaultFormTemplateState,
      status: LoadingStatus.ERROR,
      submitted: false,
      ...overrides,
    } as CreatePrescriptionForm;
  }

  function createMockDataState<T>(overrides?: Partial<DataState<T>>): DataState<T> {
    return {
      status: LoadingStatus.INITIAL,
      ...overrides,
    } as DataState<T>;
  }

  function createMockTemplateVersion(overrides?: Partial<TemplateVersion>): TemplateVersion {
    return {
      id: 1,
      version: '1.0',
      templateId: 1,
      elements: [],
      ...overrides,
    } as TemplateVersion;
  }

  function createMockElementGroup(overrides?: Partial<ElementGroup>): ElementGroup {
    return {
      valid: true,
      setValue: jest.fn(),
      getOutputValue: jest.fn().mockReturnValue({}),
      ...overrides,
    } as unknown as ElementGroup;
  }
});
