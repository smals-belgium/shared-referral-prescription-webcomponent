import { ChangeDetectorRef, Directive, Input, OnChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { DataState, LoadingStatus } from '../interfaces';

@Directive({
    selector: '[ifStatusError]',
  standalone: true
})
export class IfStatusErrorDirective implements OnChanges {

    private created = false;

    @Input() ifStatusError!: DataState<any>;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private cdRef: ChangeDetectorRef
    ) {
    }

    ngOnChanges(): void {
        if (this.ifStatusError.status === LoadingStatus.ERROR) {
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
