import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import * as uuid from 'uuid';

import { ApproveProposalDialog } from './approve-proposal.dialog';
import { ToastService } from '../../services/helpers/toast.service';
import { ProposalState } from '../../states/api/proposal.state';
import { EncryptionHelperService } from '@reuse/code/states/privacy/encryption-helper.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReadRequestResource } from '@reuse/code/openapi';

const mockToastService = {
  show: jest.fn(),
};

const mockProposalState = {
  approveProposal: jest.fn(),
};

const mockEncryptionHelper = {
  getEncryptedReasonAndPseudoKey: jest.fn(),
};

const mockDialogRef = {
  close: jest.fn(),
};

const mockDialogData: { proposal: ReadRequestResource } = {
  proposal: {
    id: 'proposal-123',
    kid: 'kid-abc',
    pseudonymizedKey: 'existing-pseudo-key-xyz',
  } as ReadRequestResource,
};

describe('ApproveProposalDialog', () => {
  let component: ApproveProposalDialog;
  let fixture: ComponentFixture<ApproveProposalDialog>;
  let uuidSpy: jest.SpyInstance;
  let translate: TranslateService;

  beforeEach(async () => {
    uuidSpy = jest.spyOn(uuid, 'v4').mockReturnValue('mock-uuid-12345' as unknown as Uint8Array);

    await TestBed.configureTestingModule({
      imports: [ApproveProposalDialog, ReactiveFormsModule, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: ToastService, useValue: mockToastService },
        { provide: ProposalState, useValue: mockProposalState },
        { provide: EncryptionHelperService, useValue: mockEncryptionHelper },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();
    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('nl-BE');
    translate.use('nl-BE');
    fixture = TestBed.createComponent(ApproveProposalDialog);
    component = fixture.componentInstance;

    jest.clearAllMocks();
    fixture.detectChanges();
  });

  afterEach(() => {
    uuidSpy.mockRestore();
  });

  it('should create and generate a UUID on initialization', () => {
    expect(component).toBeTruthy();
    expect(uuid.v4).toHaveBeenCalledTimes(1);
    expect(component.generatedUUID).toBe('mock-uuid-12345');
  });

  describe('approveProposal', () => {
    it('should approve proposal with a NEW pseudonymized key if generated', fakeAsync(() => {
      const reasonText = 'Approval reason';
      const encryptedData = { encryptedText: 'encrypted-text', pseudonymizedKey: 'new-pseudo-key' };
      component.formGroup.get('reason')?.setValue(reasonText);
      mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(of(encryptedData));
      mockProposalState.approveProposal.mockReturnValue(of({ success: true }));
      mockDialogData.proposal.pseudonymizedKey = undefined;

      component.approveProposal();
      tick();
      expect(mockEncryptionHelper.getEncryptedReasonAndPseudoKey).toHaveBeenCalledWith(
        reasonText,
        mockDialogData.proposal.pseudonymizedKey
      );
      expect(mockProposalState.approveProposal).toHaveBeenCalledWith(
        'proposal-123',
        { kid: 'kid-abc', pseudonymizedKey: encryptedData.pseudonymizedKey, reason: encryptedData.encryptedText },
        'mock-uuid-12345'
      );
      expect(mockToastService.show).toHaveBeenCalledWith('proposal.approve.success');
      expect(mockDialogRef.close).toHaveBeenCalledWith({ prescriptionId: undefined });
      expect(component.loading).toBe(false);
    }));

    it('should approve proposal with the EXISTING pseudonymized key if a new one is not generated', fakeAsync(() => {
      const reasonText = 'Another reason';
      const encryptedData = { encryptedText: 'encrypted-text-2', pseudonymizedKey: undefined };
      component.formGroup.get('reason')?.setValue(reasonText);
      mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(of(encryptedData));
      mockProposalState.approveProposal.mockReturnValue(of({ success: true }));

      component.approveProposal();
      tick();

      expect(mockProposalState.approveProposal).toHaveBeenCalledWith(
        'proposal-123',
        {
          kid: 'kid-abc',
          pseudonymizedKey: mockDialogData.proposal.pseudonymizedKey,
          reason: encryptedData.encryptedText,
        },
        'mock-uuid-12345'
      );
      expect(mockToastService.show).toHaveBeenCalledWith('proposal.approve.success');
      expect(mockDialogRef.close).toHaveBeenCalledWith({ prescriptionId: undefined });
      expect(component.loading).toBe(false);
    }));

    it('should handle error from encryption service', fakeAsync(() => {
      const error = new Error('Encryption failed!');
      component.formGroup.get('reason')?.setValue('some reason');
      mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(throwError(() => error));
      const handleErrorSpy = jest.spyOn(component as any, 'handleError');

      component.approveProposal();
      tick();

      expect(component.loading).toBe(false);
      expect(handleErrorSpy).toHaveBeenCalledWith(error);
      expect(mockProposalState.approveProposal).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));

    it('should handle error from proposal state service during approval', fakeAsync(() => {
      const error = new Error('API approval failed');
      const reasonText = 'A reason';
      const encryptedData = { encryptedText: 'encrypted-text', pseudonymizedKey: 'new-key' };

      component.formGroup.get('reason')?.setValue(reasonText);
      mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(of(encryptedData));
      mockProposalState.approveProposal.mockReturnValue(throwError(() => error));
      const handleErrorSpy = jest.spyOn(component as any, 'handleError');

      component.approveProposal();
      tick();

      expect(component.loading).toBe(false);
      expect(handleErrorSpy).toHaveBeenCalledWith(error);
      expect(mockToastService.show).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));
  });
});
