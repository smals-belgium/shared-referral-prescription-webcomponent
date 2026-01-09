import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrescriptionDetailsBottomComponent } from './prescription-details-bottom.component';
import { PrescriptionDetailsSecondaryService } from '../prescription-details-secondary/prescription-details-secondary.service';
import { By } from '@angular/platform-browser';
import { AccessMatrixState } from '@reuse/code/states/api/access-matrix.state';
import { TranslateService } from '@ngx-translate/core';
import {MatNativeDateModule} from "@angular/material/core";
import {Observable, of} from "rxjs";

describe('PrescriptionDetailsBottomComponent – final tests', () => {
    let fixture: ComponentFixture<PrescriptionDetailsBottomComponent>;
    let component: PrescriptionDetailsBottomComponent;

    let serviceMock: {
        getPrescription: jest.Mock;
        getCurrentUser: jest.Mock;
        openApproveProposalDialog: jest.Mock;
        openRejectProposalDialog: jest.Mock;
    };

    let accessMatrixStateMock: { hasAtLeastOnePermission: jest.Mock };

    let translateServiceMock!: {
        get: jest.Mock;
        onLangChange: Observable<any>;
        onDefaultLangChange: Observable<any>;
        onTranslationChange: Observable<any>;
    };

    const baseUser = {
        ssin: '111',
        firstName: 'firstName',
        lastName: 'Lastname',
    };

    beforeEach(async () => {
        serviceMock = {
            getPrescription: jest.fn(),
            getCurrentUser: jest.fn(),
            openApproveProposalDialog: jest.fn(),
            openRejectProposalDialog: jest.fn(),
        };

        accessMatrixStateMock = {
            hasAtLeastOnePermission: jest.fn().mockReturnValue(true),
        };

        translateServiceMock = {
            get: jest.fn((key: string, params?: any) => of(key)),
            onLangChange: of(null),
            onDefaultLangChange: of(null),
            onTranslationChange: of(null),
        };

        await TestBed.configureTestingModule({
            imports: [PrescriptionDetailsBottomComponent, MatNativeDateModule],
            providers: [
                { provide: PrescriptionDetailsSecondaryService, useValue: serviceMock },
                { provide: AccessMatrixState, useValue: accessMatrixStateMock },
                { provide: TranslateService, useValue: translateServiceMock },
            ],
        }).compileComponents();
    });

    function create(prescription: any, user: any = baseUser) {
        serviceMock.getPrescription.mockReturnValue({ data: prescription });
        serviceMock.getCurrentUser.mockReturnValue({ data: user });

        fixture = TestBed.createComponent(PrescriptionDetailsBottomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    it('should call translate with requester name when requester has lastName', () => {
        const prescription = {
            authoredOn: '2024-01-01',
            requester: {
                healthcarePerson: {
                    firstName: 'John',
                    lastName: 'Doe',
                    ssin: '0123',
                },
            },
        };

        create(prescription);

        expect(translateServiceMock.get).toHaveBeenCalledWith(
            'proposal.proposalInfoTitle',
            expect.objectContaining({
                firstName: 'John',
                lastName: 'Doe',
            })
        );
    });

    it('should call translate with current user name when requester has no lastName and is current user', () => {
        const currentUser = {
            ssin: '123',
            firstName: 'Alice',
            lastName: 'Smith',
        };

        const prescription = {
            authoredOn: '2024-01-01',
            requester: {
                healthcarePerson: {
                    firstName: '',
                    lastName: '',
                    ssin: '123',
                },
            },
        };

        create(prescription, currentUser);

        expect(translateServiceMock.get).toHaveBeenCalledWith(
            'proposal.proposalInfoTitle',
            expect.objectContaining({
                firstName: 'Alice',
                lastName: 'Smith',
            })
        );
    });

    it('should call translate with "common.professional.notFound" and show error icon when requester is unknown', () => {
        const prescription = {
            authoredOn: '2024-01-01',
            requester: {
                healthcarePerson: {
                    firstName: '',
                    lastName: '',
                    ssin: 'OTHER',
                },
            },
        };

        create(prescription);

        expect(translateServiceMock.get).toHaveBeenCalledWith(
            'proposal.proposalInfoTitle',
            expect.objectContaining({
                firstName: 'common.professional.notFound',
                lastName: '',
            })
        );

        const icon = fixture.debugElement.query(By.css('mat-icon'));
        expect(icon).not.toBeNull();
        expect(icon.nativeElement.textContent.trim()).toBe('error');
    });
});
