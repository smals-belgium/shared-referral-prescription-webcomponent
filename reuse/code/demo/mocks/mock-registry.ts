
import {HttpRequest} from "@angular/common/http";
import persons from './persons.json';
import templates from './templates.json';
import accessMatrix from './access-matrix.json';
import proposals from './list-proposals.json';
import prescriptions from './list-prescriptions.json';
import prescription from './prescription.json';
import proposal from './proposal.json';
import healthCareProviderRequestResource from './HealthCareProviderRequestResource.json';
import templateVersionsLatest from './templates-versions-latest.json';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type DemoMockEntry = {
  url: RegExp;
  method: HttpMethod[];
  body?: any;
  status?: number;
  handler?: (req: HttpRequest<unknown>, matchResult: RegExpMatchArray | null) => any;
};

export const DEMO_MOCKS: DemoMockEntry[] = [
  {
    method: ['GET'],
    url: /\/persons\/[^/]+/,
    handler: () => persons[0] || persons || { error: 'No person found' },
  },
  {
    method: ['GET'],
    url: /\/accessMatrix$/,
    handler: () => {
      return accessMatrix;
    },
  },
  {
    method: ['GET'],
    url: /\/prescriptions\/[a-z0-9-]+$/i,
    body: prescription,
  },
  {
    method: ['GET'],
    url: /\/proposals\/[a-z0-9-]+$/i,
    body: proposal,
  },
  {
    method: ['GET'],
    url: /\/prescriptions\/summary/,
    handler: (req: HttpRequest<unknown>) => {
      const params = req.params;
      const historical = params.get('historical') === 'true';
      const page = parseInt(params.get('page') || '1', 10);
      const pageSize = parseInt(params.get('pageSize') || '10', 10);

      let items = prescriptions.items || [];

      if (!historical) {
        items = items.filter(p => p.status === 'OPEN' || p.status === 'IN_PROGRESS');
      }

      const start = (page - 1) * pageSize;
      return {
        items: items.slice(start, start + pageSize),
        total: items.length
      };
    },
  },
  {
    method: ['GET'],
    url: /\/proposals\/summary/,
    handler: (req: HttpRequest<unknown>) => {
      const params = req.params;
      const historical = params.get('historical') === 'true';
      const page = parseInt(params.get('page') || '1', 10);
      const pageSize = parseInt(params.get('pageSize') || '10', 10);

      let items = proposals.items || [];

      if (!historical) {
        items = items.filter(p => p.status === 'OPEN' || p.status === 'IN_PROGRESS');
      }

      const start = (page - 1) * pageSize;
      return {
        items: items.slice(start, start + pageSize),
        total: items.length
      };
    },
  },
  {
    method: ['GET'],
    url: /\/templates$/,
    body: templates,
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
        const orgs = healthCareProviderRequestResource.healthcareOrganizations || [];
        const start = (page - 1) * pageSize;

        return {
          healthcareOrganizations: orgs.slice(start, start + pageSize),
          healthcareProfessionals: [],
          total: orgs.length
        };
      }

      // Handle professional search
      if (discipline) {
        let profs = healthCareProviderRequestResource.healthcareProfessionals || [];

        if (discipline !== 'ALL') {
          profs = profs.filter(p => p.id?.profession === discipline);
        }

        const start = (page - 1) * pageSize;
        return {
          healthcareOrganizations: [],
          healthcareProfessionals: profs.slice(start, start + pageSize),
          total: profs.length
        };
      }

      return healthCareProviderRequestResource;
    },
  },
  {
    method: ['GET'],
    url: /\/templates\/READ_[A-Z0-9_]+\/versions\/latest$/,
    body: templateVersionsLatest,
  },
  {
    method: ['POST'],
    url: /\/prescriptions\/[a-z0-9-]+\/assign\/[a-z0-9-]+$/i,
    body: () => {
      return {
        id: prescription.id
      }
    },
  },
  {
    method: ['POST'],
    url: /\/proposals\/[a-z0-9-]+\/assign\/[a-z0-9-]+$/i,
    body: () => {
      return {
        id: prescription.id
      }
    },
  },
  {
    method: ['POST'],
    url: /\/prescriptions\/[a-z0-9-]+\/assignOrganization\/[a-z0-9-]+$/i,
    body: () => {
      return {
        id: prescription.id
      }
    },
  },
  {
    method: ['POST'],
    url: /\/proposals\/[a-z0-9-]+\/assignOrganization\/[a-z0-9-]+$/i,
    body: () => {
      return {
        id: prescription.id
      }
    },
  }
];
