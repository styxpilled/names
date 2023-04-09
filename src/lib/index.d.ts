export type Person = {
  value: string;
  fem_percent: number;
  rare_percent: number;
  femininity: number;
  masculinity: number;
  popularity: number;
  word_length: number;
  total_vowels: number;
  total_consonants: number;
  consecutive_vowels: number;
  consecutive_consonants: number;
};

export type Data = {
  data: Person[];
}

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