import templates from './templates.json';
import accessMatrix from './access-matrix.json';
import persons from './persons.json';
import templateVersionsLatest from './templates-versions-latest.json';
import commonTranslations from './common-translations.json';
import cities from './cities.json';
import prescriptions from './list-prescriptions.json';
import proposals from './list-proposals.json';
import professionals from './professionals.json';
import healthCareProviderRequestResource from './HealthCareProviderRequestResource.json';
import { HttpRequest } from '@angular/common/http';
import {
  AssignCareGiverResource,
  AssignOrganizationResource,
  CityResource,
  FhirR4TaskStatus,
  HealthcareOrganizationResource,
  HealthcareProResource,
  OrganizationTaskResource,
  PerformerTaskResource,
  ReadRequestResource,
} from '@reuse/code/openapi';
import { demoStorage } from '../helpers/demoStorage';
import { of } from 'rxjs';

interface PerformerTaskResourceExtended extends PerformerTaskResource {
  careGiverIndex?: number;
}

export interface ReadRequestResourceExtended extends ReadRequestResource {
  performerTasks?: Array<PerformerTaskResourceExtended>;
  requesterIndex?: number;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type DemoMockEntry = {
  url: RegExp;
  method: HttpMethod[];
  body?: unknown;
  status?: number;
  handler?: (req: HttpRequest<unknown>, matchResult: RegExpMatchArray | null) => unknown;
};

export const DEMO_MOCKS: DemoMockEntry[] = [
  {
    method: ['POST'],
    url: /\/pseudonymize$/,
    body: { demo: true },
  },
  {
    method: ['GET'],
    url: /\/persons\/[^/]+/,
    body: () => {
      return persons[0] || { error: 'No person found' };
    },
  },
  {
    method: ['GET'],
    url: /\/accessMatrix$/,
    body: accessMatrix,
  },
  {
    method: ['GET'],
    url: /\/prescriptions\/summary(\?.*)?$/,
    handler: (req: HttpRequest<unknown>) => {
      demoStorage.clear();
      const params = req.params;
      const historical = params.get('historical') === 'true';
      const page = parseInt(params.get('page') || '1', 10);
      const pageSize = parseInt(params.get('pageSize') || '10', 10);

      let items = prescriptions.items || [];

      if (!historical) {
        items = items.filter(p => p.status === 'OPEN' || p.status === 'IN_PROGRESS');
      }

      const start = (page - 1) * pageSize;
      const listOfPrescriptions = items.slice(start, start + pageSize).map(prescription => {
        const index = prescription.requesterIndex;
        const requester = professionals[index];
        return {
          ...prescription,
          requester: requester,
        };
      });

      return {
        items: listOfPrescriptions,
        total: items.length,
      };
    },
  },
  {
    method: ['GET'],
    url: /\/proposals\/summary(\?.*)?$/,
    handler: (req: HttpRequest<unknown>) => {
      demoStorage.clear();
      const params = req.params;
      const historical = params.get('historical') === 'true';
      const page = parseInt(params.get('page') || '1', 10);
      const pageSize = parseInt(params.get('pageSize') || '10', 10);

      const findProposals = proposals;
      let items = findProposals.items || [];

      if (!historical) {
        items = items.filter(p => p.status === 'OPEN' || p.status === 'IN_PROGRESS');
      }

      const start = (page - 1) * pageSize;
      const listOfProposals = items.slice(start, start + pageSize).map(proposal => {
        const index = proposal.requesterIndex;
        const requester = professionals[index];
        return {
          ...proposal,
          requester: requester,
        };
      });

      return {
        items: listOfProposals,
        total: items.length,
      };
    },
  },
  {
    method: ['GET'],
    url: /\/prescriptions\/[a-z0-9-]+$/i,
    handler: (req: HttpRequest<unknown>) => {
      const id = req.url.split('/').pop();

      if (id) {
        const demoPrescription = demoStorage.get<ReadRequestResourceExtended>('demoPrescription');
        const newPrescription =
          demoPrescription?.id === id
            ? demoPrescription
            : (prescriptions.items.find(
                prescription => prescription.id === id
              ) as unknown as ReadRequestResourceExtended);

        demoStorage.set('demoPrescription', newPrescription);

        newPrescription.performerTasks?.forEach((performerTask: PerformerTaskResourceExtended) => {
          const index = performerTask.careGiverIndex as number;
          if (index != null) {
            const requester = professionals[index];
            performerTask.careGiver = requester as unknown as HealthcareProResource;
          }
        });

        const index = newPrescription.requesterIndex as number;

        if (index != null) {
          const requester = professionals[index];
          return {
            ...newPrescription,
            requester: requester,
          };
        }

        return newPrescription;
      } else {
        return new Error('No prescription found');
      }
    },
  },
  {
    method: ['GET'],
    url: /\/proposals\/[a-z0-9-]+$/i,
    handler: (req: HttpRequest<unknown>) => {
      const id = req.url.split('/').pop();

      if (id) {
        const demoProposal = demoStorage.get<ReadRequestResourceExtended>('demoProposal');
        const newProposal =
          demoProposal?.id === id
            ? demoProposal
            : (proposals.items.find(proposal => proposal.id === id) as unknown as ReadRequestResourceExtended);

        demoStorage.set('demoProposal', newProposal);

        newProposal.performerTasks?.forEach((performerTask: PerformerTaskResourceExtended) => {
          const index = performerTask.careGiverIndex as number;
          if (index != null) {
            const requester = professionals[index];
            performerTask.careGiver = requester as unknown as HealthcareProResource;
          }
        });

        const index = newProposal.requesterIndex as number;
        if (index != null) {
          const requester = professionals[index];
          return {
            ...newProposal,
            requester: requester,
          };
        }

        return newProposal;
      } else {
        return new Error('No proposal found');
      }
    },
  },
  {
    method: ['GET'],
    url: /\/prescription\?ssin=[^&]+&shortCode=[^&]+$/i,
    handler: (req: HttpRequest<unknown>) => {
      const params = new URLSearchParams(req.urlWithParams.split('?')[1]);
      const shortCode = params.get('shortCode');

      if (shortCode) {
        const demoPrescription = demoStorage.get<ReadRequestResourceExtended>('demoPrescription');
        const newPrescription =
          demoPrescription?.shortCode === shortCode
            ? demoPrescription
            : (prescriptions.items.find(
                prescription => prescription.shortCode === shortCode
              ) as unknown as ReadRequestResourceExtended);

        demoStorage.set('demoPrescription', newPrescription);

        newPrescription.performerTasks?.forEach((performerTask: PerformerTaskResourceExtended) => {
          const index = performerTask.careGiverIndex as number;
          if (index != null) {
            const requester = professionals[index];
            performerTask.careGiver = requester as unknown as HealthcareProResource;
          }
        });

        const index = newPrescription.requesterIndex as number;

        if (index != null) {
          const requester = professionals[index];
          return {
            ...newPrescription,
            requester: requester,
          };
        }

        return newPrescription;
      } else {
        return new Error('No prescription found');
      }
    },
  },
  {
    method: ['GET'],
    url: /\/templates$/,
    body: templates,
  },
  {
    method: ['GET'],
    url: /\/templates\/READ_[A-Z0-9_]+\/versions\/latest$/,
    handler: (req: HttpRequest<unknown>) => {
      const name = req.url.match(/READ_([^/]+)/)?.[1];
      if (!name) return new Error('No template found');

      const template = templateVersionsLatest.find(t => t.id === name);
      if (!template) return new Error('No template found');

      return { ...template, ...commonTranslations };
    },
  },
  {
    method: ['GET'],
    url: /\/healthCareProviders/,
    handler: (req: HttpRequest<unknown>) => {
      const params = req.params;

      const institutionType = params.get('institutionType');
      const discipline = params.get('discipline');
      const page = parseInt(params.get('page') || '1', 10);
      const pageSize = parseInt(params.get('pageSize') || '10', 10);

      // Handle organization search
      if (institutionType) {
        let orgs = healthCareProviderRequestResource.healthcareOrganizations || [];

        const query = params.get('query');
        if (query) {
          const q = query.toLowerCase();

          orgs = orgs.filter(o => {
            return (
              o.nihii8.includes(query) ||
              o.nihii11.includes(query) ||
              o.organizationName.nl.toLowerCase().includes(q) ||
              o.organizationName.fr.toLowerCase().includes(q) ||
              o.organizationName.de.toLowerCase().includes(q) ||
              o.organizationName.en.toLowerCase().includes(q)
            );
          });
        }

        const zipCode = params.get('zipCode');
        if (zipCode) {
          const z = zipCode.toLowerCase();

          orgs = orgs.filter(o => {
            return o.address.zipCode.includes(z);
          });
        }

        const start = (page - 1) * pageSize;

        return {
          healthcareOrganizations: orgs.slice(start, start + pageSize),
          healthcareProfessionals: [],
          total: orgs.length,
        };
      }

      // Handle professional search
      if (discipline) {
        let profs = healthCareProviderRequestResource.healthcareProfessionals || [];

        if (discipline !== 'ALL') {
          profs = profs.filter(p => p.id?.profession === discipline);
        }

        const query = params.get('query');

        if (query) {
          const q = query.toLowerCase();

          profs = profs.filter(p => {
            const hp = p.healthcarePerson;
            const fullName = `${hp.firstName} ${hp.lastName}`.toLowerCase();

            return (
              p.nihii8.includes(query) ||
              p.nihii11.includes(query) ||
              hp.firstName.toLowerCase().includes(q) ||
              hp.lastName.toLowerCase().includes(q) ||
              fullName.includes(q)
            );
          });
        }

        const zipCode = params.get('zipCode');
        if (zipCode) {
          const z = zipCode.toLowerCase();

          profs = profs.filter(p => {
            return p.address.zipCode.includes(z);
          });
        }

        const start = (page - 1) * pageSize;
        return {
          healthcareOrganizations: [],
          healthcareProfessionals: profs.slice(start, start + pageSize),
          total: profs.length,
        };
      }

      return healthCareProviderRequestResource;
    },
  },
  {
    method: ['POST'],
    url: /\/prescriptions\/[a-z0-9-]+\/assign\/[a-z0-9-]+$/i,
    handler: (req: HttpRequest<unknown>) => {
      const body = req.body as AssignCareGiverResource;
      const professionalSsin = body.ssin;

      const professional = healthCareProviderRequestResource.healthcareProfessionals.find(
        e => e.healthcarePerson.ssin === professionalSsin
      );

      if (professional) {
        const performerTaskResource: PerformerTaskResource = {
          careGiverSsin: professionalSsin,
          careGiver: professional as unknown as HealthcareProResource,
          status: FhirR4TaskStatus.Ready,
        };

        const savedPrescription = demoStorage.get<ReadRequestResourceExtended>('demoPrescription') || {};

        if (!savedPrescription.performerTasks) {
          savedPrescription.performerTasks = [];
        }

        savedPrescription.performerTasks.unshift(performerTaskResource);

        demoStorage.set('demoPrescription', savedPrescription);

        return of({ id: savedPrescription.id });
      } else {
        return new Error('No prescription found');
      }
    },
  },
  {
    method: ['POST'],
    url: /\/proposals\/[a-z0-9-]+\/assign\/[a-z0-9-]+$/i,
    handler: (req: HttpRequest<unknown>) => {
      const body = req.body as AssignCareGiverResource;
      const professionalSsin = body.ssin;

      const professional = healthCareProviderRequestResource.healthcareProfessionals.find(
        e => e.healthcarePerson.ssin === professionalSsin
      );

      if (professional) {
        const performerTaskResource: PerformerTaskResource = {
          careGiverSsin: professionalSsin,
          careGiver: professional as unknown as HealthcareProResource,
          status: FhirR4TaskStatus.Ready,
        };

        const savedProposal = demoStorage.get<ReadRequestResourceExtended>('demoProposal') || {};

        if (!savedProposal.performerTasks) {
          savedProposal.performerTasks = [];
        }

        savedProposal.performerTasks.unshift(performerTaskResource);

        demoStorage.set('demoPrescription', savedProposal);

        return of({ id: savedProposal.id });
      } else {
        return new Error('No proposal found');
      }
    },
  },
  {
    method: ['POST'],
    url: /\/prescriptions\/[a-z0-9-]+\/assignOrganization\/[a-z0-9-]+$/i,
    handler: (req: HttpRequest<unknown>) => {
      const body = req.body as AssignOrganizationResource;
      const nihii = body.nihii;
      const institutionTypeCode = body.institutionTypeCode;

      const organization = healthCareProviderRequestResource.healthcareOrganizations.find(
        e => (e.nihii8 + e.qualificationCode === nihii || e.nihii11 === nihii) && e.typeCode === institutionTypeCode
      );

      if (organization) {
        const organizationTaskResource: OrganizationTaskResource = {
          organizationNihii: nihii,
          organization: organization as unknown as HealthcareOrganizationResource,
          performerTasks: [],
          status: FhirR4TaskStatus.Ready,
        };

        const savedPrescription = demoStorage.get<ReadRequestResourceExtended>('demoPrescription') || {};

        if (!savedPrescription.organizationTasks) {
          savedPrescription.organizationTasks = [];
        }

        savedPrescription.organizationTasks.unshift(organizationTaskResource);

        demoStorage.set('demoPrescription', savedPrescription);

        return of({ id: savedPrescription.id });
      } else {
        return new Error('No prescription found');
      }
    },
  },
  {
    method: ['POST'],
    url: /\/proposals\/[a-z0-9-]+\/assignOrganization\/[a-z0-9-]+$/i,
    handler: (req: HttpRequest<unknown>) => {
      const body = req.body as AssignOrganizationResource;
      const nihii = body.nihii;
      const institutionTypeCode = body.institutionTypeCode;

      const organization = healthCareProviderRequestResource.healthcareOrganizations.find(
        e => (e.nihii8 + e.qualificationCode === nihii || e.nihii11 === nihii) && e.typeCode === institutionTypeCode
      );

      if (organization) {
        const organizationTaskResource: OrganizationTaskResource = {
          organizationNihii: nihii,
          organization: organization as unknown as HealthcareOrganizationResource,
          performerTasks: [],
          status: FhirR4TaskStatus.Ready,
        };

        const savedProposal = demoStorage.get<ReadRequestResourceExtended>('demoProposal') || {};

        if (!savedProposal.organizationTasks) {
          savedProposal.organizationTasks = [];
        }

        savedProposal.organizationTasks.unshift(organizationTaskResource);

        demoStorage.set('demoProposal', savedProposal);

        return of({ id: savedProposal.id });
      } else {
        return new Error('No proposal found');
      }
    },
  },

  {
    method: ['GET'],
    url: /\/geography\/cities(\?.*)?$/,
    handler: (req: HttpRequest<unknown>) => {
      const params = req.params;
      const query = params.get('query');
      const allCities = cities as CityResource[];

      if (!query) {
        return { items: allCities };
      } else {
        const filteredCities = allCities.filter(c => {
          const q = String(query).toLowerCase(); // normalize query
          return (
            c.cityName?.nl.toLowerCase().includes(q) ||
            c.cityName?.fr.toLowerCase().includes(q) ||
            c.cityName?.de.toLowerCase().includes(q) ||
            c.cityName?.en?.toLowerCase().includes(q) ||
            String(c.zipCode).includes(q)
          );
        });

        return { items: filteredCities };
      }
    },
  },
];
