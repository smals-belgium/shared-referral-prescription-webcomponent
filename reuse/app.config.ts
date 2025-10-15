import { IConfiguration } from '@smals/ngx-configuration-service';

interface AppConfig extends IConfiguration {
  variables: {
    [env: string]: AppConfigVariables;
  };
}

export type FeatureFlagKeys = keyof EnabledFeatures;

export interface EnabledFeatures {
  filters: boolean;
}

interface AppConfigVariables {
  env: string;
  fhirGatewayUrl: string;
  fhirGatewayClientId?: string;
  apiUrl: string;
  pseudoApiUrl?: string;
  enablePseudo?: boolean;
  enableSentry?: boolean;
  enabledFeatures?: EnabledFeatures;
}

export const APP_CONFIG: AppConfig = {
  environments: [],
  variables: {
    localPatient: {
      env: 'localPatient',
      fhirGatewayUrl: 'http://referral-prescription-fakeapi-v4.test.paas.vasdc.be',
      apiUrl: 'http://localhost:8080/frontend/api',
      enablePseudo: true,
      pseudoApiUrl: 'https://uhmep-mockingbird.test.ext.vascloud.be/pseudo/v1',
      enabledFeatures: {
        filters: true,
      },
    },
    localHcp: {
      env: 'localHcp',
      fhirGatewayUrl: 'http://referral-prescription-fakeapi-v4.test.paas.vasdc.be',
      apiUrl: 'http://localhost:8080/frontend/api',
      enablePseudo: true,
      pseudoApiUrl: 'http://uhmep-mockingbird.test.paas.vasdc.be/pseudo/v1',
      enabledFeatures: {
        filters: false,
      },
    },
    testHcp: {
      env: 'testHcp',
      fhirGatewayUrl: 'https://referral-prescription-v4.test.ext.vascloud.be/backend/application/fhirgateway/uhmep/v1',
      apiUrl: 'https://referral-prescription.test.ext.vascloud.be/frontend/api',
      enablePseudo: true,
      pseudoApiUrl: 'https://uhmep-mockingbird.test.ext.vascloud.be/pseudo/v1',
    },
    testPatient: {
      env: 'testPatient',
      fhirGatewayUrl: 'https://referral-prescription-v4.test.ext.vascloud.be/backend/application/fhirgateway/uhmep/v1',
      apiUrl: 'https://referral-prescription.test.ext.vascloud.be/frontend/api',
      enablePseudo: true,
      pseudoApiUrl: 'https://uhmep-mockingbird.test.ext.vascloud.be/pseudo/v1',
    },
    intExtHcp: {
      env: 'intExtHcp',
      fhirGatewayUrl: 'https://uhmep-fhirgateway-v4.int.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://referral-prescription.int.ext.vascloud.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    intExtPatient: {
      env: 'intExtPatient',
      fhirGatewayUrl: 'https://uhmep-fhirgateway-v4.int.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-patient',
      apiUrl: 'https://referral-prescription.int.ext.vascloud.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    intPubHcp: {
      env: 'intPubHcp',
      fhirGatewayUrl: 'https://uhmep-fhirgateway-v4.int.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://referral-prescription.int.pub.vascloud.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    intPubPatient: {
      env: 'intPubPatient',
      fhirGatewayUrl: 'https://uhmep-fhirgateway-v4.int.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-patient',
      apiUrl: 'https://referral-prescription.int.pub.vascloud.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    accHcp: {
      env: 'accHcp',
      fhirGatewayUrl:
        'https://extranet-acpt.referral-prescription.ehealth.fgov.be/backend/application/fhirgateway/uhmep/v1',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://wwwacc.referral-prescription.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    accPatient: {
      env: 'accPatient',
      fhirGatewayUrl:
        'https://extranet-acpt.referral-prescription.ehealth.fgov.be/backend/application/fhirgateway/uhmep/v1',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-patient',
      apiUrl: 'https://wwwacc.referral-prescription.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    accInHcp: {
      env: 'accInHcp',
      fhirGatewayUrl: 'https://fhirgateway.uhmep.acc.in.ext.vasha.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://wwwacc.referral-prescription.in.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    accInPatient: {
      env: 'accInPatient',
      fhirGatewayUrl: 'https://fhirgateway.uhmep.acc.in.ext.vasha.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-patient',
      apiUrl: 'https://wwwacc.referral-prescription.in.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    accUpHcp: {
      env: 'accUpHcp',
      fhirGatewayUrl: 'https://fhirgateway.uhmep.acc.up.ext.vasha.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://wwwacc.referral-prescription.up.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    accUpPatient: {
      env: 'accUpPatient',
      fhirGatewayUrl: 'https://fhirgateway.uhmep.acc.up.ext.vasha.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://wwwacc.referral-prescription.up.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api-acpt.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    prodHcp: {
      env: 'prodHcp',
      fhirGatewayUrl: 'https://uhmep-fhirgateway.prd.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://www.referral-prescription.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    prodPatient: {
      env: 'prodPatient',
      fhirGatewayUrl: 'https://uhmep-fhirgateway.prd.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://www.referral-prescription.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    prodInHcp: {
      env: 'prodInHcp',
      fhirGatewayUrl: 'https://uhmep-fhirgateway.prd.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://www.referral-prescription.in.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    prodInPatient: {
      env: 'prodInPatient',
      fhirGatewayUrl: 'https://uhmep-fhirgateway.prd.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://www.referral-prescription.in.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    prodUpHcp: {
      env: 'prodUpHcp',
      fhirGatewayUrl: 'https://uhmep-fhirgateway.prd.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://www.referral-prescription.up.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
    prodUpPatient: {
      env: 'prodUpPatient',
      fhirGatewayUrl: 'https://uhmep-fhirgateway.prd.pub.vascloud.be',
      fhirGatewayClientId: 'nihdi-uhmep-fhir-hcp',
      apiUrl: 'https://www.referral-prescription.up.ehealth.fgov.be/frontend/api',
      pseudoApiUrl: 'https://api.ehealth.fgov.be/pseudo/v1',
      enablePseudo: true,
    },
  },
};
