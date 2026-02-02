export const wrapperManifest = {
  selector: 'uhmep-prescription-details',
  customElement: {
    tag: 'nihdi-referral-prescription-details',
  },
  tokenExchange: {
    clientId: 'nihdi-uhmep-patient',
  },
  events: {
    open: {
      componentTag: 'uhmep-prescription-details',
    },
  },
};
