export interface BasedOn {
  reference: string;
}

export interface Owner {
  reference: string;
}

export interface Code {
  coding: Coding[];
}

export interface Coding {
  system: string;
  code: string;
}

export interface Identifier {
  system: string;
  value: string;
}

export interface Period {
  start?: string;
  end?: string;
}
