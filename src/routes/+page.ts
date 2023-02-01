import type { PageLoad } from './$types';
import type { Filter } from '.'

export const load: PageLoad = async ({ url }) => {
  const obj: {
    query?: string,
    filters?: Filter[]
  } = {};
  // This is more like a proof of concept. Since we know what the shape of the data is, we could declare it all explicitly and not do thing `unknown` and `JSON.parse` stuff.
  obj.query = url.searchParams.get('query') || '';
  try {
    obj.filters = JSON.parse(url.searchParams.get('filters') || '[]');
  } catch (error) {
    obj.filters = [];
  }

  return obj;
};