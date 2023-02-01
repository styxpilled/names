import type fakedata from './fakedata.json';

export type Person = (typeof fakedata.data)[0];
export type LimitFilter = {
  type: 'limit';
  filter: {
    min: number;
    max: number;
    key: keyof Person;
  };
};
export type SortFilter = {
  type: 'sort';
  filter: {
    order: 'asc' | 'desc';
    key: keyof Person;
  };
};
export type ExcludeFilter = {
  type: 'exclude';
  filter: {
    type: 'letter' | 'prefix' | 'suffix';
    value: ''
  };
};
export type ShuffleFilter = {
  type: 'shuffle';
};
export type Filter = SortFilter | LimitFilter | ExcludeFilter | ShuffleFilter;