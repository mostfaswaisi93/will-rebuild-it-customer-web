import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

// A production build serving fabricated records is the one failure mode that
// looks completely healthy, so say so loudly. The banner covers the UI; this
// covers anyone reading a console or a deploy smoke-test log.
if (environment.production && environment.useMockApi) {
  console.warn(
    '[Gaza Reconstruction Platform] Running a PRODUCTION build against the in-memory MOCK backend. ' +
      'All projects, families, funding and donations shown are sample data. ' +
      'Set `useMockApi: false` in src/environments/environment.ts and point `apiUrl` at the real API before going live.',
  );
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
