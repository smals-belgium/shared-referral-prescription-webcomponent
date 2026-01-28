import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { PrescriptionsPdfService } from './prescription-pdf.service';
import {
  CanvasLine,
  ContentCanvas,
  ContentColumns,
  ContentStack,
  ContentTable,
  ContentText,
  CustomTableLayout,
  DynamicCellLayout,
  PatternFill,
} from 'pdfmake/interfaces';

jest.mock('pdfmake/build/pdfmake', () => ({
  createPdf: jest.fn().mockReturnValue({
    print: jest.fn(),
  }),
}));

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
      instant: jest.fn().mockImplementation((key: string) => {
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

  it('should return correct NIHII from getNihii method', () => {
    const requesterWithNihii8 = { nihii8: '12345678' };
    const requesterWithNihii11 = { nihii11: '12345678901' };
    const requesterWithBoth = { nihii8: '12345678', nihii11: '12345678901' };

    expect(service.getNihii(requesterWithNihii8)).toBe('1-23456-78-');
    expect(service.getNihii(requesterWithNihii11)).toBe('1-23456-78-901');
    expect(service.getNihii(requesterWithBoth)).toBe('1-23456-78-'); // nihii8 takes precedence
    expect(service.getNihii(undefined)).toBe('');
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

  describe('parseMarkdownList', () => {
    it('should parse markdown list items and strip prefixes', () => {
      const markdown = '> - First item\n> - Second item\n> - Third item';

      const result = service['parseMarkdownList'](markdown);

      expect(result).toEqual(['First item', 'Second item', 'Third item']);
    });

    it('should filter empty lines and trim whitespace', () => {
      const markdown = '> - Item one\n\n  > - Item two  \n';

      const result = service['parseMarkdownList'](markdown);

      expect(result).toEqual(['Item one', 'Item two']);
    });
  });

  describe('buildAlertBox', () => {
    it('should return cancel alert when prescription is cancelled', () => {
      translateService.instant.mockReturnValue('Cancelled message');
      const templateVersion = { elements: [] };

      const result = service['buildAlertBox'](templateVersion as any, 'nl', true);

      expect(result).toMatchObject({
        table: { widths: [18, '*'] },
        layout: expect.objectContaining({ fillColor: expect.any(Function) }),
      });

      const tableContent = result as ContentTable;

      expect(tableContent?.layout).not.toBeNull();
      const layout = tableContent?.layout as CustomTableLayout;
      expect(layout?.fillColor).not.toBeNull();
      const fillColor = layout?.fillColor as DynamicCellLayout<string | PatternFill>;
      expect(fillColor(0, {} as any, 0)).toBe('#FFF6F5');
    });

    it('should return info alert when info element exists', () => {
      const templateVersion = {
        elements: [{ viewType: 'info', bodyTranslationId: 'info.body' }],
        translations: { 'info.body': { nl: '> - Info item' } },
      };

      const result = service['buildAlertBox'](templateVersion as any, 'nl', false);

      expect(result).not.toBeNull();

      const tableContent = result as ContentTable;
      expect(tableContent?.layout).not.toBeNull();
      const layout = tableContent?.layout as CustomTableLayout;
      expect(layout?.fillColor).not.toBeNull();
      const fillColor = layout?.fillColor as DynamicCellLayout<string | PatternFill>;
      expect(fillColor(0, {} as any, 0)).toBe('#F2F7FD');
    });

    it('should return null when no info element exists', () => {
      const templateVersion = { elements: [{ viewType: 'text' }] };

      const result = service['buildAlertBox'](templateVersion as any, 'nl', false);

      expect(result).toBeNull();
    });
  });

  describe('buildTitleSection', () => {
    it('should include short label when available', () => {
      const template = {
        labelTranslations: { nl: 'Main Title' },
        shortLabelTranslations: { nl: 'Short Label' },
      };

      const result = service['buildTitleSection'](template as any, 'nl') as { stack: any[] };

      expect(result.stack).toHaveLength(2);
      expect(result.stack[0].text).toBe('Main Title');
      expect(result.stack[1].text).toBe('Short Label');
    });
  });

  describe('buildBeneficiaryBox', () => {
    it('should build patient box with full name and formatted SSIN', () => {
      const patient = { firstName: 'John', lastName: 'Doe', ssin: '12345678901' };

      const result = service['buildBeneficiaryBox'](patient as any, 'ABC123');

      const tableContent = result as ContentTable;
      const bodyStack = tableContent.table.body[0][0] as ContentStack;
      const stack = bodyStack.stack as ContentText[];
      expect(stack[0].text).toBe('prescription.print.patient');
      expect(stack[1].text).toBe('John Doe');
      expect(stack[1].bold).toBe(true);

      const subStack = stack[2].text as ContentText[];
      expect(subStack[0].text).toBe('12.34.56-789.01');
      expect(subStack[2].text).toBe('ABC123');
    });

    it('should handle missing patient names gracefully', () => {
      const patient = { firstName: null, lastName: undefined, ssin: null };

      const result = service['buildBeneficiaryBox'](patient as any);
      const tableContent = result as ContentTable;
      const bodyStack = tableContent.table.body[0][0] as ContentStack;
      const stack = bodyStack.stack as ContentText[];
      expect(stack[1].text).toBe(' ');

      const subStack = stack[2].text as ContentText[];
      expect(subStack[0].text).toBe('');
      expect(subStack[2].text).toBe('');
    });

    it('should apply correct border colors', () => {
      const patient = { firstName: 'Jane', lastName: 'Doe' };

      const result = service['buildBeneficiaryBox'](patient as any);

      const tableContent = result as ContentTable;
      expect(tableContent?.layout).not.toBeNull();
      const layout = tableContent?.layout as CustomTableLayout;
      expect(layout?.fillColor).not.toBeNull();
      const hLineColor = layout?.hLineColor as DynamicCellLayout<string | PatternFill>;
      const vLineColor = layout?.vLineColor as DynamicCellLayout<string | PatternFill>;

      expect(hLineColor(0, {} as any, 0)).toBe('#0d6efd');
      expect(vLineColor(0, {} as any, 0)).toBe('#0d6efd');
    });
  });

  describe('definitionRow', () => {
    it('should create stack with bold label and plain value', () => {
      const result = service['definitionRow']('Label Text', 'Value Text');

      expect(result).toEqual({
        stack: [{ text: 'Label Text', bold: true }, { text: 'Value Text' }],
        margin: [0, 0, 0, 6],
      });
    });
  });

  describe('buildDefinitionRows', () => {
    beforeEach(() => {
      service['formatDate'] = jest.fn((date: string) => (date ? `formatted-${date}` : ''));
      service['evfTranslate'] = jest.fn(() => 'Translated Label');
      service['getResponseLabels'] = jest.fn(() => ['Response Value']);
    });

    it('should build static rows from prescription data', () => {
      const prescription = {
        authoredOn: '2024-01-15',
        period: { start: '2024-01-15', end: '2024-02-15' },
      };
      const template = { labelTranslations: { nl: 'Template Name' } };
      const templateVersion = { elements: [] };

      const result = service['buildDefinitionRows'](
        prescription as any,
        {},
        template as any,
        templateVersion as any,
        'nl'
      );

      expect(result).toHaveLength(3);

      const results = result as ContentText[];
      expect(results[0].stack?.[0]).not.toBeNull();
      const stackText = results[0].stack?.[0] as unknown as ContentText;
      expect(stackText.text).toBe('Type of Prescription');

      expect(results[0].stack?.[1]).not.toBeNull();
      const stackText1 = results[0].stack?.[1] as unknown as ContentText;
      expect(stackText1.text).toBe('Template Name');

      expect(results[1].stack?.[0]).not.toBeNull();
      const stackText2 = results[1].stack?.[0] as unknown as ContentText;
      expect(stackText2.text).toBe('prescription.prescriptionDate');

      expect(results[2].stack?.[0]).not.toBeNull();
      const stackText3 = results[2].stack?.[0] as unknown as ContentText;
      expect(stackText3.text).toBe('prescription.validityPeriod');
    });

    it('should include dynamic rows from template elements with responses', () => {
      const prescription = {
        authoredOn: '2024-01-15',
        period: { start: '2024-01-15', end: '2024-02-15' },
      };
      const template = { labelTranslations: { nl: 'Template Name' } };
      const templateVersion = {
        elements: [
          { id: 'elem1', labelTranslationId: 'label1' },
          { id: 'elem2', labelTranslationId: 'label2' },
        ],
      };
      const responses = { elem1: 'answer1' }; // elem2 has no response

      const result = service['buildDefinitionRows'](
        prescription as any,
        responses,
        template as any,
        templateVersion as any,
        'nl'
      );

      expect(result).toHaveLength(4); // 3 static + 1 dynamic
      expect(service['evfTranslate']).toHaveBeenCalledWith(templateVersion, 'label1', 'nl');
      expect(service['getResponseLabels']).toHaveBeenCalledTimes(1);
    });

    it('should filter out rows with empty values but still display validityPeriod with empty values', () => {
      const prescription = {
        authoredOn: null,
        period: { start: null, end: null },
      };
      const template = { labelTranslations: { nl: '' } };
      const templateVersion = { elements: [] };

      const result = service['buildDefinitionRows'](
        prescription as any,
        {},
        template as any,
        templateVersion as any,
        'nl'
      );

      expect(result).toHaveLength(1);
      const results = result as ContentText[];
      expect(results[0].stack).toBeTruthy();
      const stacks = results[0].stack as unknown as ContentText[];
      expect(stacks[0].text).toBe('prescription.validityPeriod');
      expect(stacks[0].bold).toBe(true);
      expect(stacks[1].text).toBe(' - ');
    });
  });

  describe('buildPrescriberSection', () => {
    beforeEach(() => {
      service['getNihii'] = jest.fn(() => 'NIHII-12345');
    });

    it('should build prescriber section with all details', () => {
      translateService.instant.mockImplementation(key => key);
      const prescription = {
        requester: {
          healthcarePerson: { firstName: 'Dr. Jane', lastName: 'Smith' },
          healthcareQualification: { id: { profession: 'doctor' } },
        },
      };

      const result = service['buildPrescriberSection'](prescription as any);

      const results = result as ContentText;
      expect(results.stack?.[0]).not.toBeNull();
      const stackText = results.stack?.[0] as unknown as ContentText;
      expect(stackText.text).toBe('prescription.print.prescriber');
      expect(stackText.bold).toBe(true);

      expect(results.stack?.[1]).not.toBeNull();
      const stackText1 = results.stack?.[1] as unknown as ContentText;
      expect(stackText1.text).toBe('Dr. Jane Smith');

      expect(results.stack?.[2]).not.toBeNull();
      const stackText2 = results.stack?.[2] as unknown as ContentText;
      expect(stackText2.text).toBe('NIHII-12345');

      expect(results.stack?.[3]).not.toBeNull();
      const stackText3 = results.stack?.[3] as unknown as ContentText;
      expect(stackText3.text).toBe('common.professions.doctor');
    });

    it('should handle missing profession gracefully', () => {
      const prescription = {
        requester: {
          healthcarePerson: { firstName: 'John', lastName: 'Doe' },
          healthcareQualification: { id: {} },
        },
      };

      const result = service['buildPrescriberSection'](prescription as any);

      const results = result as ContentText;
      expect(results.stack?.[3]).not.toBeNull();
      const stackText3 = results.stack?.[3] as unknown as ContentText;
      expect(stackText3.text).toBe('');
    });
  });

  describe('buildDisclaimer', () => {
    it('should create disclaimer table with gray background', () => {
      translateService.instant.mockReturnValue('Disclaimer text');

      const result = service['buildDisclaimer']();

      const tableContent = result as ContentTable;
      expect(tableContent?.table).not.toBeNull();
      expect(tableContent.table.widths).toEqual(['*']);

      const bodyStack = tableContent.table.body[0][0] as ContentStack;
      expect(bodyStack.text).toBe('Disclaimer text');
      expect(bodyStack.fillColor).toBe('#f2f2f2');

      expect(tableContent.layout).toBe('noBorders');
    });
  });

  describe('buildDashLine', () => {
    it('should create dashed line canvas element', () => {
      const result = service['buildDashLine']();
      const results = result as ContentCanvas;
      const line = results.canvas?.[0] as CanvasLine;

      expect(line).not.toBeNull();

      expect(line.type).toBe('line');
      expect(line.x2).toBe(595);
      expect(line.dash).toEqual({ length: 4, space: 2 });
      expect(line.lineColor).toBe('#9C9C9C');
    });

    it('should have negative left margin for full-width line', () => {
      const result = service['buildDashLine']();

      const results = result as ContentCanvas;
      expect(results.margin).toEqual([-40, 10, 0, 10]);
    });
  });

  describe('buildHeaderSubSection', () => {
    it('should build header with current date', () => {
      service['getCurrentDate'] = jest.fn(() => '15/01/2024');
      translateService.instant.mockReturnValue('Printed on 15/01/2024');

      const result = service['buildHeaderSubSection']();

      expect(translateService.instant).toHaveBeenCalledWith('prescription.print.subsection.header', {
        date: '15/01/2024',
      });

      const results = result as ContentColumns;
      const column = results.columns[0] as ContentText;
      expect(column.text).toBe('Printed on 15/01/2024');
      expect(column.color).toBe('#5C5C5C');
    });
  });

  describe('buildTitleSubSection', () => {
    it('should build title with template label and patient info', () => {
      const template = { labelTranslations: { nl: 'Prescription Title' } };
      const patient = { ssin: '12345678901' };

      const result = service['buildTitleSubSection'](template as any, 'nl', patient as any, 'SHORT123');

      const results = result as ContentText;
      expect(results.stack?.[0]).not.toBeNull();
      const stackText = results.stack?.[0] as unknown as ContentText;
      expect(stackText.text).toBe('Prescription Title');
      expect(stackText.fontSize).toBe(12);
      expect(stackText.bold).toBe(true);

      expect(results.stack?.[1]).not.toBeNull();
      const stackText1 = results.stack?.[1] as unknown as ContentText;

      expect(stackText1.text).toHaveLength(3);
      const stackText2 = stackText1.text as ContentText[];
      expect(stackText2[0].text).toBe('12.34.56-789.01');
      expect(stackText2[2].text).toBe('SHORT123');
    });

    it('should handle missing SSIN and shortCode', () => {
      const template = { labelTranslations: { nl: 'Title' } };
      const patient = { ssin: null };

      const result = service['buildTitleSubSection'](template as any, 'nl', patient as any);
      const results = result as ContentText;

      expect(results.stack?.[1]).not.toBeNull();
      const stackText1 = results.stack?.[1] as unknown as ContentText;

      expect(stackText1.text).toHaveLength(3);
      const stackText2 = stackText1.text as ContentText[];
      expect(stackText2[0].text).toBe('');
      expect(stackText2[2].text).toBe('');
    });
  });

  describe('buildPatienInfoSubSection', () => {
    it('should display patient label and full name', () => {
      const patient = { firstName: 'Alice', lastName: 'Johnson' };

      const result = service['buildPatienInfoSubSection'](patient as any);
      const results = result as ContentText;

      expect(results.stack?.[0]).not.toBeNull();
      const stackText = results.stack?.[0] as unknown as ContentText;
      expect(stackText.text).toBe('prescription.print.subsection.patient');
      expect(stackText.color).toBe('#5C5C5C');

      expect(results.stack?.[1]).not.toBeNull();
      const stackText1 = results.stack?.[1] as unknown as ContentText;
      expect(stackText1.text).toBe('Alice Johnson');
    });

    it('should handle null/undefined names', () => {
      const patient = { firstName: null, lastName: undefined };

      const result = service['buildPatienInfoSubSection'](patient as any);
      const results = result as ContentText;
      expect(results.stack?.[1]).not.toBeNull();
      const stackText1 = results.stack?.[1] as unknown as ContentText;
      expect(stackText1.text).toBe(' ');
    });
  });

  describe('buildValidityPeriodSubSection', () => {
    beforeEach(() => {
      service['formatDate'] = jest.fn(date => (date ? `formatted-${date as string}` : ''));
    });

    it('should build validity period table with start and end dates', () => {
      const prescription = {
        period: { start: '2024-01-15', end: '2024-02-15' },
      };

      const result = service['buildValidityPeriodSubSection'](prescription as any);

      const tableContent = result as ContentTable;
      expect(tableContent?.table).not.toBeNull();
      expect(tableContent.table.widths).toEqual(['auto', 'auto']);
      // Header row
      const bodyStack = tableContent.table.body[0][0] as ContentStack;
      expect(bodyStack.text).toBe('prescription.print.subsection.startDate');
      const bodyStack1 = tableContent.table.body[0][1] as ContentStack;
      expect(bodyStack1.text).toBe('prescription.print.subsection.endDate');
      // Value row
      const bodyStack2 = tableContent.table.body[1][0] as ContentStack;
      expect(bodyStack2.text).toBe('formatted-2024-01-15');
      const bodyStack3 = tableContent.table.body[1][1] as ContentStack;
      expect(bodyStack3.text).toBe('formatted-2024-02-15');
    });

    it('should apply zero-padding layout', () => {
      const prescription = { period: { start: null, end: null } };

      const result = service['buildValidityPeriodSubSection'](prescription as any);

      const tableContent = result as ContentTable;
      expect(tableContent?.layout).not.toBeNull();
      const layout = tableContent?.layout as CustomTableLayout;

      const hLineWidth = layout?.hLineWidth as DynamicCellLayout<string | PatternFill>;
      expect(hLineWidth(0, {} as any, 0)).toBe(0);

      const vLineWidth = layout?.vLineWidth as DynamicCellLayout<string | PatternFill>;
      expect(vLineWidth(0, {} as any, 0)).toBe(0);

      const paddingTop = layout?.paddingTop as DynamicCellLayout<string | PatternFill>;
      expect(paddingTop(0, {} as any, 0)).toBe(0);

      const paddingBottom = layout?.vLineWidth as DynamicCellLayout<string | PatternFill>;
      expect(paddingBottom(0, {} as any, 0)).toBe(0);

      const paddingLeft = layout?.vLineWidth as DynamicCellLayout<string | PatternFill>;
      expect(paddingLeft(0, {} as any, 0)).toBe(0);

      const paddingRight = layout?.vLineWidth as DynamicCellLayout<string | PatternFill>;
      expect(paddingRight(0, {} as any, 0)).toBe(0);
    });

    it('should handle missing period gracefully', () => {
      const prescription = { period: undefined };

      const result = service['buildValidityPeriodSubSection'](prescription as any);

      const tableContent = result as ContentTable;
      expect(tableContent?.table).not.toBeNull();
      const bodyStack = tableContent.table.body[1][0] as ContentStack;
      expect(bodyStack.text).toBe('');

      const bodyStack1 = tableContent.table.body[1][1] as ContentStack;
      expect(bodyStack1.text).toBe('');
    });
  });
});
