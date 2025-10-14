import { Injectable } from '@angular/core';
import { InstitutionTypeResource } from '@reuse/code/openapi';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private groups = [
    { name: InstitutionTypeResource.ThirdPartyPayingGroup, code: '940' },
    { name: InstitutionTypeResource.GroupOfDoctors, code: '212' },
    { name: InstitutionTypeResource.GuardPost, code: '115' },
    { name: InstitutionTypeResource.MedicalHouse, code: '947' },
    { name: InstitutionTypeResource.HomeServices, code: '61' },
  ];

  constructor() {}

  getGroupNameByCode(code: string): string | undefined {
    const group = this.groups.find(g => g.code === code);
    return group ? group.name : undefined;
  }
}
