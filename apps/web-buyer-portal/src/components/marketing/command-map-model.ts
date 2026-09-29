export type MapView = { zoom: number; x: number; y: number };
export const initialMapView: MapView = { zoom: 0, x: 500, y: 300 };

export function mapViewport(view: MapView) {
  const zoom = Math.min(3, Math.max(0, view.zoom));
  const width = 1000 / (1 + zoom * 0.45);
  const height = width * 0.6;
  const x = Math.min(1000 - width / 2, Math.max(width / 2, view.x));
  const y = Math.min(600 - height / 2, Math.max(height / 2, view.y));
  return { x: x - width / 2, y: y - height / 2, width, height };
}

export function changeMapView(view: MapView, zoomDelta = 0, dx = 0, dy = 0): MapView {
  const next = {
    zoom: Math.min(3, Math.max(0, view.zoom + zoomDelta)),
    x: view.x + dx,
    y: view.y + dy
  };
  const bounds = mapViewport(next);
  return { zoom: next.zoom, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

export const demoTechnicians = [
  {
    name: 'Alex Morgan',
    initials: 'AM',
    status: 'On Site',
    location: '1200 Market St, NY',
    x: 475,
    y: 280,
    tone: 'text-marketing-check'
  },
  {
    name: 'Priya Shah',
    initials: 'PS',
    status: 'In Transit',
    location: 'Midtown, NY',
    x: 400,
    y: 142,
    tone: 'text-status-info'
  },
  {
    name: 'Daniel Lee',
    initials: 'DL',
    status: 'Available',
    location: 'Upper East Side, NY',
    x: 800,
    y: 172,
    tone: 'text-marketing-check'
  },
  {
    name: 'Jordan Kim',
    initials: 'JK',
    status: 'Available',
    location: 'Jersey City, NJ',
    x: 285,
    y: 267,
    tone: 'text-marketing-check'
  },
  {
    name: 'Sam Rivera',
    initials: 'SR',
    status: 'Offline',
    location: 'Downtown, NY',
    x: 355,
    y: 413,
    tone: 'text-status-danger'
  },
  {
    name: 'Taylor Chen',
    initials: 'TC',
    status: 'In Transit',
    location: 'Brooklyn, NY',
    x: 605,
    y: 345,
    tone: 'text-status-info'
  },
  {
    name: 'Chris Patel',
    initials: 'CP',
    status: 'At Site',
    location: 'Queens, NY',
    x: 850,
    y: 330,
    tone: 'text-status-warning'
  },
  {
    name: 'Jamie Brooks',
    initials: 'JB',
    status: 'At Site',
    location: 'Williamsburg, NY',
    x: 765,
    y: 447,
    tone: 'text-status-warning'
  },
  {
    name: 'Morgan Reed',
    initials: 'MR',
    status: 'Available',
    location: 'Lower Manhattan, NY',
    x: 530,
    y: 485,
    tone: 'text-marketing-check'
  }
] as const;
