import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, Pipe, PipeTransform } from '@angular/core';
import * as uuid from 'uuid';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CancelPrescriptionDialog } from './cancel-prescription-dialog.component';
import { ToastService } from '@reuse/code/services/helpers/toast.service';
import { PrescriptionState } from '@reuse/code/states/api/prescription.state';
import { ProposalState } from '@reuse/code/states/api/proposal.state';
import { PersonResource, ReadRequestResource } from '@reuse/code/openapi';
import { HttpErrorResponse } from '@angular/common/http';
import { Intent } from '@reuse/code/interfaces';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';
import { TranslateByIntentPipe } from '@reuse/code/pipes/translate-by-intent.pipe';
import { AlertComponent } from '@myhealth-belgium/myhealth-additional-ui-components';
import { OverlaySpinnerComponent } from '@reuse/code/components/progress-indicators/overlay-spinner/overlay-spinner.component';

@Pipe({
  name: 'templateName',
  standalone: true,
})
class MockTemplateNamePipe implements PipeTransform {
  transform(value: any): any {
    return value;
  }
}

@Pipe({
  name: 'translateByIntent',
  standalone: true,
})
class MockTranslateByIntentPipe implements PipeTransform {
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
  cancelPrescription: jest.fn(),
  loadPrescription: jest.fn().mockReturnValue(of(void 0)),
};

const mockProposalState = {
  cancelProposal: jest.fn(),
  loadProposal: jest.fn().mockReturnValue(of(void 0)),
};

const mockDialogRef = {
  close: jest.fn(),
};

const mockDialogData = {
  prescription: {
    id: 'prescription-123',
    intent: Intent.ORDER,
  } as ReadRequestResource,
  patient: {
    id: 'patient-789',
  } as PersonResource,
};

describe('CancelPrescriptionDialog', () => {
  let component: CancelPrescriptionDialog;
  let fixture: ComponentFixture<CancelPrescriptionDialog>;
  let uuidSpy: jest.SpyInstance;
  let translate: TranslateService;

  beforeEach(async () => {
    uuidSpy = jest.spyOn(uuid, 'v4').mockReturnValue('mock-uuid-12345' as unknown as Uint8Array);

    await TestBed.configureTestingModule({
      imports: [
        CancelPrescriptionDialog,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MockTemplateNamePipe,
        MockTranslateByIntentPipe,
        MockOverlaySpinnerComponent,
        MockAlertComponent,
      ],
      providers: [
        { provide: ToastService, useValue: mockToastService },
        { provide: PrescriptionState, useValue: mockPrescriptionState },
        { provide: ProposalState, useValue: mockProposalState },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    })
      .overrideComponent(CancelPrescriptionDialog, {
        remove: {
          imports: [TemplateNamePipe, TranslateByIntentPipe, OverlaySpinnerComponent, AlertComponent],
        },
        add: {
          imports: [MockTemplateNamePipe, MockTranslateByIntentPipe, MockOverlaySpinnerComponent, MockAlertComponent],
        },
      })
      .compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('fr-BE');
    translate.use('fr-BE');

    fixture = TestBed.createComponent(CancelPrescriptionDialog);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    uuidSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('cancelPrescription', () => {
    it('should cancel prescription and show success toast', fakeAsync(() => {
      mockPrescriptionState.cancelPrescription.mockReturnValue(of(void 0));

      component.cancelPrescription();
      tick();

      expect(mockPrescriptionState.cancelPrescription).toHaveBeenCalledWith('prescription-123', 'mock-uuid-12345');
      expect(mockPrescriptionState.loadPrescription).toHaveBeenCalledWith('prescription-123');
      expect(mockToastService.show).toHaveBeenCalledWith('prescription.cancel.success');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    }));

    it('should cancel proposal and show success toast', fakeAsync(() => {
      component['prescription'].intent = Intent.PROPOSAL;
      mockProposalState.cancelProposal.mockReturnValue(of(void 0));

      component.cancelPrescription();
      tick();

      expect(mockProposalState.cancelProposal).toHaveBeenCalledWith('prescription-123', 'mock-uuid-12345');
      expect(mockProposalState.loadProposal).toHaveBeenCalledWith('prescription-123');
      expect(mockToastService.show).toHaveBeenCalledWith('proposal.cancel.success');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    }));

    it('should show error card when prescription id is missing', () => {
      component['prescription'].id = undefined;
      const showErrorCardSpy = jest.spyOn(component as any, 'showErrorCard');

      component.cancelPrescription();

      expect(component.errorCard.show).toBe(true);
      expect(showErrorCardSpy).toHaveBeenCalledWith('common.somethingWentWrong');
      expect(mockPrescriptionState.cancelPrescription).not.toHaveBeenCalled();
    });

    it('should handle error during prescription cancellation', fakeAsync(() => {
      mockPrescriptionState.cancelPrescription.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );

      component.cancelPrescription();
      tick();

      expect(component.loading).toBe(false);
      expect(mockToastService.show).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));
  });
});
