import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Component, ViewChild } from '@angular/core';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MultiselectComponent } from './multiselect.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [
    ReactiveFormsModule,
    MultiselectComponent
  ],
  template: `
    <form [formGroup]="form">
      <app-multiselect
        [data]="options"
        [key]="'testKey'"
        [formGroup]="form"
        [label]="'Test Label'"
      ></app-multiselect>
    </form>
  `
})
class TestHostComponent {
  @ViewChild(MultiselectComponent) multiselectComponent!: MultiselectComponent;
  options = [
    {name: 'Option 1', value: 'value1'},
    {name: 'Option 2', value: 'value2'},
    {name: 'Option 3', value: 'value3'}
  ];
  form = new FormGroup({
    testKey: new FormControl([])
  });
}

describe('MultiselectComponent', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let multiselect: MultiselectComponent;
  let announcer: LiveAnnouncer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestHostComponent,
        MultiselectComponent,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatChipsModule,
        MatFormFieldModule,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [LiveAnnouncer]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    announcer = TestBed.inject(LiveAnnouncer);
    fixture.detectChanges();
    multiselect = component.multiselectComponent;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(multiselect).toBeTruthy();
  });

  it('should initialize with empty selected items', () => {
    expect(multiselect.selectedItems()).toEqual([]);
  });

  it('should filter options based on input', () => {
    expect(multiselect.filteredItems().length).toBe(3);

    const input = fixture.debugElement.query(By.css('input')).nativeElement;
    input.value = 'Option 1';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(multiselect.filteredItems().length).toBe(1);
    expect(multiselect.filteredItems()[0].value).toBe('value1');
  });

  it('should add item when selected from autocomplete', () => {
    const event = {
      option: {value: 'value1', deselect: jest.fn()}
    } as unknown as MatAutocompleteSelectedEvent;

    jest.spyOn(announcer, 'announce');

    multiselect.selected(event);
    fixture.detectChanges();

    expect(multiselect.selectedItems().length).toBe(1);
    expect(multiselect.selectedItems()[0].value).toBe('value1');

    expect(multiselect.formControl?.value).toEqual(multiselect.selectedItems());

    expect(event.option.deselect).toHaveBeenCalled();
  });

  it('should remove item when chip remove button is clicked', () => {
    const event = {
      option: {value: 'value1', deselect: jest.fn()}
    } as unknown as MatAutocompleteSelectedEvent;
    multiselect.selected(event);
    fixture.detectChanges();

    const announcerSpy = jest.spyOn(announcer, 'announce');

    multiselect.remove(multiselect.selectedItems()[0]);
    fixture.detectChanges();

    expect(multiselect.selectedItems().length).toBe(0);

    expect(announcerSpy).toHaveBeenCalledWith(expect.stringContaining('Removed'));

    expect(multiselect.formControl?.value).toEqual([]);
  });

  it('should reset filter after selection', () => {
    const input = fixture.debugElement.query(By.css('input')).nativeElement;
    input.value = 'Option 1';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const event = {
      option: {value: 'value1', deselect: jest.fn()}
    } as unknown as MatAutocompleteSelectedEvent;
    multiselect.selected(event);
    fixture.detectChanges();

    expect(input.value).toBe('');
  });

  it('should update filtered options when input changes', fakeAsync(() => {
    multiselect.formControl?.setValue('Option 2');
    tick(100);
    fixture.detectChanges();

    expect(multiselect.filteredItems().length).toBe(1);
    expect(multiselect.filteredItems()[0].value).toBe('value2');
  }));

  it('should handle ngOnChanges correctly', () => {
    const setupSpy = jest.spyOn(multiselect, 'setupAutocompleteOptions');

    multiselect.ngOnChanges({
      data: {currentValue: [], previousValue: null, firstChange: true, isFirstChange: () => true}
    });

    expect(setupSpy).toHaveBeenCalled();
  });

  it('should unsubscribe from valueChanges on destroy', () => {
    const subscriptionSpy = jest.spyOn(multiselect['valueChangesSubscription'] as any, 'unsubscribe');

    multiselect.ngOnDestroy();

    expect(subscriptionSpy).toHaveBeenCalled();
  });

  it('should not show selected items in filtered options', () => {
    const event = {
      option: {value: 'value1', deselect: jest.fn()}
    } as unknown as MatAutocompleteSelectedEvent;
    multiselect.selected(event);
    fixture.detectChanges();

    expect(multiselect.filteredItems().some(item => item.value === 'value1')).toBe(false);
    expect(multiselect.filteredItems().length).toBe(2);
  });

  it('should mark form control as dirty when items are added or removed', () => {
    const event = {
      option: {value: 'value1', deselect: jest.fn()}
    } as unknown as MatAutocompleteSelectedEvent;

    const markDirtySpy = jest.spyOn(multiselect.formControl as FormControl, 'markAsDirty');

    multiselect.selected(event);
    fixture.detectChanges();

    expect(markDirtySpy).toHaveBeenCalled();

    markDirtySpy.mockClear();

    multiselect.remove(multiselect.selectedItems()[0]);
    fixture.detectChanges();

    expect(markDirtySpy).toHaveBeenCalled();
  });
});
