import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, Pipe, PipeTransform } from '@angular/core';
import * as uuid from 'uuid';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CancelExecutionPrescriptionDialog } from './cancel-execution-prescription.dialog';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { PerformerTaskResource, PersonResource, ReadRequestResource } from '@reuse/code/openapi';

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

@Component({
  selector: 'app-alert',
  template: '',
  standalone: true,
})
class MockAlertComponent {}

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

  beforeEach(async () => {
    uuidSpy = jest.spyOn(uuid, 'v4').mockReturnValue('mock-uuid-12345' as unknown as Uint8Array);

    await TestBed.configureTestingModule({
      imports: [
        CancelExecutionPrescriptionDialog,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MockTemplateNamePipe,
        MockOverlaySpinnerComponent,
        MockAlertComponent,
      ],
      providers: [
        { provide: ToastService, useValue: mockToastService },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    })
      .overrideComponent(CancelExecutionPrescriptionDialog, {
        remove: { imports: [] },
        add: { imports: [MockTemplateNamePipe, MockOverlaySpinnerComponent, MockAlertComponent] },
      })
      .compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('fr-BE');
    translate.use('fr-BE');

    fixture = TestBed.createComponent(CancelExecutionPrescriptionDialog);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    uuidSpy.mockRestore();
    jest.clearAllMocks();
  });


  describe('cancelPrescriptionExecution', () => {
    it('should cancel prescription execution successfully', fakeAsync(() => {
      mockPrescriptionState.cancelPrescriptionExecution.mockReturnValue(of({}));

      component.cancelPrescriptionExecution();
      tick();

      expect(mockPrescriptionState.cancelPrescriptionExecution).toHaveBeenCalledWith(
        'prescription-123',
        'performer-456',
        'mock-uuid-12345'
      );
      expect(mockToastService.show).toHaveBeenCalledWith('prescription.cancelExecution.success');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
      expect(component.errorCard.show).toBe(false);
    }));

    it('should show error card when prescription id is missing', () => {
      component.prescription.id = undefined;

      component.cancelPrescriptionExecution();

      expect(component.errorCard.show).toBe(true);
      expect(component.errorCard.message).toBe('common.somethingWentWrong');
      expect(mockPrescriptionState.cancelPrescriptionExecution).not.toHaveBeenCalled();
    });

    it('should show error card when performerTask id is missing', () => {
      component.performerTask.id = undefined;

      component.cancelPrescriptionExecution();

      expect(component.errorCard.show).toBe(true);
      expect(component.errorCard.message).toBe('common.somethingWentWrong');
      expect(mockPrescriptionState.cancelPrescriptionExecution).not.toHaveBeenCalled();
    });
  });
});
