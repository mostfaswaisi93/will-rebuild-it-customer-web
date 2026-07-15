import { AssessmentQuestion } from '@core/models';

/**
 * A curated, static assessment question set. A real backend would drive a
 * branching questionnaire via nextQuestionId; here the wizard walks these in
 * order, which keeps the flow honest and functional without a live engine.
 */
export const seedAssessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'q-property-type',
    prompt: 'What type of property was damaged?',
    inputType: 'radio',
    options: [
      { id: 'opt-residential', label: 'Residential' },
      { id: 'opt-commercial', label: 'Commercial' },
      { id: 'opt-agricultural', label: 'Agricultural' },
      { id: 'opt-infrastructure', label: 'Infrastructure' },
      { id: 'opt-public', label: 'Public facility' },
    ],
  },
  {
    id: 'q-severity',
    prompt: 'How severe is the damage?',
    inputType: 'radio',
    options: [
      { id: 'opt-partial', label: 'Partial damage' },
      { id: 'opt-severe', label: 'Severe damage' },
      { id: 'opt-total', label: 'Total loss' },
    ],
  },
  {
    id: 'q-occupancy',
    prompt: 'Is the property currently safe to occupy?',
    inputType: 'radio',
    options: [
      { id: 'opt-occupied', label: 'Yes, we are living here' },
      { id: 'opt-partly', label: 'Partly, only some rooms' },
      { id: 'opt-unsafe', label: 'No, it is unsafe' },
    ],
  },
  {
    id: 'q-utilities',
    prompt: 'Which utilities are affected?',
    inputType: 'checkbox',
    options: [
      { id: 'opt-water', label: 'Water' },
      { id: 'opt-electricity', label: 'Electricity' },
      { id: 'opt-sewage', label: 'Sewage' },
      { id: 'opt-none', label: 'None' },
    ],
  },
  {
    id: 'q-household',
    prompt: 'How many people live in the household?',
    inputType: 'number',
  },
];
