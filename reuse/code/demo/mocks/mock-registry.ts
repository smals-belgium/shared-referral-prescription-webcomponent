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
  RequestTaskResource,
} from '@reuse/code/openapi';
import { of } from 'rxjs';
import { demoStorage } from '../helpers/demoStorage';
import accessMatrix from './access-matrix.json';
import cities from './cities.json';
import commonTranslations from './common-translations.json';
import healthCareProviderRequestResource from './HealthCareProviderRequestResource.json';
import prescriptions from './list-prescriptions.json';
import proposals from './list-proposals.json';
import persons from './persons.json';
import professionals from './professionals.json';
import readTemplates from './read-templates.json';
import templateVersionsLatest from './templates-versions-latest.json';

interface PerformerTaskResourceExtended extends RequestTaskResource {
  careGiverIndex?: number;
  organizationIndex?: number;
}

export interface ReadRequestResourceExtended extends ReadRequestResource {
  performerTasks?: { [key: string]: Array<RequestTaskResource> };
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

        if (newPrescription.performerTasks) {
          Object.values(newPrescription.performerTasks).forEach(performerTasks =>
            performerTasks.forEach((performerTask: PerformerTaskResourceExtended) => {
              const careIndex = performerTask.careGiverIndex as number;
              const orgIndex = performerTask.organizationIndex as number;
              if (careIndex != null) {
                const requester = professionals[careIndex];
                (performerTask as PerformerTaskResource).careGiver = requester as unknown as HealthcareProResource;
              }

              if (orgIndex != null) {
                const requester = professionals[orgIndex];
                (performerTask as OrganizationTaskResource).organization =
                  requester as unknown as HealthcareOrganizationResource;
              }
            })
          );
        }

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

        if (newProposal.performerTasks) {
          Object.values(newProposal.performerTasks).forEach(performerTasks =>
            performerTasks.forEach((performerTask: PerformerTaskResourceExtended) => {
              const careIndex = performerTask.careGiverIndex as number;
              const orgIndex = performerTask.organizationIndex as number;
              if (careIndex != null) {
                const requester = professionals[careIndex];
                (performerTask as PerformerTaskResource).careGiver = requester as unknown as HealthcareProResource;
              }

              if (orgIndex != null) {
                const requester = professionals[orgIndex];
                (performerTask as OrganizationTaskResource).organization =
                  requester as unknown as HealthcareOrganizationResource;
              }
            })
          );
        }

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

