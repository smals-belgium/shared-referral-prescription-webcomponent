import { ReferralEnv } from '@reuse/code/interfaces/environment.interface';

declare global {
  interface Window {
    referralPrescriptionEnv?: ReferralEnv;
  }
}

export {};
