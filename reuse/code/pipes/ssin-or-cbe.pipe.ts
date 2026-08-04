import { Pipe, PipeTransform } from '@angular/core';
import { HealthcareOrganizationResource, HealthcareProResource } from '@reuse/code/openapi';
import { isProfessional } from '@reuse/code/utils/assignment-disciplines.utils';

@Pipe({ name: 'ssinOrOrganizationId', standalone: true })
export class SsinOrOrganizationIdPipe implements PipeTransform {
  transform(healthcareProvider: HealthcareProResource | HealthcareOrganizationResource): string | undefined {
    let ssinOrCbe;
    if (isProfessional(healthcareProvider)) {
      ssinOrCbe = healthcareProvider.id?.ssin;
    } else {
      ssinOrCbe = healthcareProvider.id?.organizationId;
    }

    return ssinOrCbe?.toString();
  }
}
