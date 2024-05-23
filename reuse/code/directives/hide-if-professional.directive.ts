import { ChangeDetectorRef, Directive, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { first } from 'rxjs';

@Directive({
  selector: '[hideIfProfessional]',
  standalone: true
})
export class HideIfProfessionalDirective implements OnInit {

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService,
    private cdRef: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.authService.isProfessional()
      .pipe(first())
      .subscribe((isProfessional) => {
        if (!isProfessional) {
          this.viewContainer.createEmbeddedView(this.templateRef);
        } else {
          this.viewContainer.clear();
        }
        this.cdRef.markForCheck();
      });
  }
}
