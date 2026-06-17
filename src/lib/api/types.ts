export type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  kycStatus?: string;
  type?: string;
  priority?: string;
  from?: string;
  to?: string;
  assignedToMe?: boolean;
  unassigned?: boolean;
};
