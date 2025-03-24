import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleHistoricPrescriptionsComponent } from './toggle-historic-prescriptions.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';

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

  it('should initialize slide toggle with isChecked value', () => {
    component.isChecked = true;
    fixture.detectChanges();

    const toggle = fixture.debugElement.query(By.css('mat-slide-toggle'))
      .nativeElement as HTMLInputElement;

    expect(toggle.getAttribute('ng-reflect-model')).toBe('true');
  });

  it('should emit toggleChanged event when the toggle is clicked', () => {
    jest.spyOn(component.toggleChanged, 'emit');

    const toggle = fixture.debugElement.query(By.css('mat-slide-toggle'));
    toggle.triggerEventHandler('change', {checked: true});

    expect(component.toggleChanged.emit).toHaveBeenCalledWith(true);
  });
});
