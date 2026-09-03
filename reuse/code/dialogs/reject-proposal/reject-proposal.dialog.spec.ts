import { ComponentFixture, TestBed } from '@angular/core/testing';
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
import { Discipline, OIDC, ReadRequestResource, Role } from '@reuse/code/openapi';
import { Lang } from '@reuse/code/constants/languages';
import { AlertType, UserProfile } from '@reuse/code/interfaces';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { signal } from '@angular/core';
import { ResolvedError } from '@reuse/code/interfaces/error.interface';
import { By } from '@angular/platform-browser';

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
  isOrganizationAndNotActingForProfessional: jest.fn(() => of(false)),
  isPatient: jest.fn(() => of(false)),
  discipline: jest.fn(() => of(Discipline.Physician)),
  getAccessToken: jest.fn(() => of('')),
  role: jest.fn(() => of(Role.Prescriber)),
  oidc: jest.fn(() => of(OIDC.Hospital)),
  getConnectedOrganizationNihii: jest.fn(() => of(undefined)),
  isOrganizationAndActingForProfessional: jest.fn(() => of(false)),
} as jest.Mocked<AuthService>;

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
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();
    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang(Lang.NL.full);
    translate.use(Lang.NL.full);
  }

  function createComponentAndInitialize() {
    fixture = TestBed.createComponent(RejectProposalDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    uuidSpy = jest.spyOn(uuid, 'v4').mockReturnValue('mock-uuid-12345' as unknown as Uint8Array);
  });

  afterEach(() => {
    uuidSpy.mockRestore();
    jest.clearAllMocks();

    activeClaimsPayload = {
      userProfile: mockPersonResource,
    };
  });

  describe('RejectProposalDialog (common context)', () => {
    beforeEach(async () => {
      await configureTestBedWithData(proposalWithoutTasks);
    });
    describe('RejectProposalDialog (professional context)', () => {
      beforeEach(() => {
        createComponentAndInitialize();
      });
      it('should create and generate a UUID', () => {
        expect(component).toBeTruthy();
        expect(uuid.v4).toHaveBeenCalledTimes(1);
        expect(component.generatedUUID).toBe('mock-uuid-12345');
      });

      it('should encrypt reason and call rejectProposal on success', () => {
        const reasonText = 'Rejection reason';
        const encryptedData = { encryptedText: 'encrypted-text', pseudonymizedKey: 'existing-pseudo-key-xyz' };
        component.formGroup.get('reason')?.setValue(reasonText);
        mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(of(encryptedData));
        mockProposalState.rejectProposal.mockReturnValue(of({ success: true }));

        component.rejectProposal();

        expect(mockEncryptionHelper.getEncryptedReasonAndPseudoKey).toHaveBeenCalledWith(
          reasonText,
          proposalWithoutTasks.proposal.pseudonymizedKey
        );
        expect(mockProposalState.rejectProposal).toHaveBeenCalledWith(
          'proposal-123',
          {
            kid: 'kid-abc',
            pseudonymizedKey: encryptedData.pseudonymizedKey,
            reason: encryptedData.encryptedText,
            prescriber: { discipline: Discipline.Physician, organizationNihii11: undefined, ssin: '80222700153' },
          },
          'mock-uuid-12345'
        );
        expect(mockProposalState.rejectProposalTask).not.toHaveBeenCalled();
        expect(mockToastService.show).toHaveBeenCalledWith('proposal.reject.success');
        expect(mockDialogRef.close).toHaveBeenCalledWith(true);
        expect(component.loading).toBe(false);
      });

      it('should handle error from proposalState.rejectProposal', () => {
        const error = new Error('API rejection failed');
        component.formGroup.get('reason')?.setValue('a reason');
        mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(
          of({ encryptedText: '...', pseudonymizedKey: '...' })
        );
        mockProposalState.rejectProposal.mockReturnValue(throwError(() => error));
        (component as any).error = signal<ResolvedError | null>({
          message: 'error.message',
          translationOptions: { count: 2 },
          severity: AlertType.Error,
          dismissible: true,
          retry: false,
        });

        fixture.detectChanges();

        component.rejectProposal();

        expect(component.loading).toBe(false);
        const alerts = fixture.debugElement.queryAll(By.css('app-alert'));

        const errorAlert = alerts.find(alert => alert.componentInstance.severity() === 'error');
        expect(errorAlert).toBeTruthy();
        expect(mockDialogRef.close).not.toHaveBeenCalled();
      });
    });

    describe('RejectProposalDialog (organization context)', () => {
      beforeEach(() => {
        activeClaimsPayload = {
          userProfile: {
            ...mockPersonResource,
            organizations: [{ [OIDC.Hospital]: { nihii: '46843080001' } }],
          },
        };

        createComponentAndInitialize();
      });

      it('should encrypt reason and call rejectProposal with organization context', () => {
        const reasonText = 'Rejection reason';
        const encryptedData = { encryptedText: 'encrypted-text', pseudonymizedKey: 'existing-pseudo-key-xyz' };
        component.formGroup.get('reason')?.setValue(reasonText);
        mockEncryptionHelper.getEncryptedReasonAndPseudoKey.mockReturnValue(of(encryptedData));
        mockProposalState.rejectProposal.mockReturnValue(of({ success: true }));

        component.rejectProposal();

        expect(mockProposalState.rejectProposal).toHaveBeenCalledWith(
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
        expect(mockToastService.show).toHaveBeenCalledWith('proposal.reject.success');
        expect(mockDialogRef.close).toHaveBeenCalledWith(true);
        expect(component.loading).toBe(false);
      });
    });
  });
});
