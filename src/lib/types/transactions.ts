export type TransactionType = 
  | "in" 
  | "out" 
  | "pending_in" 
  | "pending_out";

export interface Transaction {
  id: number;
  book_id: number;
  creator: number;
  amount: number;
  type: TransactionType;
  title: string;
  description: string | null;
  created_at: string; // ISO date string
  creatorName: string; // Added creatorName to Transaction interface
}

export interface TransactionsResponse {
  data: Transaction[];
}