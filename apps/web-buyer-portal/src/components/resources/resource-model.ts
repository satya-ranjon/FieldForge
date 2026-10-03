export const resourceTypes = [
  'All',
  'Guides',
  'Case Studies',
  'Help Center',
  'Product Updates',
  'Templates'
] as const;
export type ResourceType = (typeof resourceTypes)[number];
export const resourceTopics = [
  'Field Operations',
  'Dispatching',
  'Technician Success',
  'Approvals & Compliance',
  'Platform Guides',
  'Templates'
] as const;
export type ResourceTopic = (typeof resourceTopics)[number];
export interface ResourceArticle {
  id: string;
  type: Exclude<ResourceType, 'All'>;
  title: string;
  description: string;
  image: string;
  alt: string;
  topics: ResourceTopic[];
  featured?: boolean;
  latest?: boolean;
  download?: string;
  illustrative?: boolean;
  sections: { title: string; body: string }[];
}
export const resources: ResourceArticle[] = [
  {
    id: 'response-time',
    type: 'Guides',
    title: 'How to reduce technician response time',
    description:
      'Practical strategies to improve response times, increase coverage and keep customers informed.',
    image: 'technician',
    alt: 'Technician checking a tablet outside a customer location',
    topics: ['Field Operations', 'Dispatching'],
    featured: true,
    sections: [
      {
        title: 'Start with a complete request',
        body: 'Record the site address, equipment affected, symptoms, access hours and a local contact before looking for a technician. Include the skills and tools needed so candidates can assess the work without another round of questions.'
      },
      {
        title: 'Choose for readiness, not distance alone',
        body: 'Check availability, relevant experience, travel time and the parts required. A nearby technician without the right access or equipment may still need a second visit. Keep a backup contact for time-sensitive work.'
      },
      {
        title: 'Make every handoff clear',
        body: 'Confirm who owns the assignment, how the site will be contacted and when the next update is due. Record assignment, acknowledgement and arrival times so the team can see where delays occur.'
      },
      {
        title: 'Review the whole journey',
        body: 'Compare request-to-assignment and assignment-to-arrival separately. Review recurring delays with your team and update site instructions. Use your own baseline to assess progress; there is no universal response-time promise.'
      }
    ]
  },
  {
    id: 'retail-scale',
    type: 'Case Studies',
    title: 'Scaling field operations across retail locations',
    description:
      'An illustrative approach to coordinating service, improving visibility and keeping stores aligned.',
    image: 'retail',
    alt: 'Illuminated modern retail storefront at dusk',
    topics: ['Field Operations', 'Dispatching'],
    featured: true,
    illustrative: true,
    sections: [
      {
        title: 'The scenario',
        body: 'Consider a retail team coordinating point-of-sale support across several regions. Requests arrive through different channels, site details vary and each store has its own opening hours. This scenario is illustrative; it is not a reported customer result.'
      },
      {
        title: 'A repeatable work request',
        body: 'The team creates a common brief containing asset identifiers, symptoms, access windows and completion criteria. Stores keep their local contact details current, while a central coordinator reviews priority and technician requirements.'
      },
      {
        title: 'A regional rollout',
        body: 'Start with a small set of locations, confirm the instructions work and adjust before expanding. Give each regional coordinator a clear escalation contact and retain the same proof requirements across locations.'
      },
      {
        title: 'What to measure',
        body: 'Track request volume, time to assignment, repeat visits and completion proof by region. Compare against the team’s own baseline. This example claims no measured savings, deployment scale or performance improvement.'
      }
    ]
  },
  {
    id: 'reporting-workbook',
    type: 'Templates',
    title: 'Field operations reporting workbook',
    description: 'Track KPIs, measure performance and identify opportunities for improvement.',
    image: 'reporting',
    alt: 'Laptop showing a field operations reporting dashboard',
    topics: ['Field Operations', 'Templates'],
    featured: true,
    download: '/resources/field-operations-reporting.csv',
    sections: []
  },
  {
    id: 'trusted-network',
    type: 'Guides',
    title: 'Building a high-trust technician network',
    description:
      'Set clear expectations and keep qualifications, communication and work history connected.',
    image: 'technician',
    alt: 'Field technician reviewing work on a tablet',
    topics: ['Technician Success', 'Approvals & Compliance'],
    latest: true,
    sections: [
      {
        title: 'Define what each job requires',
        body: 'Describe the work, site conditions and any qualifications needed before engaging a technician. Requirements differ by equipment, location and customer; keep them explicit rather than assuming one profile fits every job.'
      },
      {
        title: 'Verify and maintain records',
        body: 'Review relevant credentials through appropriate sources, obtain necessary permissions and record when they need to be renewed. Limit access to personal information and collect only what is needed for the work.'
      },
      {
        title: 'Build trust through clear feedback',
        body: 'Share scope, access instructions and proof requirements before a visit. Afterward, review communication, work quality and completeness of evidence. Give specific feedback and a way to correct missing information.'
      }
    ]
  },
  {
    id: 'onboarding-checklist',
    type: 'Templates',
    title: 'Technician onboarding checklist',
    description:
      'A reusable checklist for qualifications, site readiness and communication expectations.',
    image: 'checklist',
    alt: 'Hand holding a technician onboarding checklist on a clipboard',
    topics: ['Technician Success', 'Templates'],
    latest: true,
    download: '/resources/technician-onboarding-checklist.csv',
    sections: []
  },
  {
    id: 'approval-workflows',
    type: 'Case Studies',
    title: 'Improving approval workflows in the field',
    description: 'An illustrative workflow for complete evidence and clearer review ownership.',
    image: 'team',
    alt: 'Two field technicians reviewing a tablet together',
    topics: ['Approvals & Compliance', 'Field Operations'],
    latest: true,
    illustrative: true,
    sections: [
      {
        title: 'The scenario',
        body: 'A field team completes jobs but reviewers repeatedly ask for missing photos or notes. This is an illustrative scenario, not a documented customer case study or a claim about payment outcomes.'
      },
      {
        title: 'Agree on proof before dispatch',
        body: 'List the required photos, asset details, checklist items and sign-off expectations in the work order. Explain which person can confirm completion and who should resolve questions.'
      },
      {
        title: 'Use a consistent review',
        body: 'Check submitted evidence against the agreed scope. Identify missing items precisely and keep questions connected to the work order. Follow the agreed approval and payment terms; do not treat a photo alone as automatic approval.'
      }
    ]
  },
  {
    id: 'work-orders',
    type: 'Help Center',
    title: 'How to create and manage work orders',
    description:
      'Plan the scope, assign ownership and keep a clear record from request through completion.',
    image: 'hvac',
    alt: 'Commercial heating and cooling units beside a building',
    topics: ['Platform Guides', 'Field Operations'],
    latest: true,
    sections: [
      {
        title: 'Prepare the scope',
        body: 'Start with a clear title, site address, equipment details and a description of the work. Include access instructions, the arrival window and the evidence required at completion.'
      },
      {
        title: 'Review before publishing',
        body: 'Confirm the budget, contacts and technician qualifications. Use the work-order area to enter your request and review it before taking an action that publishes or assigns work.'
      },
      {
        title: 'Follow the record',
        body: 'Keep job notes, status updates and proof connected to the same request. Review submitted work against the agreed scope before approval. Available actions depend on account permissions and the current work-order state.'
      }
    ]
  },
  {
    id: 'resource-library-update',
    type: 'Product Updates',
    title: 'A new home for field operations resources',
    description:
      'Explore the refreshed library, category filters and downloadable planning templates.',
    image: 'reporting',
    alt: 'Field operations dashboard on a laptop',
    topics: ['Platform Guides'],
    sections: [
      {
        title: 'Find a useful starting point',
        body: 'The resource library now groups guides, illustrative case studies, help articles and templates in one place. Search by title, topic or description, or choose a resource type to narrow the list.'
      },
      {
        title: 'Take a template with you',
        body: 'Download the reporting workbook or onboarding checklist as a CSV file. Open it in your preferred spreadsheet application and replace the example values with your own records.'
      },
      {
        title: 'What this update covers',
        body: 'This update changes the marketing resource library only. It does not announce new dispatch, payment, compliance or reporting service capabilities. Newsletter subscriptions are not available yet.'
      }
    ]
  }
];

export function filterResources(
  query = '',
  type: ResourceType = 'All',
  topic?: ResourceTopic
): ResourceArticle[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return resources.filter((resource) => {
    const haystack = [resource.title, resource.description, resource.type, ...resource.topics]
      .join(' ')
      .toLowerCase();
    return (
      (type === 'All' || resource.type === type) &&
      (!topic || resource.topics.includes(topic)) &&
      terms.every((term) => haystack.includes(term))
    );
  });
}
export function resourceLabel(type: Exclude<ResourceType, 'All'>): string {
  return {
    Guides: 'Guide',
    'Case Studies': 'Case Study',
    'Help Center': 'Help Center',
    'Product Updates': 'Product Update',
    Templates: 'Template'
  }[type];
}
