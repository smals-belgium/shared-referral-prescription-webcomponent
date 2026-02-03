import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';

import { CancelCreationDialog, CancelCreationDialogData } from './cancel-creation.dialog';
import { CreatePrescriptionForm } from '@reuse/code/interfaces';
import { TemplateNamePipe } from '@reuse/code/pipes/template-name.pipe';

@Pipe({
  name: 'templateName',
  standalone: true,
})
class MockTemplateNamePipe implements PipeTransform {
  transform(value: any): any {
    return value;
  }
}

const mockDialogRef = {
  close: jest.fn(),
};

const mockPrescriptionForms: CreatePrescriptionForm[] = [
  { trackId: 1, templateCode: 'TEMPLATE_1' } as CreatePrescriptionForm,
  { trackId: 2, templateCode: 'TEMPLATE_2' } as CreatePrescriptionForm,
  { trackId: 3, templateCode: 'TEMPLATE_3' } as CreatePrescriptionForm,
];

const mockDialogData: CancelCreationDialogData = {
  prescriptionForms: mockPrescriptionForms,
};

describe('CancelCreationDialog', () => {
  let component: CancelCreationDialog;
  let fixture: ComponentFixture<CancelCreationDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CancelCreationDialog,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MockTemplateNamePipe,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    })
      .overrideComponent(CancelCreationDialog, {
        remove: { imports: [TemplateNamePipe] },
        add: { imports: [MockTemplateNamePipe] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CancelCreationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('cancelPrescriptions', () => {
    it('should close dialog with selected formsToDelete', () => {
      component.formsToDelete = [1, 3];

      component.cancelPrescriptions();

      expect(mockDialogRef.close).toHaveBeenCalledWith({ formsToDelete: [1, 3] });
    });
  });

  describe('toggleDeleteAll', () => {
    it('should select all forms when checked is true', () => {
      component.toggleDeleteAll(true);

      expect(component.formsToDelete).toEqual([1, 2, 3]);
      expect(component.formsToDelete).toHaveLength(3);
    });

    it('should deselect all forms when checked is false', () => {
      component.formsToDelete = [1, 2, 3];

      component.toggleDeleteAll(false);

      expect(component.formsToDelete).toEqual([]);
    });
  });

  describe('toggleDeleteForm', () => {
    it('should add trackId to formsToDelete when not already present', () => {
      component.toggleDeleteForm(1);

      expect(component.formsToDelete).toContain(1);
      expect(component.formsToDelete).toHaveLength(1);
    });

    it('should remove trackId from formsToDelete when already present', () => {
      component.formsToDelete = [1, 2];

      component.toggleDeleteForm(1);

      expect(component.formsToDelete).not.toContain(1);
      expect(component.formsToDelete).toEqual([2]);
    });
  });
});
