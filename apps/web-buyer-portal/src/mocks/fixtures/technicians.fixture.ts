import type { NearbyTechnicianDto } from '@fieldforge/contracts';

export const mockTechnicians: NearbyTechnicianDto[] = [
  {
    techId: 'tech-marcus-01',
    fullName: 'Marcus Vance, CCNA',
    rating: 4.98,
    completedJobsCount: 142,
    distanceMiles: 1.8,
    latitude: 37.779,
    longitude: -122.41,
    isAvailable: true,
    certifications: ['Cisco CCNA', 'CompTIA A+', 'OSHA 10', 'Background Checked']
  },
  {
    techId: 'tech-elena-02',
    fullName: 'Elena Rostova',
    rating: 4.92,
    completedJobsCount: 98,
    distanceMiles: 3.4,
    latitude: 37.765,
    longitude: -122.42,
    isAvailable: true,
    certifications: ['Weights & Measures State Cert', 'CompTIA A+', 'Background Checked']
  },
  {
    techId: 'tech-darnell-03',
    fullName: 'Darnell Jenkins, CCNP',
    rating: 4.88,
    completedJobsCount: 215,
    distanceMiles: 4.2,
    latitude: 37.795,
    longitude: -122.398,
    isAvailable: true,
    certifications: ['Cisco CCNP', 'CompTIA Network+', 'OSHA 10']
  },
  {
    techId: 'tech-sarah-04',
    fullName: 'Sarah Lin',
    rating: 4.95,
    completedJobsCount: 76,
    distanceMiles: 5.1,
    latitude: 37.74,
    longitude: -122.44,
    isAvailable: false,
    certifications: ['IoT Specialist', 'Outdoor Display Cert', 'OSHA 10']
  },
  {
    techId: 'tech-andre-05',
    fullName: 'Andre Becker',
    rating: 4.85,
    completedJobsCount: 164,
    distanceMiles: 2.3,
    latitude: 37.77,
    longitude: -122.43,
    isAvailable: true,
    certifications: ['CompTIA A+', 'OSHA 10', 'Cat6 Structured Cabling']
  }
];
