import { ChangeDetectorRef, Directive, Input, OnChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { DataState, LoadingStatus } from '../interfaces';

@Directive({
    selector: '[ifStatusLoading]',
  standalone: true
})
export class IfStatusLoadingDirective implements OnChanges {

    private created = false;

    @Input() ifStatusLoading!: DataState<any>;

    constructor(
      private readonly templateRef: TemplateRef<any>,
      private readonly viewContainer: ViewContainerRef,
      private readonly cdRef: ChangeDetectorRef
    ) {
    }

    ngOnChanges(): void {
        if (this.ifStatusLoading.status === LoadingStatus.LOADING || this.ifStatusLoading.status === LoadingStatus.UPDATING) {
            if (!this.created) {
                this.viewContainer.createEmbeddedView(this.templateRef);
                this.cdRef.markForCheck();
                this.created = true;
            }
        } else if (this.created) {
            this.viewContainer.clear();
            this.cdRef.markForCheck();
            this.created = false;
        }
    }
}
