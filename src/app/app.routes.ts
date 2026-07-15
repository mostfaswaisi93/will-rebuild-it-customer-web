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
    path: 'pub/donate',
    loadComponent: () => import('./features/donations/donate/donate').then((m) => m.Donate),
  },
  {
    path: 'pub/donate/:projectId',
    loadComponent: () => import('./features/donations/donate/donate').then((m) => m.Donate),
  },
  {
    path: 'pub/new-beneficiary',
    loadComponent: () => import('./features/wizards/new-beneficiary/new-beneficiary').then((m) => m.NewBeneficiary),
  },
  {
    path: 'pub/new-beneficiary/:teamId',
    loadComponent: () => import('./features/wizards/new-beneficiary/new-beneficiary').then((m) => m.NewBeneficiary),
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
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      {
        path: 'dashboard',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/dashboard/dashboard/dashboard').then((m) => m.Dashboard),
      },

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
        loadComponent: () => import('./features/wizards/assessment-wizard/assessment-wizard').then((m) => m.AssessmentWizard),
      },
      {
        path: 'request/to-team/:teamId',
        loadComponent: () => import('./features/wizards/request-wizard/request-wizard').then((m) => m.RequestWizard),
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
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/estimates/estimates-list/estimates-list').then((m) => m.EstimatesList),
      },
      {
        path: 'estimates/:estimateId',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/estimates/estimate-view/estimate-view').then((m) => m.EstimateView),
      },

      {
        path: 'funding',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/funding/funding-list/funding-list').then((m) => m.FundingList),
      },
      {
        path: 'funding/:fundingId',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/funding/funding-details/funding-details').then((m) => m.FundingDetails),
      },
      {
        path: 'funding/:fundingId/sign',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/funding/funding-signature/funding-signature').then((m) => m.FundingSignature),
      },
      {
        path: 'funding/:fundingId/txn/:txnId',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/funding/disbursement-details/disbursement-details').then((m) => m.DisbursementDetails),
      },

      {
        path: 'donations',
        canActivate: [roleGuard(['donor'])],
        loadComponent: () => import('./features/donations/donations-list/donations-list').then((m) => m.DonationsList),
      },
      {
        path: 'donations/new',
        loadComponent: () => import('./features/donations/donate/donate').then((m) => m.Donate),
      },
      {
        path: 'donations/:donationId',
        canActivate: [roleGuard(['donor'])],
        loadComponent: () => import('./features/donations/donation-detail/donation-detail').then((m) => m.DonationDetail),
      },

      {
        path: 'profile',
        loadComponent: () => import('./features/account/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'account',
        loadComponent: () => import('./features/account/account/account').then((m) => m.Account),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications-list/notifications-list').then((m) => m.NotificationsList),
      },

      {
        path: 'support',
        loadComponent: () => import('./features/support/support-list/support-list').then((m) => m.SupportList),
      },
      {
        path: 'support/new',
        loadComponent: () => import('./features/support/support-form/support-form').then((m) => m.SupportForm),
      },
      {
        path: 'support/:ticketId',
        loadComponent: () => import('./features/support/support-view/support-view').then((m) => m.SupportView),
      },

      {
        path: 'complaints',
        loadComponent: () => import('./features/complaints/complaints-list/complaints-list').then((m) => m.ComplaintsList),
      },
      {
        path: 'complaints/new/:teamId',
        loadComponent: () => import('./features/complaints/complaint-form/complaint-form').then((m) => m.ComplaintForm),
      },
      {
        path: 'complaints/:complaintId',
        loadComponent: () => import('./features/complaints/complaint-view/complaint-view').then((m) => m.ComplaintView),
      },

      {
        path: 'reviews',
        loadComponent: () => import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { titleKey: 'nav.teams' },
      },

      {
        path: 'privacy',
        loadComponent: () => import('./features/content/privacy/privacy').then((m) => m.Privacy),
      },
      {
        path: 'terms',
        loadComponent: () => import('./features/content/terms/terms').then((m) => m.Terms),
      },
      {
        path: 'help',
        loadComponent: () => import('./features/content/help-faq/help-faq').then((m) => m.HelpFaq),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
