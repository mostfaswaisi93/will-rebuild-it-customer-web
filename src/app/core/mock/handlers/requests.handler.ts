import { ReconstructionRequest } from '@core/models';
import { MockHandler, notFound, ok, paginate } from '../mock-types';

export const handleRequests: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'requests' || ctx.method !== 'GET') {
    return undefined;
  }

  if (ctx.segments.length === 1) {
    let items: ReconstructionRequest[] = ctx.store.requests;

    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((request) => request.status === status);
    }

    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (request) =>
          request.requestNumber.toLowerCase().includes(searchKey) ||
          request.description.toLowerCase().includes(searchKey),
      );
    }

    return ok(paginate(items, ctx));
  }

  if (ctx.segments.length === 2) {
    const request = ctx.store.requests.find((candidate) => candidate.id === ctx.segments[1]);
    return request ? ok(request) : notFound(`Request ${ctx.segments[1]} not found.`);
  }

  return undefined;
};
