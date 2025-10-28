import templates from './templates.json';
import accessMatrix from './access-matrix.json';
import proposals from './list-proposals.json';
import prescriptions from './list-prescriptions.json';
import {HttpRequest} from "@angular/common/http";

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
    url: /\/accessMatrix$/,
    handler: () => {
      return accessMatrix;
    },
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
  }
];
