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
      },
      enablePseudo: true,
      pseudoApiUrl: 'http://uhmep-mockingbird.test.paas.vasdc.be/pseudo/v1'
    },
    test: {
      env: 'test',
      fhirGatewayUrl: 'https://referral-prescription-v4.test.ext.vascloud.be/backend/application/fhirgateway/uhmep/v1',
      apiUrl: 'https://referral-prescription.test.ext.vascloud.be/frontend/api',
      keycloak: {
        url: 'https://vasiam.test.ext.vascloud.be/auth',
        realm: 'MOOSE_UHMEP',
        clientId: 'uhmep-webapp'
      },
      enablePseudo: true,
      pseudoApiUrl: 'https://uhmep-mockingbird.test.ext.vascloud.be/pseudo/v1'
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
      pseudoApiUrl: 'https://api-int.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api-int.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-hcp'
      },
      enablePseudo: true
    },
    intPubHcp: {
      env: 'intPubHcp',
      fhirGatewayUrl: 'https://uhmep-fhirgateway-v4.int.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://referral-prescription.int.pub.vascloud.be/frontend/api',
      pseudoApiUrl: 'https://api-int.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api-int.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-hcp'
      },
      enablePseudo: true
    },
    intExtPatient: {
      env: 'intExtPatient',
      fhirGatewayUrl: 'https://uhmep-fhirgateway-v4.int.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-patient',
      apiUrl: 'https://referral-prescription.int.pub.vascloud.be/frontend/api',
      pseudoApiUrl: 'https://api-int.ehealth.fgov.be/pseudo/v1',
      keycloak: {
        url: 'https://api-int.ehealth.fgov.be/auth',
        realm: 'healthcare',
        clientId: 'nihdi-uhmep-patient'
      },
      enablePseudo: true
    },
    accHcp: {
      env: 'accHcp',
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
      env: 'accPatient',
      fhirGatewayUrl: 'https://extranet-acpt.referral-prescription.ehealth.fgov.be/backend/application/fhirgateway/uhmep/v1',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-patient',
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
      env: 'accInHcp',
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
      env: 'accInPatient',
      fhirGatewayUrl: 'https://fhirgateway.uhmep.acc.in.ext.vasha.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-patient',
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
      env: 'accUpHcp',
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
      env: 'accUpPatient',
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
      env: 'prodHcp',
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
      env: 'prodPatient',
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
      env: 'prodInHcp',
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
      env: 'prodInPatient',
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
      env: 'prodUpHcp',
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
      env: 'prodUpPatient',
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
