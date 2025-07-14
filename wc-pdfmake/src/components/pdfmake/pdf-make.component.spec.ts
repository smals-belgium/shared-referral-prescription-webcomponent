import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {PrescriptionsPdfService} from '@reuse/code/services/prescription-pdf.service';
import {PdfMakeWebComponent} from './pdf-make.component';
import {SimpleChange} from "@angular/core";
import {EvfTemplate, Person, ReadPrescription} from "@reuse/code/interfaces";
import {FormTemplate} from "@smals/vas-evaluation-form-ui-core";

describe('PdfMakeWebComponent', () => {
    let component: PdfMakeWebComponent;
    let fixture: ComponentFixture<PdfMakeWebComponent>;
    let mockPdfService: Partial<PrescriptionsPdfService>;
    let translate: TranslateService;

    beforeEach(async () => {
        mockPdfService = {
            printPDF: jest.fn()
        };

        await TestBed.configureTestingModule({
            imports: [PdfMakeWebComponent, TranslateModule.forRoot()],
            providers: [
                {provide: PrescriptionsPdfService, useValue: mockPdfService},
                // {provide: TranslateService, useValue: translate}
            ]
        }).compileComponents();

        translate = TestBed.inject(TranslateService);
        translate.setDefaultLang('nl-BE');
        translate.use('nl-BE');

        fixture = TestBed.createComponent(PdfMakeWebComponent);
        component = fixture.componentInstance;

        // Setup defaults
        component.prescription = {} as ReadPrescription;
        component.responses = {test: 'value'};
        component.patient = {firstName: 'John'} as Person;
        component.template = {} as EvfTemplate;
        component.templateVersion = {} as FormTemplate;

        fixture.detectChanges();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should change language when lang input changes', () => {
        component.lang = 'fr';
        const translateSpy = jest.spyOn(translate, 'use');

        component.ngOnChanges({
            lang: {
                currentValue: 'fr',
                previousValue: 'en',
                firstChange: false,
                isFirstChange: () => false
            }
        });

        expect(translateSpy).toHaveBeenCalledWith('fr');
    });
    it('should call printPDF and emit pdfReady when required inputs change', () => {
        const pdfSpy = jest.spyOn(mockPdfService, 'printPDF');
        const emitSpy = jest.spyOn(component.pdfReady, 'emit');

        component.ngOnChanges({
            prescription: new SimpleChange(null, component.prescription, true),
        });

        expect(pdfSpy).toHaveBeenCalled();

        expect(mockPdfService.printPDF).toHaveBeenCalledWith(
            component.prescription,
            component.responses,
            component.patient,
            component.template,
            component.templateVersion,
            translate.currentLang
        );

        expect(emitSpy).toHaveBeenCalled();
    });

    it('should not call printPDF if required inputs are missing', () => {
        component.prescription = undefined as any;
        const pdfSpy = jest.spyOn(mockPdfService, 'printPDF');
        const emitSpy = jest.spyOn(component.pdfReady, 'emit');

        component.ngOnChanges({
            prescription: {
                currentValue: undefined,
                previousValue: null,
                firstChange: true,
                isFirstChange: () => true
            }
        });

        expect(pdfSpy).not.toHaveBeenCalled();
        expect(mockPdfService.printPDF).not.toHaveBeenCalled();
        expect(emitSpy).not.toHaveBeenCalled()
    });

    it('should not call printPDF or emit if irrelevant input changes', () => {
        const emitSpy = jest.spyOn(component.pdfReady, 'emit');

        component.ngOnChanges({
            lang: {
                currentValue: 'fr',
                previousValue: 'nl-BE',
                firstChange: false,
                isFirstChange: () => false
            }
        });

        expect(mockPdfService.printPDF).not.toHaveBeenCalled();
        expect(emitSpy).not.toHaveBeenCalled();
    });
});

