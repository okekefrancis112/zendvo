export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}

export type ApiResponse<T> = {
  data: T;
  message?: string;
  error?: string;
};
