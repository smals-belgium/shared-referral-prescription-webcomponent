import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[noWhiteSpace]',
  standalone: true,
})
export class EvfNoWhitespaceDirective {
  private readonly ngControl = inject(NgControl);

  @HostListener('blur')
  onBlur(): void {
    const value = this.ngControl.control?.value;
    if (typeof value === 'string' && value.trim() === '') {
      this.ngControl.control?.setValue(null);
    }
  }
}
