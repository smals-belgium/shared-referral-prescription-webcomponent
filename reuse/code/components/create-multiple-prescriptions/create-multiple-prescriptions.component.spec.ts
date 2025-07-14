import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { CreateMultiplePrescriptionsComponent } from './create-multiple-prescriptions.component';
import { PrescriptionModelState } from '@reuse/code/states/prescriptionModel.state';
import { CreatePrescriptionForm, LoadingStatus } from '@reuse/code/interfaces';
import { ElementGroup, FormTemplate } from '@smals/vas-evaluation-form-ui-core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CreateMultiplePrescriptionsComponent', () => {
  let component: CreateMultiplePrescriptionsComponent;
  let fixture: ComponentFixture<CreateMultiplePrescriptionsComponent>;
  let mockDialog: Partial<MatDialog>;
  let mockModelState: any;
  let translate: TranslateService;

  beforeEach(async () => {
    jest.useFakeTimers(); // to control setTimeout

    mockDialog = {
      open: jest.fn().mockReturnValue({afterClosed: () => of(true)})
    };

    mockModelState = {
      modalState: {},
      setInitialState: jest.fn(),
      setModalState: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        CreateMultiplePrescriptionsComponent,
        TranslateModule.forRoot(),
        MatExpansionModule,
        MatIconModule,
        NoopAnimationsModule],
      providers: [
        {provide: MatDialog, useValue: mockDialog},
        {provide: PrescriptionModelState, useValue: mockModelState},
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('nl-BE');
    translate.use('nl-BE');

    fixture = TestBed.createComponent(CreateMultiplePrescriptionsComponent);
    component = fixture.componentInstance;
    component.intent = 'order';
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should emit clickAddPrescription event', () => {
    fixture.detectChanges();
    const spy = jest.spyOn(component.clickAddPrescription, 'emit');
    component.clickAddPrescription.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should return correct value from trackByFn', () => {
    fixture.detectChanges();
    const mockItem = {trackId: 'trackId_01'} as unknown as CreatePrescriptionForm;
    expect(component.trackByFn(0, mockItem)).toBe('trackId_01');
  });

  it('should compute numberOfPrescriptionsToCreate correctly', () => {
    fixture.detectChanges();
    component.createPrescriptionForms = [
      {status: LoadingStatus.SUCCESS} as CreatePrescriptionForm,
      {status: LoadingStatus.LOADING} as CreatePrescriptionForm,
    ];
    expect(component.numberOfPrescriptionsToCreate).toBe(1);
  });

  it('should open accordion when one form is present on change', () => {
    fixture.detectChanges();
    const openAll = jest.fn();
    component.accordion = {openAll} as any;

    component.createPrescriptionForms = [{status: LoadingStatus.LOADING}] as CreatePrescriptionForm[];

    component.ngOnChanges({
      createPrescriptionForms: {
        currentValue: component.createPrescriptionForms,
        previousValue: [],
        firstChange: true,
        isFirstChange: () => true
      }
    });

    jest.runOnlyPendingTimers();
    expect(openAll).toHaveBeenCalled();
  });

  it('should map repeat object correctly in mapResponsesToRepeatObject', () => {
    fixture.detectChanges();
    const responses = {
      occurrenceTiming: {
        repeat: {
          count: 3,
          when: ['AM'],
          frequency: 1,
          period: 1
        }
      }
    };

    const result = component.mapResponsesToRepeatObject(responses);
    expect(result['nbSessions']).toBe(3);
    expect(result['dayPeriod']).toBe('AM');
  });

  it('should set elementGroup value in setElementGroup', () => {
    fixture.detectChanges();
    const setValue = jest.fn();
    const mockElementGroup = {
      setValue,
      getOutputValue: () => ({foo: 'bar'})
    } as unknown as ElementGroup;

    const mockForm = {
      elementGroup: mockElementGroup,
      initialPrescription: {responses: {a: 1, b: null}}
    } as unknown as CreatePrescriptionForm;

    component.setElementGroup(mockForm, {} as FormTemplate, mockElementGroup);
    expect(setValue).toHaveBeenCalledWith(expect.objectContaining({a: 1}));
  });

  it('should call dialog.open in handleClick', () => {
    fixture.detectChanges();
    const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {
    });
    const form = {
      templateCode: 'template_01',
      initialPrescription: {responses: {}},
      elementGroup: {getOutputValue: () => ({})}
    } as CreatePrescriptionForm;

    const template = {} as FormTemplate;

    component.handleClick(form, template);

    expect(mockDialog.open).toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalledWith({top: 0, behavior: 'smooth'});
  });

  it('should set modal state to error if template is missing', () => {
    fixture.detectChanges();
    const form = {
      templateCode: 'template_01',
      initialPrescription: {responses: {}},
      elementGroup: {getOutputValue: () => ({})}
    } as CreatePrescriptionForm;

    component.handleClick(form);
    expect(mockModelState.setModalState).toHaveBeenCalledWith(
      LoadingStatus.ERROR,
      undefined,
      expect.any(HttpErrorResponse)
    );
  });

  it('should reset model state on destroy', () => {
    fixture.detectChanges();
    component.ngOnDestroy();
    expect(mockModelState.setInitialState).toHaveBeenCalled();
  });

  it('should display patient info when patient is set', () => {
    component.patient = {firstName: 'John', lastName: 'Doe', ssin: '12345678901'};
    fixture.detectChanges();

    const nameEl = fixture.nativeElement.querySelector('[data-cy="patient-name"]');
    const ssinEl = fixture.nativeElement.querySelector('[data-cy="patient-ssin"]');

    expect(nameEl?.textContent).toContain('John Doe');
    expect(ssinEl?.textContent).toContain('12.34.56-789.01'); // depends on your formatSsin pipe
  });

  it('should not render patient block when patient is undefined', () => {
    component.patient = undefined;
    fixture.detectChanges();

    const patientLabel = fixture.nativeElement.querySelector('[data-cy="patient-label"]');
    expect(patientLabel).toBeNull();
  });

  it('should show error card when errorCard.show is true', () => {
    component.errorCard = {
      show: true,
      message: 'error.message',
      errorResponse: {status: 500} as unknown as HttpErrorResponse,
      translationOptions: {}
    };
    fixture.detectChanges();

    const errorCard = fixture.nativeElement.querySelector('app-error-card');
    expect(errorCard).not.toBeNull();
  });


  function setForms(forms: any[]) {
    const mockSignal = jest.fn().mockReturnValue({status: LoadingStatus.SUCCESS});
    (component as any).modelState = mockSignal;
    component.createPrescriptionForms = forms;
    fixture.detectChanges();
  }

  it('should set hideToggle true when only one form', () => {
    setOneTemplate();

    const accordion = fixture.debugElement.query(By.css('mat-accordion'));
    expect(accordion.attributes['ng-reflect-hide-toggle']).toBe('true');
  });

  it('should render one expansion panel per form and expand last', () => {
    const mockSignal = jest.fn().mockReturnValue({status: LoadingStatus.SUCCESS});
    (component as any).modelState = mockSignal;

    setTwoTemplates(LoadingStatus.INITIAL, LoadingStatus.ERROR);

    const panels = fixture.debugElement.queryAll(By.css('mat-expansion-panel'));
    expect(panels.length).toBe(2);

    // Last panel expanded
    expect(panels[0].componentInstance.expanded).toBe(false);
    expect(panels[1].componentInstance.expanded).toBe(true);
  });

  it('should apply no-toggle class and tabindex -1 on header if only one form', () => {
    setOneTemplate();
    const header = fixture.debugElement.query(By.css('mat-expansion-panel-header'));
    expect(header.nativeElement.classList).toContain('no-toggle');
    expect(header.attributes['tabindex']).toBe('-1');
  });

  it('should show check_circle icon for SUCCESS status and error icon for ERROR', () => {
    setTwoTemplates(LoadingStatus.SUCCESS, LoadingStatus.ERROR);

    const matPanel = fixture.debugElement.queryAll(By.css('mat-panel-description'));
    expect(matPanel.length).toBe(2);

    const matPanel_1_icons = matPanel[0].queryAll(By.css('mat-icon'));
    expect(matPanel_1_icons.length).toBe(1);
    expect(matPanel_1_icons[0].nativeElement.textContent.trim()).toBe('check_circle');

    const matPanel_2_icons = matPanel[1].queryAll(By.css('mat-icon'));
    expect(matPanel_2_icons.length).toBe(2);
    expect(matPanel_2_icons[0].nativeElement.textContent.trim()).toBe('error');
    expect(matPanel_2_icons[1].nativeElement.textContent.trim()).toBe('delete');
  });

  it('should emit clickDeletePrescription when delete button clicked and multiple forms and not SUCCESS', () => {
    setTwoTemplates(LoadingStatus.ERROR, LoadingStatus.ERROR);

    jest.spyOn(component.clickDeletePrescription, 'emit');

    fixture.detectChanges();

    const deleteButtons = fixture.debugElement.queryAll(By.css('button[mat-icon-button]'));
    expect(deleteButtons.length).toBeGreaterThan(0);

    deleteButtons[0].triggerEventHandler('click', new Event('click'));

    expect(component.clickDeletePrescription.emit).toHaveBeenCalledWith({
      form: component.createPrescriptionForms[0],
      templateName: expect.any(String)
    });
  });


  it('should show the add prescription button when intent is "order" and templateCode is not "ANNEX_82" AND click it', () => {
    jest.spyOn(component.clickAddPrescription, 'emit');

    setOneTemplate();
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('[data-cy="prescription-create-add"]'));
    expect(button).toBeTruthy();

    button.nativeElement.click();

    expect(component.clickAddPrescription.emit).toHaveBeenCalled();
  });

  it('should NOT show the add prescription button when templateCode is "ANNEX_82"', () => {
    const mockFormTemplateState = jest.fn().mockReturnValue({
      data: {
        id: '1',
        templateId: 'ANNEX_82'
      },
      status: LoadingStatus.SUCCESS
    });

    setForms([{templateCode: 'ANNEX_82', status: LoadingStatus.SUCCESS, formTemplateState$: mockFormTemplateState}]);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('[data-cy="prescription-create-add"]'));
    expect(button).toBeFalsy();
  });

  it('should NOT show the actions div when intent is not "order"', () => {
    component.intent = 'proposal';
    setOneTemplate();
    fixture.detectChanges();

    const actionsDiv = fixture.debugElement.query(By.css('.actions'));
    expect(actionsDiv).toBeFalsy();
  });

  it('should disable the publish button if createPrescriptionForms is empty', () => {
    component.createPrescriptionForms = [];
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('[data-cy="prescription-create-publish"]'));
    expect(button.nativeElement.disabled).toBeTruthy();
  });

  it('should enable the publish button if createPrescriptionForms is not empty', () => {
    setOneTemplate();

    const button = fixture.debugElement.query(By.css('[data-cy="prescription-create-publish"]'));
    expect(button.nativeElement.disabled).toBeFalsy();
  });

  it('should show number of prescriptions if more than one form', () => {
    setTwoTemplates(LoadingStatus.INITIAL, LoadingStatus.ERROR);

    fixture.detectChanges();

    const countText = fixture.debugElement.nativeElement.textContent;
    expect(countText).toContain('(2)');
  });

  it('should NOT show number of prescriptions if only one form', () => {
    setOneTemplate();
    fixture.detectChanges();

    const countText = fixture.debugElement.nativeElement.textContent;
    expect(countText).not.toContain('(1)');
  });

  it('should emit clickPublish when publish button is clicked', () => {
    setOneTemplate();
    fixture.detectChanges();

    jest.spyOn(component.clickPublish, 'emit');

    const button = fixture.debugElement.query(By.css('[data-cy="prescription-create-publish"]'));
    button.nativeElement.click();

    expect(component.clickPublish.emit).toHaveBeenCalled();
  });

  it('should emit clickCancel when cancel button is clicked', () => {
    fixture.detectChanges();
    jest.spyOn(component.clickCancel, 'emit');

    const cancelButton = fixture.debugElement.query(By.css('[data-cy="prescription-create-cancel"]'));
    cancelButton.nativeElement.click();

    expect(component.clickCancel.emit).toHaveBeenCalled();
  });

  function setOneTemplate() {
    const mockFormTemplateState = jest.fn().mockReturnValue({
      data: {
        id: '1',
        templateId: 'A'
      },
      status: LoadingStatus.INITIAL
    });

    setForms([{templateCode: 'A', status: LoadingStatus.INITIAL, formTemplateState$: mockFormTemplateState}]);
  }

  function setTwoTemplates(state1: LoadingStatus, state2: LoadingStatus) {
    const mockFormTemplateState_A = jest.fn().mockReturnValue({
      data: {
        id: '1',
        templateId: 'A'
      },
      status: state1
    });

    const mockFormTemplateState_B = jest.fn().mockReturnValue({
      data: {
        id: '2',
        templateId: 'B'
      },
      status: state2
    });

    setForms([
      {templateCode: 'A', status: state1, submitted: true, formTemplateState$: mockFormTemplateState_A},
      {templateCode: 'B', status: state2, submitted: true, formTemplateState$: mockFormTemplateState_B}
    ]);
  }
});
