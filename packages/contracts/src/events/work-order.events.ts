export interface WorkOrderPublishedEvent {
  eventId: string;
  workOrderId: string;
  buyerId: string;
  title: string;
  maxBudget: number;
  latitude: number;
  longitude: number;
  publishedAt: string;
}

export interface WorkOrderAssignedEvent {
  eventId: string;
  workOrderId: string;
  techId: string;
  agreedRate: number;
  assignedAt: string;
}

export interface WorkOrderApprovedEvent {
  eventId: string;
  workOrderId: string;
  buyerId: string;
  techId: string;
  payoutAmount: number;
  approvedAt: string;
}
