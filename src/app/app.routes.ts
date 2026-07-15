import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

export const routes: Routes = [
  // ---- Public (no shell) ----
  {
    path: '',
    loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
  },
  {
    path: 'pub/project/:projectId',
    loadComponent: () => import('./features/public/project-public/project-public').then((m) => m.ProjectPublic),
  },
  {
    path: 'pub/team/:teamId',
    loadComponent: () => import('./features/teams/team-profile/team-profile').then((m) => m.TeamProfile),
  },
  {
    path: 'pub/email-check/:ctx',
    loadComponent: () => import('./features/auth/email-check/email-check').then((m) => m.EmailCheck),
  },
  {
    path: 'pub/donate/:projectId',
    loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
    data: { titleKey: 'nav.donations' },
  },
  {
    path: 'pub/new-beneficiary',
    loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
    data: { titleKey: 'requests.list.title' },
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/auth/callback/callback').then((m) => m.AuthCallback),
  },

  // ---- Authenticated shell ----
  {
    path: 'app',
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'requests' },

      {
        path: 'requests',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/requests/requests-list/requests-list').then((m) => m.RequestsList),
      },
      {
        path: 'requests/:requestId',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/requests/request-view/request-view').then((m) => m.RequestView),
      },
      {
        path: 'request/new',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'nav.requests' },
      },
      {
        path: 'request/to-team/:teamId',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'nav.requests' },
      },

      {
        path: 'projects',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/projects/projects-list/projects-list').then((m) => m.ProjectsList),
      },
      {
        path: 'projects/:projectId',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/projects/project-view/project-view').then((m) => m.ProjectView),
      },

      {
        path: 'teams',
        loadComponent: () => import('./features/teams/teams-list/teams-list').then((m) => m.TeamsList),
      },
      {
        path: 'teams/:teamId',
        loadComponent: () => import('./features/teams/team-profile/team-profile').then((m) => m.TeamProfile),
      },

      {
        path: 'team-dashboard',
        canActivate: [roleGuard(['team'])],
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'nav.teamDashboard' },
      },

      {
        path: 'estimates',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'nav.estimates' },
      },
      {
        path: 'estimates/:estimateId',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'nav.estimates' },
      },

      {
        path: 'funding',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'nav.funding' },
      },
      {
        path: 'funding/:fundingId',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'nav.funding' },
      },
      {
        path: 'funding/:fundingId/sign',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'nav.funding' },
      },

      {
        path: 'donations',
        canActivate: [roleGuard(['donor'])],
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'nav.donations' },
      },
      {
        path: 'donations/new',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'nav.donations' },
      },
      {
        path: 'donations/:donationId',
        canActivate: [roleGuard(['donor'])],
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'nav.donations' },
      },

      {
        path: 'profile',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'header.menu.profile' },
      },
      {
        path: 'account',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'header.menu.profile' },
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'header.notifications' },
      },

      {
        path: 'support',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'header.menu.support' },
      },
      {
        path: 'support/new',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'header.menu.support' },
      },
      {
        path: 'support/:ticketId',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'header.menu.support' },
      },

      {
        path: 'complaints',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'header.menu.reportTeam' },
      },
      {
        path: 'complaints/new/:teamId',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'header.menu.reportTeam' },
      },
      {
        path: 'complaints/:complaintId',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'header.menu.reportTeam' },
      },

      {
        path: 'reviews',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'nav.teams' },
      },

      {
        path: 'privacy',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'content.privacy' },
      },
      {
        path: 'terms',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'content.terms' },
      },
      {
        path: 'help',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'content.help' },
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