        if (newPrescription.performerTasks) {
          Object.values(newPrescription.performerTasks).forEach(performerTasks =>
            performerTasks.forEach((performerTask: PerformerTaskResourceExtended) => {
              const careIndex = performerTask.careGiverIndex as number;
              const orgIndex = performerTask.organizationIndex as number;
              if (careIndex != null) {
                const requester = professionals[careIndex];
                (performerTask as PerformerTaskResource).careGiver = requester as unknown as HealthcareProResource;
              }

              if (orgIndex != null) {
                const requester = professionals[orgIndex];
                (performerTask as OrganizationTaskResource).organization =
                  requester as unknown as HealthcareOrganizationResource;
              }
            })
          );
        }

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
    body: readTemplates,
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
    url: /\/templates\/[A-Z0-9_]+\/versions\/latest$/,
    handler: (req: HttpRequest<unknown>) => {
      const name = req.url.split('/')[6];
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

      const providerType = params.get('providerType');
      const discipline = params.get('discipline');
      const page = parseInt(params.get('page') || '1', 10);
      const pageSize = parseInt(params.get('pageSize') || '10', 10);

      let pros: (HealthcareOrganizationResource | HealthcareProResource)[] = [];

      // Handle organization search
      if (!Array.isArray(healthCareProviderRequestResource?.healthcarePro)) return { healthcarePro: [], total: 0 };

      if (providerType !== 'PROFESSIONAL') {
        let orgs: HealthcareOrganizationResource[] | [] =
          (healthCareProviderRequestResource.healthcarePro as HealthcareOrganizationResource[]).filter(
            value => value?.type === 'Organization'
          ) || [];

        const query = params.get('query');
        if (query) {
          const q = query.toLowerCase();

          orgs = orgs.filter(o => {
            return (
              o?.nihii8?.includes(query) ||
              o?.nihii11?.includes(query) ||
              o?.organizationName?.nl.toLowerCase().includes(q) ||
              o?.organizationName?.fr.toLowerCase().includes(q) ||
              o?.organizationName?.de.toLowerCase().includes(q) ||
              o?.organizationName?.en?.toLowerCase().includes(q)
            );
          });
        }

        pros.push(...orgs);
      }

      // Handle professional search
      if (providerType !== 'ORGANIZATION') {
        let profs: HealthcareProResource[] | [] =
          (healthCareProviderRequestResource.healthcarePro as HealthcareProResource[]).filter(
            value => value?.type === 'Professional'
          ) || [];

        if (discipline !== 'ALL') {
          profs = profs.filter(p => p.id?.profession === discipline);
        }

        const query = params.get('query');

        if (query?.trim()) {
          const q = decodeURIComponent(query).toLowerCase().trim();

          profs = profs.filter(p => {
            const hp = p.healthcarePerson;
            const fullName = `${hp?.firstName} ${hp?.lastName}`.toLowerCase();

            return (
              p?.nihii8?.includes(query) ||
              p?.nihii11?.includes(query) ||
              hp?.firstName?.toLowerCase().includes(q) ||
              hp?.lastName?.toLowerCase().includes(q) ||
              fullName.includes(q)
            );
          });
        }

        pros.push(...profs);
      }

      const zipCodes = params.getAll('zipCode');

      if (zipCodes?.length) {
        pros = pros.filter(p => zipCodes.some(z => z && p?.address?.zipCode?.toLowerCase().includes(z.toLowerCase())));
      }

      const start = (page - 1) * pageSize;
      return {
        healthcarePro: pros.slice(start, start + pageSize),
        total: pros.length,
      };
    },
  },
  {
    method: ['POST'],
    url: /\/prescriptions\/[a-z0-9-]+\/assign\/[a-z0-9-]+$/i,
    handler: (req: HttpRequest<unknown>) => {
      const body = req.body as AssignCareGiverResource;
      const professionalSsin = body.ssin;

      const professional = healthCareProviderRequestResource.healthcarePro
        .filter(value => value.type === 'Professional')
        .map(value => value as HealthcareProResource)
        .find(e => e.healthcarePerson?.ssin === professionalSsin);

      if (professional) {
        const performerTaskResource: PerformerTaskResource = {
          careGiverSsin: professionalSsin,
          careGiver: professional,
          status: FhirR4TaskStatus.Ready,
        };

        const savedPrescription = demoStorage.get<ReadRequestResourceExtended>('demoPrescription') || {};

        if (!savedPrescription.performerTasks) {
          savedPrescription.performerTasks = {};
        }

        const ssin = performerTaskResource.careGiverSsin;
        if (ssin) {
          if (!savedPrescription.performerTasks[ssin]) {
            savedPrescription.performerTasks[ssin] = [];
          }
          savedPrescription.performerTasks[ssin].unshift(performerTaskResource);
        }

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

      const professional = healthCareProviderRequestResource.healthcarePro
        .filter(value => value.type === 'Professional')
        .map(value => value as HealthcareProResource)
        .find(e => e.healthcarePerson?.ssin === professionalSsin);

      if (professional) {
        const performerTaskResource: PerformerTaskResource = {
          careGiverSsin: professionalSsin,
          careGiver: professional,
          status: FhirR4TaskStatus.Ready,
        };

        const savedProposal = demoStorage.get<ReadRequestResourceExtended>('demoProposal') || {};

        if (!savedProposal.performerTasks) {
          savedProposal.performerTasks = {};
        }

        const ssin = performerTaskResource.careGiverSsin;
        if (ssin) {
          if (!savedProposal.performerTasks[ssin]) {
            savedProposal.performerTasks[ssin] = [];
          }
          savedProposal.performerTasks[ssin].unshift(performerTaskResource);
        }

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

      const organization = healthCareProviderRequestResource.healthcarePro.find(
        e => (e.nihii8 + e.qualificationCode === nihii || e.nihii11 === nihii) && e.typeCode === institutionTypeCode
      ) as HealthcareOrganizationResource;

      if (organization) {
        const organizationTaskResource: OrganizationTaskResource = {
          organizationNihii: nihii,
          organization: organization as unknown as HealthcareOrganizationResource,
          performerTasks: [],
          status: FhirR4TaskStatus.Ready,
        };

        const savedPrescription = demoStorage.get<ReadRequestResourceExtended>('demoPrescription') || {};

        if (!savedPrescription.performerTasks) {
          savedPrescription.performerTasks = {};
        }

        const organizationNihii = organizationTaskResource.organizationNihii;
        if (organizationNihii) {
          if (!savedPrescription.performerTasks[organizationNihii]) {
            savedPrescription.performerTasks[organizationNihii] = [];
          }
          savedPrescription.performerTasks[organizationNihii].unshift(organizationTaskResource);
        }

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

      const organization = healthCareProviderRequestResource.healthcarePro.find(
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

        if (!savedProposal.performerTasks) {
          savedProposal.performerTasks = {};
        }

        const organizationNihii = organizationTaskResource.organizationNihii;
        if (organizationNihii) {
          if (!savedProposal.performerTasks[organizationNihii]) {
            savedProposal.performerTasks[organizationNihii] = [];
          }
          savedProposal.performerTasks[organizationNihii].unshift(organizationTaskResource);
        }

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
