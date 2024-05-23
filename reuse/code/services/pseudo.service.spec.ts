import { PseudoService } from './pseudo.service';
import { HttpClient } from '@angular/common/http';
import { ConfigurationService } from './configuration.service';
import { first, of } from 'rxjs';
import { TextDecoder, TextEncoder } from 'util';
import { Buffer } from 'buffer';

Object.assign(global, {TextDecoder, TextEncoder});

describe('PseudoService', () => {

  let service: PseudoService;
  let httpMock: any;
  let configServiceMock: any;
  let env: Record<string, any>;

  beforeEach(() => {
    env = {
      enablePseudo: true,
      pseudoApiUrl: 'http://pseudo.com'
    };
    httpMock = {
      post: jest.fn()
    }
    configServiceMock = {
      getEnvironmentVariable: jest.fn().mockImplementation(key => env[key])
    };

    service = new PseudoService(
      httpMock as unknown as HttpClient,
      configServiceMock as unknown as ConfigurationService
    );
  });

  it('should call the pseudonomize service', (done) => {
    httpMock.post.mockImplementation((url: string, body: any) => of({...body}));
    service
      .pseudonymize('test123')
      .pipe(first())
      .subscribe((result) => {
        const parsedResult = JSON.parse(Buffer.from(result, 'base64').toString());
        expect(typeof parsedResult.x).toBe('string');
        expect(typeof parsedResult.y).toBe('string');
        done();
      });
  });

});
