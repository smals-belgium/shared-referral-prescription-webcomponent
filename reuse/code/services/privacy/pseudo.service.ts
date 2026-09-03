import { Injectable } from '@angular/core';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { PseudonymizationService } from './pseudo.service.abstract';
import { PseudoService as EnhancedPseudoService } from '@smals-belgium/shared-pseudo-tools-js';
import { firstValueFrom } from 'rxjs';
import { pseudonymInTransitMock, Uint8ArrayMock } from '@reuse/code/demo/mocks/pseudonymInTransit';

@Injectable({ providedIn: 'root' })
export class PseudoService implements PseudonymizationService {
  private readonly enhancedPseudoService?: EnhancedPseudoService;
  private readonly env = this.configService.getEnvironment();

  private readonly pseudoApiUrl = this.configService.getEnvironmentVariable('pseudoApiUrl') as string;
  private readonly pseudoEnabled = this.configService.getEnvironmentVariable('enablePseudo');

  constructor(
    private readonly configService: ConfigurationService,
    private readonly pseudonymizationHelper: PseudonymisationHelper
  ) {
    if (this.pseudoEnabled && this.pseudoApiUrl) {
      this.enhancedPseudoService = new EnhancedPseudoService(this.pseudonymizationHelper, {
        domain: 'uhmep_v1',
        curve: 'p521',
        endpoint: this.pseudoApiUrl,
        audience: '',
        bufferSize: 8,
      });
    }
  }

  async pseudonymize(value: string): Promise<string> {
    return this.pseudoEnabled && this.enhancedPseudoService
      ? firstValueFrom(this.enhancedPseudoService.toAsn1Compressed(value))
      : value;
  }

  async identify(value: string): Promise<string> {
    if (!this.enhancedPseudoService) {
      return value;
    }
    return firstValueFrom(this.enhancedPseudoService.fromAsn1Compressed(value));
  }

  async pseudonymizeByteArray(array: Uint8Array<ArrayBufferLike>): Promise<string> {
    if (!this.enhancedPseudoService) {
      if (this.env === 'demo') {
        return pseudonymInTransitMock.sec1Compressed();
      }
      this.handlePseudomizationNotEnabled();
    }
    return firstValueFrom(this.enhancedPseudoService.byteArraytoAsn1Compressed(array));
  }

  async identifyByteArray(value: string): Promise<Uint8Array<ArrayBufferLike>> {
    if (!this.enhancedPseudoService) {
      if (this.env === 'demo') {
        return Uint8ArrayMock;
      }
      this.handlePseudomizationNotEnabled();
    }
    return firstValueFrom(this.enhancedPseudoService.byteArrayFromAsn1Compressed(value));
  }

  private handlePseudomizationNotEnabled(): never {
    throw new Error('Pseudomization not enabled.');
  }
}
