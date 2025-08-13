import { Injectable } from '@angular/core';
import { Group } from "../interfaces/organization.interface";

@Injectable({providedIn: 'root'})
export class OrganizationService {

  private readonly groups: Group[] = [
    { name: "THIRD_PARTY_PAYING_GROUP", code: "940" },
    { name: "GROUP_OF_DOCTORS", code: "212" },
    { name: "GUARD_POST", code: "115" },
    { name: "MEDICAL_HOUSE", code: "947" },
    { name: "HOME_SERVICES", code: "61" }
  ];

  constructor() { }

  getGroupNameByCode(code: string): string | undefined {
    const group = this.groups.find(g => g.code === code);
    return group ? group.name : undefined;
  }
}
