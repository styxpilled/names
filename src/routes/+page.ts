import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
  const obj: {
    [key: string]: unknown
  } = {};
  // This is more like a proof of concept. Since we know what the shape of the data is, we could declare it all explicitly and not do thing `unknown` and `JSON.parse` stuff.
  for (const element of url.searchParams.entries()) {
    try {
      obj[element[0]] = JSON.parse(element[1]);
    } catch (error) {
      obj[element[0]] = element[1];
    }
  }
  return obj;
};