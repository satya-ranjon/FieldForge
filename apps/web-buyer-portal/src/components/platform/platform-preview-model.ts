export const platformOrders = [
  {
    id: 'WO-2847',
    title: 'HVAC Maintenance',
    location: 'Austin, TX',
    technician: 'Marcus Lee',
    status: 'In Progress',
    updated: '2h ago'
  },
  {
    id: 'WO-2846',
    title: 'Equipment Install',
    location: 'Dallas, TX',
    technician: 'Sarah Kim',
    status: 'Scheduled',
    updated: '4h ago'
  },
  {
    id: 'WO-2845',
    title: 'Site Inspection',
    location: 'Houston, TX',
    technician: 'David Chen',
    status: 'Completed',
    updated: '1d ago'
  },
  {
    id: 'WO-2844',
    title: 'Electrical Repair',
    location: 'Phoenix, AZ',
    technician: 'Emily Rogers',
    status: 'In Progress',
    updated: '1d ago'
  },
  {
    id: 'WO-2843',
    title: 'Preventive Maintenance',
    location: 'Denver, CO',
    technician: 'James Park',
    status: 'Scheduled',
    updated: '2d ago'
  }
];

export function filterPlatformOrders(query: string, status = 'All') {
  const search = query.trim().toLowerCase();
  return platformOrders.filter(
    (order) =>
      (status === 'All' || order.status === status) &&
      `${order.id} ${order.title} ${order.location} ${order.technician}`
        .toLowerCase()
        .includes(search)
  );
}
