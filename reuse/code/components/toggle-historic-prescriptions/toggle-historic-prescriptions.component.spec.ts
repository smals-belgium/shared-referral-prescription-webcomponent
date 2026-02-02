import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleHistoricPrescriptionsComponent } from './toggle-historic-prescriptions.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { MatSlideToggle } from '@angular/material/slide-toggle';

describe('ToggleHistoricPrescriptionsComponent', () => {
  let component: ToggleHistoricPrescriptionsComponent;
  let fixture: ComponentFixture<ToggleHistoricPrescriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleHistoricPrescriptionsComponent, TranslateModule.forRoot()],
      providers: [
        TranslateService
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ToggleHistoricPrescriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize slide toggle with isChecked value', async () => {

    component.isChecked = true;
    fixture.detectChanges();

    // Waits all asynchronous cycles (ngModel) to be done
    await fixture.whenStable();

    const toggleDebug = fixture.debugElement.query(By.directive(MatSlideToggle));

    expect(toggleDebug).toBeTruthy();

    const toggleInstance = toggleDebug.injector.get(MatSlideToggle);

    expect(toggleInstance.checked).toBe(true);
  });

  it('should emit toggleChanged event when the toggle is clicked', () => {
    jest.spyOn(component.toggleChanged, 'emit');

    const toggle = fixture.debugElement.query(By.css('mat-slide-toggle'));
    toggle.triggerEventHandler('change', {checked: true});

    expect(component.toggleChanged.emit).toHaveBeenCalledWith(true);
  });
});
