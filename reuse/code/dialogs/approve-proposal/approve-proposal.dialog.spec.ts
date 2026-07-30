import { ComponentFixture, TestBed } from '@angular/core/testing';
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
import { Discipline, OIDC, ReadRequestResource, Role } from '@reuse/code/openapi';
import { Lang } from '@reuse/code/constants/languages';
import { signal } from '@angular/core';
import { ResolvedError } from '@reuse/code/interfaces/error.interface';
import { AlertType, UserProfile } from '@reuse/code/interfaces';
import { By } from '@angular/platform-browser';
import { AuthService } from '@reuse/code/services/auth/auth.service';

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

const mockPersonResource = {
  ssin: '80222700153',
  firstName: 'John',
  lastName: 'Doe',
  gender: 'M',
} as unknown as UserProfile;

let activeClaimsPayload: any = {
  userProfile: mockPersonResource,
};
const mockAuthService = {
  init: jest.fn(),
  getClaims: jest.fn(() => of(activeClaimsPayload)),
  isProfessional: jest.fn(() => of(false)),
  isOrganization: jest.fn(() => of(false)),
  discipline: jest.fn(() => of(Discipline.Physician)),
  getAccessToken: jest.fn(() => of('')),
  role: jest.fn(() => of(Role.Prescriber)),
  oidc: jest.fn(() => of(OIDC.Hospital)),
} as jest.Mocked<AuthService>;

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
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();
    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang(Lang.NL.full);
    translate.use(Lang.NL.full);
  });

  afterEach(() => {
    uuidSpy.mockRestore();
    jest.clearAllMocks();
    activeClaimsPayload = {
      userProfile: mockPersonResource,
    };
  });

  describe('ApproveProposalDialog (professional context)', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ApproveProposalDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create and generate a UUID on initialization', () => {
      expect(component).toBeTruthy();
      expect(uuid.v4).toHaveBeenCalledTimes(1);
      expect(component.generatedUUID).toBe('mock-uuid-12345');
    });

    it('should approve proposal with a NEW pseudonymized key if generated', () => {
      const reasonText = 'Approval reason';
      const encryptedData = { encryptedText: 'encrypted-text', pseudonymizedKey: 'new-pseudo-key' };
      component.formGroup.get('reason')?.setValue(reasonText);
      mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(of(encryptedData));
      mockProposalState.approveProposal.mockReturnValue(of({ success: true }));
      mockDialogData.proposal.pseudonymizedKey = undefined;

      component.approveProposal();
      expect(mockEncryptionHelper.getEncryptedReasonAndPseudoKey).toHaveBeenCalledWith(
        reasonText,
        mockDialogData.proposal.pseudonymizedKey
      );
      expect(mockProposalState.approveProposal).toHaveBeenCalledWith(
        'proposal-123',
        {
          kid: 'kid-abc',
          pseudonymizedKey: encryptedData.pseudonymizedKey,
          reason: encryptedData.encryptedText,
          prescriber: { discipline: Discipline.Physician, organizationNihii11: undefined, ssin: '80222700153' },
        },
        'mock-uuid-12345'
      );
      expect(mockToastService.show).toHaveBeenCalledWith('proposal.approve.success');
      expect(mockDialogRef.close).toHaveBeenCalledWith({ prescriptionId: undefined });
      expect(component.loading).toBe(false);
    });

    it('should approve proposal with the EXISTING pseudonymized key if a new one is not generated', () => {
      const reasonText = 'Another reason';
      const encryptedData = { encryptedText: 'encrypted-text-2', pseudonymizedKey: undefined };
      component.formGroup.get('reason')?.setValue(reasonText);
      mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(of(encryptedData));
      mockProposalState.approveProposal.mockReturnValue(of({ success: true }));

      component.approveProposal();

      expect(mockProposalState.approveProposal).toHaveBeenCalledWith(
        'proposal-123',
        {
          kid: 'kid-abc',
          pseudonymizedKey: mockDialogData.proposal.pseudonymizedKey,
          reason: encryptedData.encryptedText,
          prescriber: { discipline: Discipline.Physician, organizationNihii11: undefined, ssin: '80222700153' },
        },
        'mock-uuid-12345'
      );
      expect(mockToastService.show).toHaveBeenCalledWith('proposal.approve.success');
      expect(mockDialogRef.close).toHaveBeenCalledWith({ prescriptionId: undefined });
      expect(component.loading).toBe(false);
    });

    it('should handle error from encryption service', () => {
      const error = new Error('Encryption failed!');
      component.formGroup.get('reason')?.setValue('some reason');
      mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(throwError(() => error));
      (component as any).error = signal<ResolvedError | null>({
        message: 'error.message',
        translationOptions: { count: 2 },
        severity: AlertType.Error,
        dismissible: true,
        retry: false,
      });
      fixture.detectChanges();

      component.approveProposal();

      expect(component.loading).toBe(false);

      const alerts = fixture.debugElement.queryAll(By.css('app-alert'));
      const errorAlert = alerts.find(alert => alert.componentInstance.severity() === 'error');
      expect(errorAlert).toBeTruthy();

      expect(mockProposalState.approveProposal).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('ApproveProposalDialog (organization context)', () => {
    beforeEach(() => {
      activeClaimsPayload = {
        userProfile: {
          ...mockPersonResource,
          organizations: [{ [OIDC.Hospital]: { nihii: '46843080001' } }],
        },
      };

      fixture = TestBed.createComponent(ApproveProposalDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should approve proposal of organization with a NEW pseudonymized key if generated', () => {
      const reasonText = 'Approval reason';
      const encryptedData = { encryptedText: 'encrypted-text', pseudonymizedKey: 'new-pseudo-key' };

      component.formGroup.get('reason')?.setValue(reasonText);
      mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(of(encryptedData));
      mockProposalState.approveProposal.mockReturnValue(of({ success: true }));
      mockDialogData.proposal.pseudonymizedKey = undefined;

      component.approveProposal();

      expect(mockEncryptionHelper.getEncryptedReasonAndPseudoKey).toHaveBeenCalledWith(
        reasonText,
        mockDialogData.proposal.pseudonymizedKey
      );
      expect(mockProposalState.approveProposal).toHaveBeenCalledWith(
        'proposal-123',
        {
          kid: 'kid-abc',
          pseudonymizedKey: encryptedData.pseudonymizedKey,
          reason: encryptedData.encryptedText,
          prescriber: {
            discipline: Discipline.Physician,
            organizationNihii11: '46843080001',
            ssin: '80222700153',
          },
        },
        'mock-uuid-12345'
      );
      expect(mockToastService.show).toHaveBeenCalledWith('proposal.approve.success');
      expect(mockDialogRef.close).toHaveBeenCalledWith({ prescriptionId: undefined });
      expect(component.loading).toBe(false);
    });
  });
});
