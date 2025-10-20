import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskButtonGroupComponent } from './task-button-group.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PrescriptionDetailsSecondaryService } from '../prescription-details-secondary.service';

describe('TaskButtonGroupComponent', () => {
  let component: TaskButtonGroupComponent;
  let fixture: ComponentFixture<TaskButtonGroupComponent>;
  let mockService: jest.Mocked<PrescriptionDetailsSecondaryService>;

  beforeEach(async () => {
    // Create mock service with Jest
    mockService = {
      getPrescription: jest.fn().mockReturnValue({ data: undefined }),
      getPerformerTask: jest.fn().mockReturnValue({ data: undefined }),
      getPatient: jest.fn().mockReturnValue({ data: undefined }),
      getCurrentUser: jest.fn().mockReturnValue({ data: undefined })
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        TaskButtonGroupComponent
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PrescriptionDetailsSecondaryService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskButtonGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
