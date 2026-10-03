export const solutionTechnicians = [
  {
    name: 'Marcus Lee',
    avatar: 'marcus-lee-v2',
    rating: '4.9',
    jobs: 126,
    skills: ['POS Installation', 'Retail'],
    location: 'Chicago, IL'
  },
  {
    name: 'Priya Shah',
    avatar: 'priya-shah-field-v3',
    rating: '4.8',
    jobs: 95,
    skills: ['Networking', 'Structured Cabling'],
    location: 'Denver, CO'
  },
  {
    name: 'Jordan Miles',
    avatar: 'alex-rivera-v2',
    rating: '4.9',
    jobs: 110,
    skills: ['AV & Signage', 'Electrical'],
    location: 'Austin, TX'
  }
] as const;

export function findSolutionTechnicians(query: string) {
  const normalized = query.trim().toLowerCase();
  return solutionTechnicians.filter((technician) =>
    [technician.name, technician.location, ...technician.skills]
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  );
}

export const solutionJobs = [
  {
    id: 'WO-2847',
    title: 'Store Repair',
    location: 'Chicago, IL',
    technician: 'Marcus Lee',
    status: 'In Progress'
  },
  {
    id: 'WO-2848',
    title: 'Network Installation',
    location: 'Denver, CO',
    technician: '',
    status: 'Unassigned'
  },
  {
    id: 'WO-2849',
    title: 'Security Camera Setup',
    location: 'Austin, TX',
    technician: '',
    status: 'Unassigned'
  },
  {
    id: 'WO-2850',
    title: 'Display Maintenance',
    location: 'Dallas, TX',
    technician: '',
    status: 'Unassigned'
  }
] as const;
export type SolutionJob = (typeof solutionJobs)[number];
export type DispatchView = 'Map' | 'List' | 'Unassigned';
export function getSolutionJobs(view: DispatchView) {
  return solutionJobs.filter((job) => view !== 'Unassigned' || job.status === 'Unassigned');
}
