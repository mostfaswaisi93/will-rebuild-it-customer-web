import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

export const routes: Routes = [
  // ---- Public (no shell) ----
  {
    path: '',
    title: 'public.home.pageTitle',
    loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
  },
  {
    path: 'pub/project/:projectId',
    title: 'nav.projects',
    loadComponent: () => import('./features/public/project-public/project-public').then((m) => m.ProjectPublic),
  },
  {
    path: 'pub/team/:teamId',
    title: 'teams.profile.title',
    loadComponent: () => import('./features/teams/team-profile/team-profile').then((m) => m.TeamProfile),
  },
  {
    path: 'pub/start',
    title: 'public.areaStart.pageTitle',
    loadComponent: () => import('./features/public/area-start/area-start').then((m) => m.AreaStart),
  },
  {
    path: 'pub/email-check/:ctx',
    title: 'auth.emailCheck.title',
    loadComponent: () => import('./features/auth/email-check/email-check').then((m) => m.EmailCheck),
  },
  {
    path: 'pub/donate',
    title: 'donations.donate.title',
    loadComponent: () => import('./features/donations/donate/donate').then((m) => m.Donate),
  },
  {
    path: 'pub/donate/:projectId',
    title: 'donations.donate.title',
    loadComponent: () => import('./features/donations/donate/donate').then((m) => m.Donate),
  },
  {
    path: 'pub/new-beneficiary',
    title: 'wizards.newBeneficiary.title',
    loadComponent: () => import('./features/wizards/new-beneficiary/new-beneficiary').then((m) => m.NewBeneficiary),
  },
  {
    path: 'pub/new-beneficiary/:teamId',
    title: 'wizards.newBeneficiary.title',
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
        title: 'nav.dashboard',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/dashboard/dashboard/dashboard').then((m) => m.Dashboard),
      },

      {
        path: 'requests',
        title: 'requests.list.title',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/requests/requests-list/requests-list').then((m) => m.RequestsList),
      },
      {
        // Also reachable by the assigned team from its workspace.
        path: 'requests/:requestId',
        title: 'requests.list.title',
        canActivate: [roleGuard(['beneficiary', 'team'])],
        loadComponent: () => import('./features/requests/request-view/request-view').then((m) => m.RequestView),
      },
      {
        path: 'request/new',
        title: 'wizards.assessment.title',
        loadComponent: () => import('./features/wizards/assessment-wizard/assessment-wizard').then((m) => m.AssessmentWizard),
      },
      {
        path: 'request/to-team/:teamId',
        title: 'wizards.request.title',
        loadComponent: () => import('./features/wizards/request-wizard/request-wizard').then((m) => m.RequestWizard),
      },

      {
        path: 'projects',
        title: 'projects.list.title',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/projects/projects-list/projects-list').then((m) => m.ProjectsList),
      },
      {
        // Also reachable by the assigned team from its workspace.
        path: 'projects/:projectId',
        title: 'projects.list.title',
        canActivate: [roleGuard(['beneficiary', 'team'])],
        loadComponent: () => import('./features/projects/project-view/project-view').then((m) => m.ProjectView),
      },

      {
        path: 'teams',
        title: 'teams.list.title',
        loadComponent: () => import('./features/teams/teams-list/teams-list').then((m) => m.TeamsList),
      },
      {
        path: 'teams/:teamId',
        title: 'teams.profile.title',
        loadComponent: () => import('./features/teams/team-profile/team-profile').then((m) => m.TeamProfile),
      },

      {
        path: 'team-dashboard',
        title: 'nav.teamDashboard',
        canActivate: [roleGuard(['team'])],
        loadComponent: () => import('./features/team-workspace/team-workspace/team-workspace').then((m) => m.TeamWorkspace),
      },

      {
        path: 'estimates',
        title: 'estimates.list.title',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/estimates/estimates-list/estimates-list').then((m) => m.EstimatesList),
      },
      {
        // Also reachable by the authoring team from its workspace.
        path: 'estimates/:estimateId',
        title: 'estimates.list.title',
        canActivate: [roleGuard(['beneficiary', 'team'])],
        loadComponent: () => import('./features/estimates/estimate-view/estimate-view').then((m) => m.EstimateView),
      },

      {
        path: 'funding',
        title: 'funding.list.title',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/funding/funding-list/funding-list').then((m) => m.FundingList),
      },
      {
        path: 'funding/:fundingId',
        title: 'funding.list.title',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/funding/funding-details/funding-details').then((m) => m.FundingDetails),
      },
      {
        path: 'funding/:fundingId/sign',
        title: 'funding.signature.title',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/funding/funding-signature/funding-signature').then((m) => m.FundingSignature),
      },
      {
        path: 'funding/:fundingId/txn/:txnId',
        title: 'funding.list.title',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () =>
          import('./features/funding/disbursement-details/disbursement-details').then((m) => m.DisbursementDetails),
      },

      {
        path: 'donations',
        title: 'donations.list.title',
        canActivate: [roleGuard(['donor'])],
        loadComponent: () => import('./features/donations/donations-list/donations-list').then((m) => m.DonationsList),
      },
      {
        path: 'donations/new',
        title: 'donations.donate.title',
        loadComponent: () => import('./features/donations/donate/donate').then((m) => m.Donate),
      },
      {
        path: 'donations/:donationId',
        title: 'donations.list.title',
        canActivate: [roleGuard(['donor'])],
        loadComponent: () => import('./features/donations/donation-detail/donation-detail').then((m) => m.DonationDetail),
      },

      {
        path: 'profile',
        title: 'header.menu.profile',
        loadComponent: () => import('./features/account/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'account',
        title: 'account.title',
        loadComponent: () => import('./features/account/account/account').then((m) => m.Account),
      },
      {
        path: 'email-preferences',
        title: 'account.emailPreferences.title',
        loadComponent: () =>
          import('./features/account/email-preferences/email-preferences').then((m) => m.EmailPreferences),
      },
      {
        path: 'notifications',
        title: 'header.notifications',
        loadComponent: () => import('./features/notifications/notifications-list/notifications-list').then((m) => m.NotificationsList),
      },

      {
        path: 'support',
        title: 'support.list.title',
        loadComponent: () => import('./features/support/support-list/support-list').then((m) => m.SupportList),
      },
      {
        path: 'support/new',
        title: 'support.form.title',
        loadComponent: () => import('./features/support/support-form/support-form').then((m) => m.SupportForm),
      },
      {
        path: 'support/:ticketId',
        title: 'support.list.title',
        loadComponent: () => import('./features/support/support-view/support-view').then((m) => m.SupportView),
      },

      {
        path: 'complaints',
        title: 'complaints.list.title',
        loadComponent: () => import('./features/complaints/complaints-list/complaints-list').then((m) => m.ComplaintsList),
      },
      {
        path: 'complaints/new/:teamId',
        title: 'complaints.form.title',
        loadComponent: () => import('./features/complaints/complaint-form/complaint-form').then((m) => m.ComplaintForm),
      },
      {
        path: 'complaints/:complaintId',
        title: 'complaints.list.title',
        loadComponent: () => import('./features/complaints/complaint-view/complaint-view').then((m) => m.ComplaintView),
      },

      {
        path: 'reviews',
        title: 'reviews.title',
        canActivate: [roleGuard(['beneficiary'])],
        loadComponent: () => import('./features/reviews/reviews-list/reviews-list').then((m) => m.ReviewsList),
      },

      {
        path: 'privacy',
        title: 'content.privacy.title',
        loadComponent: () => import('./features/content/privacy/privacy').then((m) => m.Privacy),
      },
      {
        path: 'terms',
        title: 'content.terms.title',
        loadComponent: () => import('./features/content/terms/terms').then((m) => m.Terms),
      },
      {
        path: 'help',
        title: 'content.help.title',
        loadComponent: () => import('./features/content/help-faq/help-faq').then((m) => m.HelpFaq),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
