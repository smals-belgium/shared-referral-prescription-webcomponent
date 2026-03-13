import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ConfirmDialog, ConfirmDialogData } from './confirm.dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { Lang } from '@reuse/code/constants/languages';

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
      CANCEL_KEY: 'Abort',
    });

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('should render translated title and message', waitForAsync(async () => {
    await createComponent({
      titleLabel: 'TITLE_KEY',
      messageLabel: 'MESSAGE_KEY',
    });

    const title = fixture.debugElement.query(By.css('h1'));
    const message = fixture.debugElement.query(By.css('mat-dialog-content'));

    expect(title.nativeElement.textContent).toContain('Translated Title');
    expect(message.nativeElement.textContent).toContain('Translated Message');
  }));

  it('should render translated buttons', waitForAsync(async () => {
    await createComponent({
      okLabel: 'OK_KEY',
      cancelLabel: 'CANCEL_KEY',
    });

    const buttons = fixture.debugElement.queryAll(By.css('button'));

    expect(buttons[0].nativeElement.textContent).toContain('Confirm');
    expect(buttons[1].nativeElement.textContent).toContain('Abort');
  }));

  it('should close dialog when translated OK button clicked', waitForAsync(async () => {
    await createComponent({
      okLabel: 'OK_KEY',
    });

    const okButton = fixture.debugElement.query(By.css('button'));
    okButton.nativeElement.click();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  }));
});
