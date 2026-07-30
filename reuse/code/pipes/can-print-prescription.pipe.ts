import { Pipe, PipeTransform } from '@angular/core';
import { UserInfo } from '@reuse/code/interfaces';
import { Role } from '@reuse/code/openapi';

@Pipe({ name: 'canPrintPrescription', standalone: true })
export class CanPrintPrescriptionPipe implements PipeTransform {
  constructor() {}

  transform(currentUser?: Partial<UserInfo>): boolean {
    if (!currentUser) {
      return false;
    }

    return currentUser.role !== Role.Organization;
  }
}
