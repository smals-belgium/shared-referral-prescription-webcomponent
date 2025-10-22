import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionsModelsCardComponent } from './prescriptions-models-card.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DateAdapter } from '@angular/material/core';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { DataLoadConfig, RequestSummaryDataService } from '@reuse/code/services/helpers/request-summary-data.service';
import { BehaviorSubject, of } from 'rxjs';
import { Discipline, ModelEntityDto, PageModelEntityDto } from '@reuse/code/openapi';
import { FormatEnum } from '@reuse/code/components/progress-indicators/skeleton/skeleton.component';
import { ElementRef, SimpleChanges } from '@angular/core';
import { Intent } from '@reuse/code/interfaces';
import { PseudoService } from '@reuse/code/services/privacy/pseudo.service';

const mockConfigService = {
  getEnvironment: jest.fn(),
  getEnvironmentVariable: jest.fn(),
};

const mockPerson = {
  ssin: '90122712173',
  name: 'name of patient',
};

const mockAuthService = {
  init: jest.fn(),
  getClaims: jest.fn(() =>
    of({
      userProfile: mockPerson,
    })
  ),
  isProfessional: jest.fn(() => of(false)),
  discipline: jest.fn(() => of(Discipline.Nurse)),
};

const mockDataService = {
  modelEntityData$: new BehaviorSubject([]),
  loading$: new BehaviorSubject(false),
  initializeDataStream: jest.fn(),
  triggerLoad: jest.fn(),
  retryLoad: jest.fn(),
  reset: jest.fn(),
} as any;

class FakeLoader implements TranslateLoader {
  getTranslation() {
    return of({});
  }
}

const mockModelEntityDto: ModelEntityDto = {
  id: 1,
  label: 'Test Description',
};

const mockModelEntityPage: PageModelEntityDto = {
  content: [mockModelEntityDto],
  numberOfElements: 1,
  totalElements: 10,
};
const mockModelEntityPage10: PageModelEntityDto = {
  content: [mockModelEntityDto],
  numberOfElements: 10,
  totalElements: 10,
};

