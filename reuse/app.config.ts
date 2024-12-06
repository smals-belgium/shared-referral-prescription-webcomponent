import { IConfiguration } from '@smals/ngx-configuration-service';

interface AppConfig extends IConfiguration {
  variables: {
    [env: string]: AppConfigVariables;
  };
}

interface AppConfigVariables {
  env: string;
  fhirGatewayUrl: string;
  fhirGatewayClientId?: string;
  apiUrl: string;
  pseudoApiUrl?: string;
  enablePseudo?: boolean;
  enableSentry?: boolean;
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };
}

export const APP_CONFIG: AppConfig = {
  environments: [
    {
      env: 'local',
      domain: ['localhost:4200', 'localhost:9000', '127.0.0.1:4200', 'extranet-acpt.referral-prescription.ehealth.fgov.be']
    },
    {
      env: 'test',
      domain: ['referral-prescription.test.paas.vasdc.be']
    },
    {
      env: 'testDemo',
      domain: ['referral-prescription-demo.test.paas.vasdc.be', 'referral-prescription-demo-v4.test.paas.vasdc.be']
    },
    {
      env: 'intExt',
      domain: ['referral-prescription.int.ext.vascloud.be', 'referral-prescription-patient.int.ext.vascloud.be']
    },
    {
      env: 'intPub',
      domain: ['referral-prescription.int.pub.vascloud.be', 'referral-prescription-patient.int.pub.vascloud.be', 'referral-prescription-demo.int.pub.vascloud.be', 'referral-prescription-demo-v4.int.pub.vascloud.be']
    },
    {
      env: 'acc',
      domain: ['wwwacc.referral-prescription.ehealth.fgov.be', 'wwwacc.referral-prescription-patient.ehealth.fgov.be']
    },
    {
      env: 'accIn',
      domain: ['wwwacc.referral-prescription.in.ehealth.fgov.be', 'wwwacc.referral-prescription-patient.in.ehealth.fgov.be']
    },
    {
      env: 'accUp',
      domain: ['wwwacc.referral-prescription.up.ehealth.fgov.be', 'wwwacc.referral-prescription-patient.up.ehealth.fgov.be']
    },
    {
      env: 'prod',
      domain: ['www.referral-prescription.ehealth.fgov.be', 'www.referral-prescription-patient.ehealth.fgov.be']
    },
    {
      env: 'prodIn',
      domain: ['www.referral-prescription.in.ehealth.fgov.be', 'www.referral-prescription-patient.in.ehealth.fgov.be']
    },
    {
      env: 'prodUp',
      domain: ['www.referral-prescription.up.ehealth.fgov.be', 'www.referral-prescription-patient.up.ehealth.fgov.be']
    },
  ],
  variables: {
    local: {
      env: 'local',
      fhirGatewayUrl: 'http://referral-prescription-fakeapi-v4.test.paas.vasdc.be',
      apiUrl: 'http://localhost:8080/frontend/api',
      keycloak: {
        url: 'http://vasiam.test.paas.vasdc.be/auth',
        realm: 'MOOSE_UHMEP',
        clientId: 'uhmep-webapp'
      }
      // enablePseudo: true,
      // pseudoApiUrl: 'http://uhmep-mockingbird.test.paas.vasdc.be/pseudo/v1'
    },
    test: {
      env: 'test',
      fhirGatewayUrl: 'https://referral-prescription-v4.test.ext.vascloud.be/backend/application/fhirgateway/uhmep/v1',
      apiUrl: 'http://referral-prescription.test.paas.vasdc.be/frontend/api',
      keycloak: {
        url: 'http://vasiam.test.paas.vasdc.be/auth',
        realm: 'MOOSE_UHMEP',
        clientId: 'uhmep-webapp'
      },
      enablePseudo: true,
      pseudoApiUrl: 'http://uhmep-mockingbird.test.paas.vasdc.be/pseudo/v1'
    },
    testDemo: {
      env: 'testDemo',
      fhirGatewayUrl: 'http://referral-prescription-fakeapi-v4.test.paas.vasdc.be',
      apiUrl: 'http://uhmep-frontend-webapi-demo-v4.test.paas.vasdc.be/frontend/api',
      keycloak: {
        url: 'http://vasiam.test.paas.vasdc.be/auth',
        realm: 'MOOSE_NIHII',
        clientId: 'uhmep-fake-client'
      }
    },
    intExt: {
      env: 'intExt',
      fhirGatewayUrl: 'https://uhmep-fhirgateway-v4.int.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://referral-prescription.int.ext.vascloud.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api-acpt.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-hcp-dev'
      },
      enablePseudo: true
    },
    intPub: {
      env: 'intPub',
      fhirGatewayUrl: 'https://uhmep-fhirgateway-v4.int.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://referral-prescription.int.pub.vascloud.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api-acpt.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-hcp-dev'
      },
      enablePseudo: true
    },
    acc: {
      env: 'acc',
      fhirGatewayUrl: 'https://extranet-acpt.referral-prescription.ehealth.fgov.be/backend/application/fhirgateway/uhmep/v1',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://wwwacc.referral-prescription.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api-acpt.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-hcp'
      },
      enablePseudo: true
    },
    accIn: {
      env: 'accIn',
      fhirGatewayUrl: 'https://fhirgateway.uhmep.acc.in.ext.vasha.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://wwwacc.referral-prescription.in.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api-acpt.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-hcp'
      },
      enablePseudo: true
    },
    accUp: {
      env: 'accUp',
      fhirGatewayUrl: 'https://fhirgateway.uhmep.acc.up.ext.vasha.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://wwwacc.referral-prescription.up.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api-acpt.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-hcp'
      },
      enablePseudo: true
    },
    prod: {
      env: 'prod',
      fhirGatewayUrl: 'https://uhmep-fhirgateway.prd.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://www.referral-prescription.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-hcp'
      },
      enablePseudo: true
    },
    prodIn: {
      env: 'prod',
      fhirGatewayUrl: 'https://uhmep-fhirgateway.prd.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://www.referral-prescription.in.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-hcp'
      },
      enablePseudo: true
    },
    prodUp: {
      env: 'prod',
      fhirGatewayUrl: 'https://uhmep-fhirgateway.prd.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://www.referral-prescription.up.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-hcp'
      },
      enablePseudo: true
    }
  }
};
