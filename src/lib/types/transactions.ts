export type TransactionType = 'in' | 'out' | 'pending_in' | 'pending_out';

export interface Transaction {
	id: number;
	book_id: number;
	creator: string; // UUID from Supabase Auth
	amount: number;
	type: TransactionType;
	title: string;
	description: string | null;
	created_at: string; // ISO date string
	creatorName: string;
}
