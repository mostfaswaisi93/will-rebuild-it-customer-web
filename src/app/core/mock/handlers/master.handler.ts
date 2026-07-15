import { MockHandler, ok } from '../mock-types';

export const handleMaster: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'master' || ctx.method !== 'GET') {
    return undefined;
  }

  if (ctx.segments[1] === 'geo-areas') {
    return ok(ctx.store.geoAreas);
  }

  if (ctx.segments[1] === 'settings') {
    return ok(ctx.store.globalSettings);
  }

  return undefined;
};
