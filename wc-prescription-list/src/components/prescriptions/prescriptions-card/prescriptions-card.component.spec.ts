import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionsCardComponent } from './prescriptions-card.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { DateAdapter } from '@angular/material/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { BehaviorSubject, of } from 'rxjs';
import { Discipline, RequestStatus, RequestSummaryListResource, RequestSummaryResource } from '@reuse/code/openapi';
import { RequestSummaryDataService } from '@reuse/code/services/helpers/request-summary-data.service';

const mockPseudoClient = {
  getDomain: jest.fn(),
  identify: jest.fn(),
  identifyMultiple: jest.fn(),
  pseudonymize: jest.fn(),
  pseudonymizeMultiple: jest.fn(),
};

function MockPseudoHelperFactory() {
  return new PseudonymisationHelper(mockPseudoClient);
}

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
  requestSummaryData$: new BehaviorSubject([]),
  loading$: new BehaviorSubject(false),
  initializeDataStream: jest.fn(),
  triggerLoad: jest.fn(),
  retryLoad: jest.fn(),
} as any;

class FakeLoader implements TranslateLoader {
  getTranslation() {
    return of({});
  }
}

const mockRequestSummaryResource: RequestSummaryResource = {
  id: '1',
  status: RequestStatus.Open,
};

const mockRequestSummaryListResource: RequestSummaryListResource = {
  items: [mockRequestSummaryResource],
  total: 10,
};

describe('PrescriptionsCardComponent', () => {
  let component: PrescriptionsCardComponent;
  let fixture: ComponentFixture<PrescriptionsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PrescriptionsCardComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DateAdapter,
        { provide: PseudonymisationHelper, useValue: MockPseudoHelperFactory() },
        { provide: ConfigurationService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: RequestSummaryDataService, useValue: mockDataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrescriptionsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize with default values', () => {
    expect(component).toBeTruthy();
    expect(component.loading).toBe(false);
    expect(component.historical).toBe(false);
    expect(component.error).toBe(false);
    expect(component.errorMsg).toBe('');
  });

  it('should calculate itemsLength correctly', () => {
    component.requestSummaryListResource = undefined;
    expect(component.itemsLength).toBe(-1);

    component.requestSummaryListResource = { items: [], total: undefined };
    expect(component.itemsLength).toBe(-1);

    component.requestSummaryListResource = mockRequestSummaryListResource;
    expect(component.itemsLength).toBe(1);
  });

  it('should initialize data stream when requestSummaryListResource changes with items', () => {
    component.requestSummaryListResource = mockRequestSummaryListResource;
    const changes: SimpleChanges = {
      requestSummaryListResource: new SimpleChange(null, mockRequestSummaryListResource, true),
    };

    jest.spyOn(component as any, 'initializeDataStream');

    component.ngOnChanges(changes);

    expect(component['initializeDataStream']).toHaveBeenCalled();
  });

  it('should handle scroll events and trigger loadMore when near bottom', () => {
    component.requestSummaryListResource = mockRequestSummaryListResource;
    component.loading = false;
    component.error = false;
    (component as any).oldScroll = 0;
    mockDataService.loading$.next(false);

    // Mock window properties for near bottom
    Object.defineProperty(window, 'scrollY', { value: 1950, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    Object.defineProperty(document.body, 'scrollHeight', { value: 2000, writable: true });

    jest.spyOn(component, 'loadMore');
    jest.spyOn(component, 'canLoadMore').mockReturnValue(true);

    component.scrolled();

    expect(component.loadMore).toHaveBeenCalled();
  });

  it('should not trigger loadMore when loading or error state', () => {
    component.requestSummaryListResource = mockRequestSummaryListResource;
    component.loading = true; // Loading state

    jest.spyOn(component, 'loadMore');

    component.scrolled();

    expect(component.loadMore).not.toHaveBeenCalled();
  });

  it('should determine if more items can be loaded', () => {
    // No resource - should return true
    component.requestSummaryListResource = undefined;
    expect(component.canLoadMore()).toBe(true);

    // Has more items to load
    component.requestSummaryListResource = { items: [mockRequestSummaryResource], total: 10 };
    mockDataService.requestSummaryData$.next([mockRequestSummaryResource]);
    expect(component.canLoadMore()).toBe(true);

    // All items loaded
    const allItems = Array(10).fill(mockRequestSummaryResource);
    mockDataService.requestSummaryData$.next(allItems);
    expect(component.canLoadMore()).toBe(false);
  });

  it('should call dataService.triggerLoad when loadMore is called', () => {
    component.loadMore();
    expect(mockDataService.triggerLoad).toHaveBeenCalled();
  });

  it('should handle error retry correctly', () => {
    mockDataService.requestSummaryData$.next([mockRequestSummaryResource]);
    jest.spyOn(component.retryOnError, 'emit');

    component.onErrorRetryClick();

    expect(component.error).toBe(false);
    expect(mockDataService.retryLoad).toHaveBeenCalledWith(1);
  });

  it('should emit retryOnError when INITIAL_RETRY_REQUIRED error occurs', () => {
    mockDataService.retryLoad.mockImplementation(() => {
      throw { message: 'INITIAL_RETRY_REQUIRED' };
    });

    jest.spyOn(component.retryOnError, 'emit');

    component.onErrorRetryClick();

    expect(component.retryOnError.emit).toHaveBeenCalled();
  });

  it('should track items by id', () => {
    const result = component.trackById(mockRequestSummaryResource);
    expect(result).toBe('1');

    const itemWithoutId: RequestSummaryResource = { status: RequestStatus.Open } as any;
    const resultWithoutId = component.trackById(itemWithoutId);
    expect(resultWithoutId).toBe(0);
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      // Set up component with test data
      component.requestSummaryListResource = mockRequestSummaryListResource;
      mockDataService.requestSummaryData$.next([mockRequestSummaryResource]);
      mockAuthService.isProfessional.mockReturnValue(of(true));
      fixture.detectChanges();
    });

    it('should render prescription cards when items are available', () => {
      const cardElements = fixture.debugElement.nativeElement.querySelectorAll('mat-card');
      expect(cardElements.length).toBe(1);

      const statusChip = fixture.debugElement.nativeElement.querySelector('[data-cy="prescription-status"]');
      expect(statusChip).toBeTruthy();
    });

    it('should display no prescriptions, but an alert when no items available', () => {
      component.requestSummaryListResource = { items: [], total: 0 };
      mockDataService.requestSummaryData$.next([]);
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

    it('should emit clickPrescription when prescription details button is clicked', () => {
      jest.spyOn(component.clickPrescription, 'emit');

      const detailsButton = fixture.debugElement.nativeElement.querySelector('button[mat-button]');
      detailsButton.click();

      expect(component.clickPrescription.emit).toHaveBeenCalledWith(mockRequestSummaryResource);
    });
  });
});