describe('PrescriptionsModelsCardComponent', () => {
  let component: PrescriptionsModelsCardComponent;
  let fixture: ComponentFixture<PrescriptionsModelsCardComponent>;
  let mockObserve: jest.Mock;
  let mockDisconnect: jest.Mock;
  let observerCallback: IntersectionObserverCallback;

  beforeEach(async () => {
    mockObserve = jest.fn();
    mockDisconnect = jest.fn();

    global.IntersectionObserver = jest.fn().mockImplementation(callback => {
      observerCallback = callback;
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: jest.fn(),
        takeRecords: jest.fn(),
        root: null,
        rootMargin: '',
        thresholds: [],
      };
    }) as any;

    await TestBed.configureTestingModule({
      imports: [
        PrescriptionsModelsCardComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DateAdapter,
        { provide: ConfigurationService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
      .overrideComponent(PrescriptionsModelsCardComponent, {
        set: {
          providers: [{ provide: RequestSummaryDataService, useValue: mockDataService }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PrescriptionsModelsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create and initialize with default values', () => {
    expect(component).toBeTruthy();
    expect(component.loading).toBe(false);
    expect(component.error).toBe(false);
    expect(component.errorMsg).toBe('');
    expect((component as any).FormatEnum).toBe(FormatEnum);
  });

  it('should calculate itemsLength correctly', () => {
    component.modelEntityPage = undefined;
    expect(component.itemsLength).toBe(-1);

    component.modelEntityPage = { numberOfElements: undefined } as any;
    expect(component.itemsLength).toBe(-1);

    component.modelEntityPage = mockModelEntityPage;
    expect(component.itemsLength).toBe(1);
  });

  it('should initialize data stream when modelEntityPage changes with content', () => {
    component.modelEntityPage = mockModelEntityPage;

    const changes: SimpleChanges = {
      modelEntityPage: {
        currentValue: mockModelEntityPage,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    };

    jest.spyOn(component as any, 'initializeDataStream');
    component.ngOnChanges(changes);

    expect(component['initializeDataStream']).toHaveBeenCalled();
  });

  it('should trigger loadMore when anchor element intersects', () => {
    component.modelEntityPage = mockModelEntityPage10;
    component.loading = false;
    component.error = false;
    expect(component.itemsLength).toBe(10);

    jest.spyOn(component, 'loadMore');
    jest.spyOn(component, 'canLoadMore').mockReturnValue(true);
    jest.spyOn(component, 'isLoading').mockReturnValue(false);

    const mockScrollframe = document.createElement('div');
    const mockAnchor = document.createElement('div');
    component.scrollframe = { nativeElement: mockScrollframe } as ElementRef;
    component.anchor = { nativeElement: mockAnchor } as ElementRef;

    component.ngAfterViewInit();

    expect(mockObserve).toHaveBeenCalledWith(mockAnchor);

    // Simulate intersection
    observerCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(component.loadMore).toHaveBeenCalled();
  });

  it('should not trigger loadMore when conditions are not met', () => {
    component.modelEntityPage = mockModelEntityPage10;
    component.loading = true;
    component.error = false;
    expect(component.itemsLength).toBe(10);

    jest.spyOn(component, 'loadMore');
    jest.spyOn(component, 'canLoadMore').mockReturnValue(true);
    jest.spyOn(component, 'isLoading').mockReturnValue(false);

    const mockScrollframe = document.createElement('div');
    const mockAnchor = document.createElement('div');
    component.scrollframe = { nativeElement: mockScrollframe } as ElementRef;
    component.anchor = { nativeElement: mockAnchor } as ElementRef;

    component.ngAfterViewInit();

    // Simulate intersection
    observerCallback!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(component.loadMore).not.toHaveBeenCalled();
  });

  it('should not trigger loadMore when not intersecting', () => {
    component.modelEntityPage = mockModelEntityPage10;
    component.loading = false;
    component.error = false;
    expect(component.itemsLength).toBe(10);

    jest.spyOn(component, 'loadMore');
    jest.spyOn(component, 'canLoadMore').mockReturnValue(true);
    jest.spyOn(component, 'isLoading').mockReturnValue(false);

    const mockScrollframe = document.createElement('div');
    const mockAnchor = document.createElement('div');
    component.scrollframe = { nativeElement: mockScrollframe } as ElementRef;
    component.anchor = { nativeElement: mockAnchor } as ElementRef;

    component.ngAfterViewInit();

    // Simulate no intersection
    observerCallback!([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(component.loadMore).not.toHaveBeenCalled();
  });

  it('should determine if more items can be loaded', () => {
    // No page - should return true
    component.modelEntityPage = undefined;
    expect(component.canLoadMore()).toBe(true);

    // Has more items to load
    component.modelEntityPage = { content: [mockModelEntityDto], totalElements: 10 };
    mockDataService.modelEntityData$.next([mockModelEntityDto]);
    expect(component.canLoadMore()).toBe(true);

    // All items loaded
    const allItems = Array(10).fill(mockModelEntityDto);
    component.modelEntityPage = { content: allItems, numberOfElements: 10, totalElements: 10 };
    expect(component.itemsLength).toBe(10);
    mockDataService.modelEntityData$.next(allItems);
    expect(component.canLoadMore()).toBe(false);
  });

  it('should call dataService.triggerLoad and emit events correctly', () => {
    // Test loadMore
    component.loadMore();
    expect(mockDataService.triggerLoad).toHaveBeenCalled();

    // Test output events
    jest.spyOn(component.openPrescriptionModel, 'emit');
    jest.spyOn(component.deletePrescriptionModel, 'emit');

    component.openPrescriptionModel.emit(mockModelEntityDto);
    component.deletePrescriptionModel.emit(mockModelEntityDto);

    expect(component.openPrescriptionModel.emit).toHaveBeenCalledWith(mockModelEntityDto);
    expect(component.deletePrescriptionModel.emit).toHaveBeenCalledWith(mockModelEntityDto);
  });

  it('should handle error retry correctly', () => {
    mockDataService.modelEntityData$.next([mockModelEntityDto]);
    jest.spyOn(component.retryOnError, 'emit');

    component.onErrorRetryClick();

    expect(component.error).toBe(false);
    expect(mockDataService.retryLoad).toHaveBeenCalledWith(1);
  });

  it('should handle action button click and stop event propagation', () => {
    const mockEvent = {
      stopPropagation: jest.fn(),
    } as any;

    jest.spyOn(component.deletePrescriptionModel, 'emit');

    component.onActionButtonClick(mockEvent, mockModelEntityDto);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.deletePrescriptionModel.emit).toHaveBeenCalledWith(mockModelEntityDto);
  });

  it('should track items by id and initialize data stream with correct config', () => {
    // Test trackById
    const result = component.trackById(mockModelEntityDto);
    expect(result).toBe(1);

    const itemWithoutId: ModelEntityDto = { name: 'Test' } as any;
    const resultWithoutId = component.trackById(itemWithoutId);
    expect(resultWithoutId).toBe(0);

    // Test initializeDataStream
    component.intent = Intent.MODEL;
    component.modelEntityPage = mockModelEntityPage;

    component['initializeDataStream']();

    const expectedConfig: DataLoadConfig = {
      intent: Intent.MODEL,
    };

    expect(mockDataService.initializeDataStream).toHaveBeenCalledWith([mockModelEntityDto], expectedConfig);
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      // Set up component with test data
      component.modelEntityPage = mockModelEntityPage;
      mockDataService.modelEntityData$.next([mockModelEntityDto]);
      mockAuthService.isProfessional.mockReturnValue(of(true));
      fixture.detectChanges();
    });

    it('should render model cards when items are available', () => {
      const cardElements = fixture.debugElement.nativeElement.querySelectorAll('mat-card');
      expect(cardElements.length).toBe(1);
    });

    it('should display no models, but alert when no items available', () => {
      component.modelEntityPage = { content: [], numberOfElements: 0 };
      mockDataService.modelEntityData$.next([]);
      fixture.detectChanges();

      const alertElement = fixture.debugElement.nativeElement.querySelector('app-alert');
      expect(alertElement).toBeTruthy();
    });

    it('should display skeleton loader when loading', () => {
      component.loading = true;
      fixture.detectChanges();

      const skeletonElement = fixture.debugElement.nativeElement.querySelector('app-skeleton');
      expect(skeletonElement).toBeTruthy();
    });

    it('should display error alert when in error state', () => {
      component.error = true;
      component.errorMsg = 'Test error message';
      fixture.detectChanges();

      const errorAlert = fixture.debugElement.nativeElement.querySelector('app-alert');
      expect(errorAlert).toBeTruthy();
    });

    it('should emit openPrescriptionModel when model details button is clicked', () => {
      jest.spyOn(component.openPrescriptionModel, 'emit');

      const buttons = fixture.debugElement.nativeElement.querySelectorAll('button[mat-button]') as HTMLElement[];
      const detailsButton = Array.from(buttons).find(button => {
        return button.textContent?.trim().includes('prescription.model.details.link');
      });

      expect(detailsButton).toBeTruthy();
      detailsButton?.click();

      expect(component.openPrescriptionModel.emit).toHaveBeenCalledWith(mockModelEntityDto);
    });
  });
});
