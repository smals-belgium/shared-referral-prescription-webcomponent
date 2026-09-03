export abstract class PseudonymizationService {
  abstract pseudonymize(value: string): Promise<string>;
  abstract identify(value: string): Promise<string>;
  abstract pseudonymizeByteArray(array: Uint8Array<ArrayBufferLike>): Promise<string>;
  abstract identifyByteArray(value: string): Promise<Uint8Array<ArrayBufferLike>>;
}
