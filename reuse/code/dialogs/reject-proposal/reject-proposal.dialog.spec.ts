import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import * as uuid from 'uuid';

import { RejectProposalDialog } from './reject-proposal.dialog';
import { ToastService } from '../../services/helpers/toast.service';
import { ProposalState } from '../../states/api/proposal.state';
import { EncryptionHelperService } from '@reuse/code/states/privacy/encryption-helper.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReadRequestResource } from '@reuse/code/openapi';

const mockToastService = {
  show: jest.fn(),
};

const mockProposalState = {
  rejectProposal: jest.fn(),
  rejectProposalTask: jest.fn(),
};

const mockEncryptionHelper = {
  getEncryptedReasonAndPseudoKey: jest.fn(),
};

const mockDialogRef = {
  close: jest.fn(),
};

const proposalWithoutTasks: { proposal: ReadRequestResource } = {
  proposal: {
    id: 'proposal-123',
    kid: 'kid-abc',
    pseudonymizedKey: 'existing-pseudo-key-xyz',
  } as ReadRequestResource,
};

describe('RejectProposalDialog', () => {
  let component: RejectProposalDialog;
  let fixture: ComponentFixture<RejectProposalDialog>;
  let uuidSpy: jest.SpyInstance;
  let translate: TranslateService;

  async function configureTestBedWithData(data: { proposal: ReadRequestResource }) {
    await TestBed.configureTestingModule({
      imports: [RejectProposalDialog, ReactiveFormsModule, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: ToastService, useValue: mockToastService },
        { provide: ProposalState, useValue: mockProposalState },
        { provide: EncryptionHelperService, useValue: mockEncryptionHelper },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();
    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('nl-BE');
    translate.use('nl-BE');
    fixture = TestBed.createComponent(RejectProposalDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    uuidSpy = jest.spyOn(uuid, 'v4').mockReturnValue('mock-uuid-12345' as unknown as Uint8Array);
    jest.clearAllMocks();
  });

  afterEach(() => {
    uuidSpy.mockRestore();
  });

  describe('when proposal has no performer tasks', () => {
    beforeEach(async () => {
      await configureTestBedWithData(proposalWithoutTasks);
    });

    it('should create and generate a UUID', () => {
      expect(component).toBeTruthy();
      expect(uuid.v4).toHaveBeenCalledTimes(1);
      expect(component.generatedUUID).toBe('mock-uuid-12345');
    });

    it('should encrypt reason and call rejectProposal on success', fakeAsync(() => {
      const reasonText = 'Rejection reason';
      const encryptedData = { encryptedText: 'encrypted-text', pseudonymizedKey: 'existing-pseudo-key-xyz' };
      component.formGroup.get('reason')?.setValue(reasonText);
      mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(of(encryptedData));
      mockProposalState.rejectProposal.mockReturnValue(of({ success: true }));

      component.rejectProposal();
      tick();

      expect(mockEncryptionHelper.getEncryptedReasonAndPseudoKey).toHaveBeenCalledWith(
        reasonText,
        proposalWithoutTasks.proposal.pseudonymizedKey
      );
      expect(mockProposalState.rejectProposal).toHaveBeenCalledWith(
        'proposal-123',
        { kid: 'kid-abc', pseudonymizedKey: encryptedData.pseudonymizedKey, reason: encryptedData.encryptedText },
        'mock-uuid-12345'
      );
      expect(mockProposalState.rejectProposalTask).not.toHaveBeenCalled();
      expect(mockToastService.show).toHaveBeenCalledWith('proposal.reject.success');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
      expect(component.loading).toBe(false);
    }));

    it('should handle error from proposalState.rejectProposal', fakeAsync(() => {
      const error = new Error('API rejection failed');
      component.formGroup.get('reason')?.setValue('a reason');
      mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(
        of({ encryptedText: '...', pseudonymizedKey: '...' })
      );
      mockProposalState.rejectProposal.mockReturnValue(throwError(() => error));
      const handleErrorSpy = jest.spyOn(component as any, 'handleError');

      component.rejectProposal();
      tick();

      expect(component.loading).toBe(false);
      expect(handleErrorSpy).toHaveBeenCalledWith(error);
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));
  });

});
