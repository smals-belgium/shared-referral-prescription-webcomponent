import {
  CUSTOM_ELEMENT_NAME_NIHDI_REFERRAL_PRESCRIPTION_DETAILS,
  CUSTOM_ELEMENT_NAME_UHMEP_PRESCRIPTION_DETAILS,
} from '@reuse/code/constants/common.constants';

export const wrapperManifest = {
  selector: CUSTOM_ELEMENT_NAME_UHMEP_PRESCRIPTION_DETAILS,
  customElement: {
    tag: CUSTOM_ELEMENT_NAME_NIHDI_REFERRAL_PRESCRIPTION_DETAILS,
  },
  tokenExchange: {
    clientId: 'nihdi-uhmep-patient',
  },
  events: {
    open: {
      componentTag: CUSTOM_ELEMENT_NAME_UHMEP_PRESCRIPTION_DETAILS,
    },
  },
};
