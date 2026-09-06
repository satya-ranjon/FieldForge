import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  WorkOrderResponseDto,
  CreateWorkOrderDto,
  NearbyTechnicianDto,
  BidDetailsDto,
  EscrowDetailsDto,
  WorkOrderStatus
} from '@fieldforge/contracts';
import { setToken, logout } from '../slices/authSlice';

interface RootStateWithAuth {
  auth: {
    token: string | null;
    refreshToken: string | null;
  };
}

class SimpleMutex {
  private _locked = false;
  private _waiting: (() => void)[] = [];

  async acquire(): Promise<() => void> {
    if (!this._locked) {
      this._locked = true;
      return () => this.release();
    }
    return new Promise((resolve) => {
      this._waiting.push(() => {
        this._locked = true;
        resolve(() => this.release());
      });
    });
  }

  isLocked(): boolean {
    return this._locked;
  }

  waitForUnlock(): Promise<void> {
    if (!this._locked) return Promise.resolve();
    return new Promise((resolve) => {
      this._waiting.push(() => {
        resolve();
      });
    });
  }

  private release() {
    const next = this._waiting.shift();
    if (next) {
      next();
    } else {
      this._locked = false;
    }
  }
}

const mutex = new SimpleMutex();

const rawBaseQuery = fetchBaseQuery({
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
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  await mutex.waitForUnlock();
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const state = api.getState() as RootStateWithAuth;
        const refreshToken =
          state?.auth?.refreshToken ||
          (typeof window !== 'undefined' ? localStorage.getItem('ff_refresh_token') : null);

        if (refreshToken) {
          const refreshResult = await rawBaseQuery(
            {
              url: '/auth/refresh',
              method: 'POST',
              body: { refreshToken }
            },
            api,
            extraOptions
          );

          if (refreshResult.data) {
            const data = refreshResult.data as { accessToken: string; refreshToken?: string };
            api.dispatch(setToken(data));
            result = await rawBaseQuery(args, api, extraOptions);
          } else {
            api.dispatch(logout());
          }
        } else {
          api.dispatch(logout());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const fieldForgeApi = createApi({
  reducerPath: 'fieldForgeApi',
  baseQuery: baseQueryWithReauth,
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

    getWorkOrderHistory: builder.query<
      Array<{
        id: string;
        workOrderId: string;
        fromStatus: string;
        toStatus: string;
        changedAt: string;
        reason?: string;
      }>,
      string
    >({
      query: (id) => `/work-orders/${id}/history`,
      providesTags: (_result, _err, id) => [{ type: 'WorkOrder', id: `${id}-HISTORY` }]
    }),

    getWorkOrderDeliverables: builder.query<
      Array<{
        id: string;
        workOrderId: string;
        type: string;
        title: string;
        status: string;
        signatureHash?: string;
        url?: string;
      }>,
      string
    >({
      query: (id) => `/work-orders/${id}/deliverables`,
      providesTags: (_result, _err, id) => [{ type: 'WorkOrder', id: `${id}-DELIVERABLES` }]
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

    transitionWorkOrder: builder.mutation<
      WorkOrderResponseDto,
      { id: string; status: WorkOrderStatus | string; notes?: string }
    >({
      query: ({ id, status, notes }) => ({
        url: `/work-orders/${id}/transition`,
        method: 'POST',
        body: { status, notes }
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

    autoRoute: builder.mutation<
      { workOrderId: string; assignedTechId: string; status: string },
      { workOrderId: string; maxRadiusMiles?: number }
    >({
      query: (body) => ({
        url: '/dispatch/auto-route',
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _err, { workOrderId }) => [
        { type: 'WorkOrder', id: workOrderId },
        { type: 'WorkOrder', id: 'LIST' },
        { type: 'Bid', id: 'LIST' }
      ]
    }),

    preAuthEscrow: builder.mutation<EscrowDetailsDto, { workOrderId: string; amountMinor: number }>(
      {
        query: (body) => ({
          url: '/billing/escrow/preauth',
          method: 'POST',
          body
        }),
        invalidatesTags: (_result, _err, { workOrderId }) => [
          { type: 'Escrow', id: workOrderId },
          { type: 'WorkOrder', id: workOrderId }
        ]
      }
    ),

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
    }),

    getInvoice: builder.query<
      {
        id: string;
        invoiceNumber: string;
        workOrderId: string;
        amountMinor: number;
        contentHash: string;
        createdAt: string;
      },
      string
    >({
      query: (id) => `/billing/invoices/${id}`
    })
  })
});

export const {
  useGetWorkOrdersQuery,
  useGetWorkOrderByIdQuery,
  useGetWorkOrderHistoryQuery,
  useGetWorkOrderDeliverablesQuery,
  useCreateWorkOrderMutation,
  usePublishWorkOrderMutation,
  useTransitionWorkOrderMutation,
  useGetNearbyTechniciansQuery,
  useAcceptBidMutation,
  useAutoRouteMutation,
  usePreAuthEscrowMutation,
  useGetEscrowByWorkOrderQuery,
  useReleaseEscrowMutation,
  useGetInvoiceQuery
} = fieldForgeApi;
