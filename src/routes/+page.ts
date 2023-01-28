import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
  const obj: {
    [key: string]: unknown
  } = {};
  for (const element of url.searchParams.entries()) {
    try {
      obj[element[0]] = JSON.parse(element[1]);
    } catch (error) {
      obj[element[0]] = element[1];
    }
  }
  return obj;
};