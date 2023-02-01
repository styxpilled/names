import type { Person } from '..';

export type Limit = {
  key: keyof Person;
  min: number;
  max: number;
};

export type State = {
  page: number,
  pageSize: number,
  query: string,
  limits: Limit[],
  exclude: {
    letters: string,
    suffixes: string[],
    prefixes: string[]
  },
  sort: {
    key: keyof Person,
    order: 'asc' | 'desc'
  },
  shuffle: {
    current: number | null,
    past: number[]
  }
}