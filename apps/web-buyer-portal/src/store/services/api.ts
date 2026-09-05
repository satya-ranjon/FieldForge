import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  WorkOrderResponseDto,
  CreateWorkOrderDto,
  NearbyTechnicianDto,
  BidDetailsDto,
  EscrowDetailsDto
} from '@fieldforge/contracts';

interface RootStateWithAuth {
  auth: {
    token: string | null;
  };
}

export const fieldForgeApi = createApi({
  reducerPath: 'fieldForgeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootStateWithAuth;
      const token = state?.auth?.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (!headers.has('x-correlation-id')) {
        headers.set(
          'x-correlation-id',
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `client-${Date.now()}`
        );
      }
      return headers;
    }
  }),
  tagTypes: ['WorkOrder', 'Bid', 'Escrow', 'Technician'],
  endpoints: (builder) => ({
    getWorkOrders: builder.query<
      WorkOrderResponseDto[],
      { status?: string; buyerId?: string; limit?: number; offset?: number } | void
    >({
      query: (params) => ({
        url: '/work-orders',
        params: params || undefined
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'WorkOrder' as const, id })),
              { type: 'WorkOrder', id: 'LIST' }
            ]
          : [{ type: 'WorkOrder', id: 'LIST' }]
    }),

    getWorkOrderById: builder.query<WorkOrderResponseDto, string>({
      query: (id) => `/work-orders/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'WorkOrder', id }]
    }),

    createWorkOrder: builder.mutation<WorkOrderResponseDto, CreateWorkOrderDto>({
      query: (body) => ({
        url: '/work-orders',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'WorkOrder', id: 'LIST' }]
    }),

    publishWorkOrder: builder.mutation<WorkOrderResponseDto, { id: string }>({
      query: ({ id }) => ({
        url: `/work-orders/${id}/publish`,
        method: 'POST'
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'WorkOrder', id },
        { type: 'WorkOrder', id: 'LIST' }
      ]
    }),

    getNearbyTechnicians: builder.query<
      NearbyTechnicianDto[],
      { latitude: number; longitude: number; radiusMiles?: number }
    >({
      query: ({ latitude, longitude, radiusMiles }) => ({
        url: '/dispatch/technicians/nearby',
        params: { latitude, longitude, radiusMiles }
      }),
      providesTags: ['Technician']
    }),

    acceptBid: builder.mutation<BidDetailsDto, { bidId: string; workOrderId: string }>({
      query: ({ bidId }) => ({
        url: `/dispatch/bids/${bidId}/accept`,
        method: 'POST'
      }),
      invalidatesTags: (_result, _err, { workOrderId }) => [
        { type: 'WorkOrder', id: workOrderId },
        { type: 'Bid', id: 'LIST' }
      ]
    }),

    getEscrowByWorkOrder: builder.query<EscrowDetailsDto, string>({
      query: (workOrderId) => `/billing/escrow/${workOrderId}`,
      providesTags: (_result, _err, workOrderId) => [{ type: 'Escrow', id: workOrderId }]
    }),

    releaseEscrow: builder.mutation<
      { workOrderId: string; status: string },
      { workOrderId: string }
    >({
      query: ({ workOrderId }) => ({
        url: `/billing/escrow/${workOrderId}/release`,
        method: 'POST'
      }),
      invalidatesTags: (_result, _err, { workOrderId }) => [
        { type: 'Escrow', id: workOrderId },
        { type: 'WorkOrder', id: workOrderId }
      ]
    })
  })
});

export const {
  useGetWorkOrdersQuery,
  useGetWorkOrderByIdQuery,
  useCreateWorkOrderMutation,
  usePublishWorkOrderMutation,
  useGetNearbyTechniciansQuery,
  useAcceptBidMutation,
  useGetEscrowByWorkOrderQuery,
  useReleaseEscrowMutation
} = fieldForgeApi;
