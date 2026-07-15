export const USER_ROLES = ['beneficiary', 'team', 'donor'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const REQUEST_TYPES = ['assessment', 'reconstruction'] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_STATUSES = ['new', 'underReview', 'matched', 'accepted', 'rejected'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const PROPERTY_TYPES = [
  'residential',
  'commercial',
  'agricultural',
  'infrastructure',
  'publicFacility',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const DAMAGE_SEVERITIES = ['partial', 'severe', 'totalLoss'] as const;
export type DamageSeverity = (typeof DAMAGE_SEVERITIES)[number];

/** The seven reconstruction phases, in order (REBUILD_PROMPT Appendix A). */
export const PROJECT_PHASE_KEYS = [
  'damageAssessment',
  'debrisRemoval',
  'designAndPermits',
  'foundation',
  'structure',
  'finishing',
  'handover',
] as const;
export type ProjectPhaseKey = (typeof PROJECT_PHASE_KEYS)[number];

export const PROJECT_STATUSES = ['active', 'onHold', 'completed', 'delivered', 'cancelled'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const FUNDING_STATUSES = ['unfunded', 'partiallyFunded', 'fullyFunded', 'refunded'] as const;
export type FundingStatus = (typeof FUNDING_STATUSES)[number];

export const ESTIMATE_STATUSES = ['pendingApproval', 'approved', 'rejected'] as const;
export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];

export const DONATION_STATUSES = ['succeeded', 'processing', 'failed'] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const DONATION_FREQUENCIES = ['once', 'monthly'] as const;
export type DonationFrequency = (typeof DONATION_FREQUENCIES)[number];

export const SUPPORT_STATUSES = ['open', 'closed'] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export const COMPLAINT_STATUSES = ['open', 'closed'] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

/** Gaza governorates, north to south. */
export const GAZA_GOVERNORATES = ['northGaza', 'gazaCity', 'deirAlBalah', 'khanYounis', 'rafah'] as const;
export type GazaGovernorate = (typeof GAZA_GOVERNORATES)[number];

export const CURRENCY = 'USD';
