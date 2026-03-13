import { Pipe, PipeTransform } from '@angular/core';
import { HealthcareOrganizationResource, HealthcareProResource, ProviderType } from '@reuse/code/openapi';

@Pipe({ name: 'ssinOrOrganizationId', standalone: true })
export class SsinOrOrganizationIdPipe implements PipeTransform {
  transform(healthcareProvider: HealthcareProResource | HealthcareOrganizationResource): string | undefined {
    let ssinOrCbe;
    if (this.isProfessional(healthcareProvider)) {
      ssinOrCbe = healthcareProvider.id?.ssin;
    } else {
      ssinOrCbe = healthcareProvider.id?.organizationId;
    }

    return ssinOrCbe?.toString();
  }

  isProfessional(object: HealthcareProResource | HealthcareOrganizationResource): object is HealthcareProResource {
    return object.type?.toLowerCase() === ProviderType.Professional.toLowerCase();
  }
}
