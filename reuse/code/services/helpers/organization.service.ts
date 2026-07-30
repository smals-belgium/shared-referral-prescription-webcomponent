import { Injectable } from '@angular/core';
import { InstitutionTypeResource } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly groups = [
    { name: InstitutionTypeResource.OtdPharmacy, code: '210' },
    { name: InstitutionTypeResource.OfficeDoctors, code: '212' },
    { name: InstitutionTypeResource.Groupofdoctors, code: '214' },
    { name: InstitutionTypeResource.GuardPost, code: '678' },
    { name: InstitutionTypeResource.MedicalHouse, code: '805' },
    { name: InstitutionTypeResource.Hospital, code: '710' },
    { name: InstitutionTypeResource.Reeducation, code: '786' },
    { name: InstitutionTypeResource.Groupofnurses, code: '940' },
    { name: InstitutionTypeResource.HomeServices, code: '947' },
  ];

  constructor() {}

  getGroupNameByCode(code: string): string | undefined {
    const group = this.groups.find(g => g.code === code);
    return group ? group.name : undefined;
  }
}
