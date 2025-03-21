import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleHistoricPrescriptionsComponent } from './toggle-historic-prescriptions.component';

describe('FilterPrescriptionsComponent', () => {
  let component: ToggleHistoricPrescriptionsComponent;
  let fixture: ComponentFixture<ToggleHistoricPrescriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleHistoricPrescriptionsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ToggleHistoricPrescriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
