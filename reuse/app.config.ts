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
  environments: [],
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
    intExtHcp: {
      env: 'intExtHcp',
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
    intPubHcp: {
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
    intExtPatient: {
      env: 'intPub',
      fhirGatewayUrl: 'https://uhmep-fhirgateway-v4.int.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://referral-prescription.int.pub.vascloud.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api-acpt.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-patient-dev'
      },
      enablePseudo: true
    },
    accHcp: {
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
    accPatient: {
      env: 'acc',
      fhirGatewayUrl: 'https://extranet-acpt.referral-prescription.ehealth.fgov.be/backend/application/fhirgateway/uhmep/v1',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://wwwacc.referral-prescription.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api-acpt.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-patient'
      },
      enablePseudo: true
    },
    accInHcp: {
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
    accInPatient: {
      env: 'accIn',
      fhirGatewayUrl: 'https://fhirgateway.uhmep.acc.in.ext.vasha.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://wwwacc.referral-prescription.in.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api-acpt.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-patient'
      },
      enablePseudo: true
    },
    accUpHcp: {
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
    accUpPatient: {
      env: 'accUp',
      fhirGatewayUrl: 'https://fhirgateway.uhmep.acc.up.ext.vasha.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://wwwacc.referral-prescription.up.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api-acpt.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-patient'
      },
      enablePseudo: true
    },
    prodHcp: {
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
    prodPatient: {
      env: 'prod',
      fhirGatewayUrl: 'https://uhmep-fhirgateway.prd.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://www.referral-prescription.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-patient'
      },
      enablePseudo: true
    },
    prodInHcp: {
      env: 'prodIn',
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
    prodInPatient: {
      env: 'prodIn',
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
    prodUpHcp: {
      env: 'prodUp',
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
    },
    prodUpPatient: {
      env: 'prodUp',
      fhirGatewayUrl: 'https://uhmep-fhirgateway.prd.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://www.referral-prescription.up.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-patient'
      },
      enablePseudo: true
    }
  }
};
