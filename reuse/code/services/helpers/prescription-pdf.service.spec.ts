import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { DateTime } from 'luxon';
import * as pdfMake from 'pdfmake/build/pdfmake';
import { PrescriptionsPdfService } from './prescription-pdf.service';

jest.mock('pdfmake/build/pdfmake', () => ({
  createPdf: jest.fn().mockReturnValue({
    print: jest.fn(),
  }),
}));

const mockCreatePdf = pdfMake.createPdf as jest.MockedFunction<typeof pdfMake.createPdf>;

const mockPrescription = {
  id: 'prescription-123',
  shortCode: 'ABC123',
  authoredOn: '2023-10-15',
  period: {
    start: '2023-10-15',
    end: '2024-10-15',
  },
  requester: {
    healthcarePerson: {
      firstName: 'John',
      lastName: 'Doe',
    },
    nihii8: '12345678',
  },
};

const mockPatient = {
  firstName: 'Jane',
  lastName: 'Doe',
  ssin: '12345678901',
};

const mockTemplate = {
  labelTranslations: {
    nl: 'Dutch Label',
    fr: 'French Label',
    en: 'English label',
    de: 'German Label',
  },
};

const mockTemplateVersion = {
  elements: [
    {
      id: 'element1',
      labelTranslationId: 'label1',
      viewType: 'text',
      responses: [],
    },
  ],
  translations: {
    label1: {
      nl: 'Dutch Translation',
      fr: 'French Translation',
      en: 'English label',
      de: 'German Label',
    },
  },
};

describe('PrescriptionsPdfService', () => {
  let service: PrescriptionsPdfService;
  let translateService: jest.Mocked<TranslateService>;

  beforeEach(() => {
    const translateServiceMock = {
      instant: jest.fn().mockImplementation((key: string, params?: any) => {
        const translations: Record<string, string> = {
          'common.typeOfPrescription': 'Type of Prescription',
        };
        return translations[key] || key;
      }),
    };

    TestBed.configureTestingModule({
      providers: [PrescriptionsPdfService, { provide: TranslateService, useValue: translateServiceMock }],
    });

    service = TestBed.inject(PrescriptionsPdfService);
    translateService = TestBed.inject(TranslateService) as jest.Mocked<TranslateService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call pdfMake.createPdf with correct structure when printPDF is called', () => {
    const responses = { element1: 'test value' };

    service.printPDF(mockPrescription, responses, mockPatient, mockTemplate, mockTemplateVersion, 'nl');

    expect(mockCreatePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 'A4',
        pageMargins: [24, 24, 24, 30],
        info: {
          title: 'prescription-123',
          subject: 'prescription-123',
          author: 'RIZIV - INAMI',
        },
        defaultStyle: {
          font: 'OpenSans',
        },
      }),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should generate header with current date', () => {
    const mockDate = '15-10-2023';
    jest.spyOn(DateTime, 'now').mockReturnValue({
      toFormat: jest.fn().mockReturnValue(mockDate),
    } as any);

    service.printPDF(mockPrescription, {}, mockPatient, mockTemplate, mockTemplateVersion, 'nl');

    expect(translateService.instant).toHaveBeenCalledWith('prescription.print.date', { date: mockDate });
  });

  it('should return correct NIHII from getNihii method', () => {
    const requesterWithNihii8 = { nihii8: '12345678' };
    const requesterWithNihii11 = { nihii11: '12345678901' };
    const requesterWithBoth = { nihii8: '12345678', nihii11: '12345678901' };

    expect(service.getNihii(requesterWithNihii8)).toBe('12345678');
    expect(service.getNihii(requesterWithNihii11)).toBe('12345678901');
    expect(service.getNihii(requesterWithBoth)).toBe('12345678'); // nihii8 takes precedence
    expect(service.getNihii(undefined)).toBe('');
  });

  it('should wrap long words correctly', () => {
    const wrapLongWords = (service as any).wrapLongWords.bind(service);

    const shortText = 'Short text';
    const longText = 'This is a very long text that should be wrapped';

    expect(wrapLongWords(shortText)).toBe('Short text');
    expect(wrapLongWords(longText, 10)).toContain('-\n');
    expect(wrapLongWords('')).toBe('');
  });

  it('should format dates correctly', () => {
    const formatDate = (service as any).formatDate.bind(service);

    expect(formatDate('2023-10-15', 'dd/MM/yyyy')).toBe('15/10/2023');
    expect(formatDate(new Date('2023-10-15'), 'dd/MM/yyyy')).toBe('15/10/2023');
    expect(formatDate(undefined, 'dd/MM/yyyy')).toBe('');
    expect(formatDate('', 'dd/MM/yyyy')).toBe('');
  });

  it('should handle occurrenceTiming viewType in getResponseLabels', () => {
    const getResponseLabels = (service as any).getResponseLabels.bind(service);
    const elementWithTiming = {
      viewType: 'occurrenceTiming',
      responses: [],
    };
    const responses = {
      occurrenceTiming: { repeat: { frequency: 1, period: 1, periodUnit: 'day' } },
    };

    const result = getResponseLabels('test', elementWithTiming, mockTemplateVersion, responses, 'nl');
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle array values in getResponseLabels', () => {
    const getResponseLabels = (service as any).getResponseLabels.bind(service);
    const elementWithResponses = {
      viewType: 'select',
      responses: [
        { value: 'option1', labelTranslationId: 'label1' },
        { value: 'option2', labelTranslationId: 'label2' },
      ],
    };

    const result = getResponseLabels(['option1', 'option2'], elementWithResponses, mockTemplateVersion, {}, 'nl');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(['Dutch Translation']);
  });

  it('should handle date string values in getResponseLabels', () => {
    const getResponseLabels = (service as any).getResponseLabels.bind(service);
    const elementWithoutResponses = {
      viewType: 'date',
      responses: [],
    };

    const result = getResponseLabels('2023-10-15', elementWithoutResponses, mockTemplateVersion, {}, 'nl');
    expect(result[0]).toBe('15/10/2023');
  });

  it('should handle single response values in getResponseLabels', () => {
    const getResponseLabels = (service as any).getResponseLabels.bind(service);
    const elementWithResponses = {
      viewType: 'radio',
      responses: [{ value: 'option1', labelTranslationId: 'label1' }],
    };

    const result = getResponseLabels('option1', elementWithResponses, mockTemplateVersion, {}, 'nl');
    expect(result).toEqual(['Dutch Translation']);
  });

  it('should return fallback when translation not found in evfTranslate', () => {
    const evfTranslate = (service as any).evfTranslate.bind(service);
    const templateWithoutTranslation = {
      translations: {},
      commonTranslations: {},
    };

    const result = evfTranslate(templateWithoutTranslation, 'nonexistent', 'nl');
    expect(result).toBe('Translation not found for "nonexistent"');
  });

  it('should generate prescription info table with correct structure', () => {
    const generatePrescriptionInfoTable = (service as any).generatePrescriptionInfoTable.bind(service);
    const responses = { element1: 'test value' };

    const result = generatePrescriptionInfoTable(mockPrescription, responses, mockTemplateVersion, mockTemplate, 'nl');

    expect(result.layout).toBe('prescriptionTableLayout');
    expect(result.table.widths).toEqual(['*', '*']);
    expect(result.table.body.length).toBeGreaterThan(0);
    expect(result.table.body[0][0].stack[0].text).toBe('Type of Prescription');
  });
});
