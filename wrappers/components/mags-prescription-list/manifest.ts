export const wrapperManifest = {
  selector: 'uhmep-prescription-list',
  customElement: {
    tag: 'nihdi-referral-prescription-list',
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
