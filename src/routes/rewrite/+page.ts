import type { PageLoad } from './$types';
import type { State } from '.';

export const load: PageLoad = async ({ url }) => {
  const state: Partial<State> = {};
  const tryOr = <T>(key: string, fallback: T): T => {
    try {
      const k = url.searchParams.get(key);
      return k !== null ? JSON.parse(k) : fallback;
    } catch (error) {
      return fallback;
    }
  }
  state.page = parseInt(url.searchParams.get('page') || '1');
  state.pageSize = parseInt(url.searchParams.get('pageSize') || '50');
  state.query = url.searchParams.get('query') || '';
  state.limits = tryOr('limits', []);
  state.exclude = tryOr('exclude', {
    letters: '',
    prefixes: [],
    suffixes: []
  });
  state.sort = tryOr('sort', {
    key: 'value',
    order: 'desc'
  });
  state.shuffle = tryOr('shuffle', { current: null, past: [] });

  return state as Required<State>;
};