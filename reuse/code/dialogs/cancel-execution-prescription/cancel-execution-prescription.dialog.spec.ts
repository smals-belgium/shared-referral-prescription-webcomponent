import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, Pipe, PipeTransform, signal } from '@angular/core';
import * as uuid from 'uuid';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CancelExecutionPrescriptionDialog } from './cancel-execution-prescription.dialog';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { PerformerTaskResource, PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';
import { AlertComponent } from '@reuse/code/components/alert-component/alert.component';
import { Lang } from '@reuse/code/constants/languages';
import { AlertService } from '@reuse/code/services/helpers/alert.service';
import { mockTestAlertService } from '@reuse/code/utils/test.utils';
import { By } from '@angular/platform-browser';

@Pipe({
  name: 'templateName',
  standalone: true,
})
class MockTemplateNamePipe implements PipeTransform {
  transform(value: any): any {
    return value;
  }
}

@Component({
  selector: 'app-overlay-spinner',
  template: '',
  standalone: true,
})
class MockOverlaySpinnerComponent {}

const mockToastService = {
  show: jest.fn(),
};

const mockPrescriptionState = {
  cancelPrescriptionExecution: jest.fn(),
};

const mockDialogRef = {
  close: jest.fn(),
};

const mockDialogData = {
  prescription: {
    id: 'prescription-123',
  } as ReadRequestResource,
  performerTask: {
    id: 'performer-456',
  } as PerformerTaskResource,
  patient: {
    id: 'patient-789',
  } as PersonResource,
};

describe('CancelExecutionPrescriptionDialog', () => {
  let component: CancelExecutionPrescriptionDialog;
  let fixture: ComponentFixture<CancelExecutionPrescriptionDialog>;
  let uuidSpy: jest.SpyInstance;
  let translate: TranslateService;
  let mockAlertService: jest.Mocked<Partial<AlertService>>;

  beforeEach(async () => {
    uuidSpy = jest.spyOn(uuid, 'v4').mockReturnValue('mock-uuid-12345' as unknown as Uint8Array);
    mockAlertService = { ...mockTestAlertService, setTarget: jest.fn().mockReturnValue(signal(null)) };
    await TestBed.configureTestingModule({
      imports: [
        CancelExecutionPrescriptionDialog,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MockTemplateNamePipe,
        MockOverlaySpinnerComponent,
      ],
      providers: [
        { provide: ToastService, useValue: mockToastService },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: AlertService, useValue: mockAlertService },
      ],
    })
      .overrideComponent(CancelExecutionPrescriptionDialog, {
        remove: { imports: [TemplateNamePipe, OverlaySpinnerComponent] },
        add: { imports: [MockTemplateNamePipe, MockOverlaySpinnerComponent] },
      })
      .compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang(Lang.FR.full);
    translate.use(Lang.FR.full);

    fixture = TestBed.createComponent(CancelExecutionPrescriptionDialog);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    uuidSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('cancelPrescriptionExecution', () => {
    it('should cancel prescription execution successfully', () => {
      mockPrescriptionState.cancelPrescriptionExecution.mockReturnValue(of({}));

      component.cancelPrescriptionExecution();

      expect(mockPrescriptionState.cancelPrescriptionExecution).toHaveBeenCalledWith(
        'prescription-123',
        'performer-456',
        'mock-uuid-12345'
      );
      expect(mockToastService.show).toHaveBeenCalledWith('prescription.cancelExecution.success');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
      const alerts = fixture.debugElement.queryAll(By.css('app-alert'));
      expect(alerts).toHaveLength(0);
    });

    it('should show error card when prescription id is missing', () => {
      component.prescription.id = undefined;
      const alertServiceSpy = jest.spyOn(mockAlertService, 'showGeneralError');

      component.cancelPrescriptionExecution();
      expect(alertServiceSpy).toHaveBeenCalledTimes(1);
      expect(alertServiceSpy).toHaveBeenCalledWith('cancel-execution-dialog');
      expect(mockPrescriptionState.cancelPrescriptionExecution).not.toHaveBeenCalled();
    });

    it('should show error card when performerTask id is missing', () => {
      component.performerTask.id = undefined;
      const alertServiceSpy = jest.spyOn(mockAlertService, 'showGeneralError');

      component.cancelPrescriptionExecution();

      expect(alertServiceSpy).toHaveBeenCalledTimes(1);
      expect(alertServiceSpy).toHaveBeenCalledWith('cancel-execution-dialog');
      expect(mockPrescriptionState.cancelPrescriptionExecution).not.toHaveBeenCalled();
    });
  });
});
