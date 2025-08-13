import { ChangeDetectorRef, Directive, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { first } from 'rxjs';

@Directive({
  selector: '[showIfProfessional]',
  standalone: true
})
export class ShowIfProfessionalDirective implements OnInit {

  constructor(
    private readonly templateRef: TemplateRef<any>,
    private readonly viewContainer: ViewContainerRef,
    private readonly authService: AuthService,
    private readonly cdRef: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.authService.isProfessional()
      .pipe(first())
      .subscribe((isProfessional) => {
        if (isProfessional) {
          this.viewContainer.createEmbeddedView(this.templateRef);
        } else {
          this.viewContainer.clear();
        }
        this.cdRef.markForCheck();
      });
  }
}
