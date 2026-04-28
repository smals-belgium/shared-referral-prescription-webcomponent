import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfessionalCardsComponent } from './professional-cards.component';
import { RequestProfessionalDataService } from '@reuse/code/services/helpers/request-professional-data.service';
import { signal, SimpleChange, SimpleChanges } from '@angular/core';
import { MatRadioChange } from '@angular/material/radio';
import { TranslateModule } from '@ngx-translate/core';
import { Lang } from '@reuse/code/constants/languages';
import { ProviderType } from '@reuse/code/openapi';

const mockProfessionals = [
  {
    id: { ssin: '123', qualificationCode: 'Q1' },
    firstname: 'Jan',
    lastname: 'Janssens',
    type: ProviderType.Professional,
  },
  {
    id: { ssin: '456', qualificationCode: 'Q2' },
    firstname: 'Piet',
    lastname: 'Peeters',
    type: ProviderType.Professional,
  },
] as any[];

describe('ProfessionalCardsComponent', () => {
  let fixture: ComponentFixture<ProfessionalCardsComponent>;
  let component: ProfessionalCardsComponent;
  let dataServiceMock: jest.Mocked<RequestProfessionalDataService>;

  beforeEach(async () => {
    dataServiceMock = {
      data: signal([]),
      loading: signal(false),
      initializeCardsDataStream: jest.fn(),
      triggerLoad: jest.fn(),
      reset: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [ProfessionalCardsComponent, TranslateModule.forRoot()],
      providers: [{ provide: RequestProfessionalDataService, useValue: dataServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessionalCardsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('prescriptionId', 'RX-001');
    fixture.componentRef.setInput('category', 'physiotherapy');
    fixture.componentRef.setInput('intent', 'prescribe');
    fixture.componentRef.setInput('currentLang', Lang.NL.short);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('itemsLength', () => {
    it('should return -1 when total is null', () => {
      fixture.componentRef.setInput('total', null);
      fixture.detectChanges();

      expect(component.itemsLength).toBe(-1);
    });

    it('should return the total value when defined', () => {
      fixture.componentRef.setInput('total', 25);
      fixture.detectChanges();

      expect(component.itemsLength).toBe(25);
    });

    it('should return 0 when total is 0', () => {
      fixture.componentRef.setInput('total', 0);
      fixture.detectChanges();

      expect(component.itemsLength).toBe(0);
    });
  });

  describe('ngOnChanges', () => {
    it('should call initializeCardsDataStream when professionals change with data', () => {
      fixture.componentRef.setInput('professionals', mockProfessionals);
      fixture.detectChanges();

      const changes: SimpleChanges = {
        professionals: new SimpleChange(null, mockProfessionals, true),
      };
      component.ngOnChanges(changes);

      expect(dataServiceMock.initializeCardsDataStream).toHaveBeenCalled();
    });

    it('should not call initializeCardsDataStream when professionals change to empty', () => {
      dataServiceMock.initializeCardsDataStream.mockClear();

      fixture.componentRef.setInput('professionals', []);
      fixture.detectChanges();

      const changes: SimpleChanges = {
        professionals: new SimpleChange(null, [], true),
      };
      component.ngOnChanges(changes);

      expect(dataServiceMock.initializeCardsDataStream).not.toHaveBeenCalled();
    });

    it('should not call initializeCardsDataStream for unrelated changes', () => {
      dataServiceMock.initializeCardsDataStream.mockClear();

      const changes: SimpleChanges = {
        loading: new SimpleChange(false, true, false),
      };
      component.ngOnChanges(changes);

      expect(dataServiceMock.initializeCardsDataStream).not.toHaveBeenCalled();
    });
  });

  describe('canLoadMore', () => {
    it('should return true when total is null', () => {
      fixture.componentRef.setInput('total', null);
      fixture.detectChanges();

      expect(component.canLoadMore()).toBe(true);
    });

    it('should return true when requestData length is less than total', () => {
      fixture.componentRef.setInput('total', 10);
      fixture.detectChanges();

      expect(component.canLoadMore()).toBe(true);
    });

    it('should return false when requestData length equals total', () => {
      fixture.componentRef.setInput('total', 0);
      fixture.detectChanges();

      expect(component.canLoadMore()).toBe(false);
    });
  });

  describe('loadMore', () => {
    it('should trigger load on dataService', () => {
      component.loadMore();

      expect(dataServiceMock.triggerLoad).toHaveBeenCalled();
    });
  });

  describe('changeValue', () => {
    it('should emit the professional when radio is checked', () => {
      const emitSpy = jest.spyOn(component.selectProfessional, 'emit');
      const event = {
        source: { checked: true },
        value: mockProfessionals[0],
      } as unknown as MatRadioChange;

      component.changeValue(event);

      expect(emitSpy).toHaveBeenCalledWith(mockProfessionals[0]);
    });

    it('should emit undefined when radio is unchecked', () => {
      const emitSpy = jest.spyOn(component.selectProfessional, 'emit');
      const event = {
        source: { checked: false },
        value: mockProfessionals[0],
      } as unknown as MatRadioChange;

      component.changeValue(event);

      expect(emitSpy).toHaveBeenCalledWith(undefined);
    });
  });

  describe('trackById', () => {
    it('should return ssin + qualificationCode for a professional', () => {
      const result = component.trackById(mockProfessionals[0]);

      expect(result).toBe('123Q1');
    });
  });

  describe('ngOnDestroy', () => {
    it('should reset the data service on destroy', () => {
      component.ngOnDestroy();

      expect(dataServiceMock.reset).toHaveBeenCalled();
    });
  });
});
