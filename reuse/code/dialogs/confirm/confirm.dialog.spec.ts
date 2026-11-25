import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog, ConfirmDialogData } from './confirm.dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { Lang } from '@reuse/code/constants/languages';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('ConfirmDialog (with real TranslateModule)', () => {
  let component: ConfirmDialog;
  let fixture: ComponentFixture<ConfirmDialog>;
  let dialogRef: jest.Mocked<MatDialogRef<ConfirmDialog, boolean>>;
  let translate: TranslateService;

  const createComponent = async (data: ConfirmDialogData) => {
    dialogRef = {
      close: jest.fn(),
    } as unknown as jest.Mocked<MatDialogRef<ConfirmDialog, boolean>>;

    await TestBed.configureTestingModule({
      imports: [
        ConfirmDialog,
        MatIconTestingModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader },
        }),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);

    // Set default language
    translate.setDefaultLang(Lang.EN.short);
    translate.use(Lang.EN.short);

    // Provide translation dictionary
    translate.setTranslation(Lang.EN.short, {
      TITLE_KEY: 'Translated Title',
      MESSAGE_KEY: 'Translated Message',
      OK_KEY: 'Confirm',
      OK_PARAMS_KEY: 'Confirm {{name}}',
      CANCEL_KEY: 'Abort',
    });

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('should render translated title and message', async () => {
    await createComponent({
      titleLabel: 'TITLE_KEY',
      messageLabel: 'MESSAGE_KEY',
    });

    const title = fixture.debugElement.query(By.css('h1'));
    const message = fixture.debugElement.query(By.css('[dialog-content]'));

    expect(title.nativeElement.textContent).toContain('Translated Title');
    expect(message.nativeElement.textContent).toContain('Translated Message');
  });

  it('should render translated buttons', async () => {
    await createComponent({
      okLabel: 'OK_KEY',
      cancelLabel: 'CANCEL_KEY',
    });

    const buttons = fixture.debugElement.queryAll(By.css('[dialog-actions-override] button'));

    expect(buttons[0].nativeElement.textContent).toContain('Confirm');
    expect(buttons[1].nativeElement.textContent).toContain('Abort');
  });

  it('should close dialog when translated OK button clicked', async () => {
    await createComponent({
      okLabel: 'OK_KEY',
    });

    const okButton = fixture.debugElement.query(By.css('[data-cy="dialog-confirm-button"]'));
    okButton.nativeElement.click();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should not render action buttons when labels are omitted', async () => {
    await createComponent({});

    expect(fixture.debugElement.queryAll(By.css('[dialog-actions-override] button'))).toHaveLength(0);
    expect(fixture.debugElement.query(By.css('[data-cy="dialog-confirm-button"]'))).toBeNull();
    expect(fixture.debugElement.query(By.css('[data-cy="dialog-cancel-button"]'))).toBeNull();
  });

  it('should translate button labels with parameters', async () => {
    await createComponent({
      okLabel: 'OK_PARAMS_KEY',
      params: { name: 'Alice' },
    });

    const button = fixture.debugElement.query(By.css('[data-cy="dialog-confirm-button"]'));
    expect(button.nativeElement.textContent).toContain('Confirm Alice');
    expect(fixture.debugElement.query(By.css('[data-cy="dialog-cancel-button"]'))).toBeNull();
  });

  it('should close without confirmation when cancel is clicked', async () => {
    await createComponent({ cancelLabel: 'CANCEL_KEY' });

    fixture.debugElement.query(By.css('[data-cy="dialog-cancel-button"]')).nativeElement.click();

    expect(dialogRef.close).toHaveBeenCalledWith('');
    expect(fixture.debugElement.query(By.css('[data-cy="dialog-confirm-button"]'))).toBeNull();
  });
});
