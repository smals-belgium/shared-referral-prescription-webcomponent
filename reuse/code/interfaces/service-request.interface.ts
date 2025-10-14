export interface OccurrenceTiming {
  repeat: Repeat;
}

export type UnitsOfTime = 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a';
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Repeat {
  boundsDuration?: BoundsDuration;
  count?: number;
  frequency?: number;
  period?: number;
  periodUnit?: UnitsOfTime;
  duration?: number;
  durationUnit?: UnitsOfTime;
  dayOfWeek?: Weekday[];
  when?: string[];
}

export interface BoundsDuration {
  code: UnitsOfTime;
  system: string;
  value: number;
}
