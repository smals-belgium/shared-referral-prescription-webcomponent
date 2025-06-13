import { AutocompleteOption } from '@smals/vas-evaluation-form-ui-core';

export interface Indication {
  id: string
  name: string
}

export interface ControlAnnex82Request {
  examId: string
  exchangeId: string;
  indications: AutocompleteOption[];
}

export interface Translation {
  "language": 'FR' | 'NL'
  "value": string
}

export interface Instruction {
  "system": string
  "code": string
  "translations": Translation[]
}

interface System {
  "code": string
  "translations": Translation[],
  "version": string
}

interface SupportOptionMetadata {
  "isRequested": boolean,
  "radiationLevel": number,
  "relativeCost": number
}


export interface SupportOption {
  "id": string
  "score": number
  "instruction": Instruction
  "system": System
  "supportOptionMetadata": SupportOptionMetadata
}

export interface ControlAnnex82Response {
  request: any
  supportOptions: SupportOption[]
}
