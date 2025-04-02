import {Pipe, PipeTransform} from '@angular/core';
import {Professional} from "../interfaces";
import {Organization} from "../interfaces/organization.interface";

@Pipe({name: 'ssinOrOrganizationId', standalone: true})
export class SsinOrOrganizationIdPipe implements PipeTransform {

  transform(healthcareProvider: Professional | Organization): string | undefined {
    let ssinOrCbe;
    if(this.isProfessional(healthcareProvider)) {
      ssinOrCbe = healthcareProvider.id.ssin
    } else {
      ssinOrCbe = healthcareProvider.id.organizationId
    }

    return ssinOrCbe?.toString()
  }

  isProfessional(object: any): object is Professional {
    return object.type === 'Professional';
  }
}
