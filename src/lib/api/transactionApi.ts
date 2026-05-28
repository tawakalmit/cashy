import { supabase } from '$lib/supabase';
import type { Transaction } from '$lib/types/transactions';

interface TransactionsResult {
	data: Transaction[];
	balance: number;
}

export const getTransactions = async (bookId: string): Promise<TransactionsResult> => {
	const { data, error } = await supabase
		.from('transactions')
		.select('*')
		.eq('book_id', bookId)
		.order('type', { ascending: true })
		.order('created_at', { ascending: false });

	if (error) throw error;

	// Calculate balance
	let bookIn = 0;
	let bookOut = 0;

	data.forEach((item: any) => {
		if (item.type === 'in') bookIn += item.amount;
		if (item.type === 'out') bookOut += item.amount;
	});

	const balance = bookIn - bookOut;

	// Get creator names
	const creatorIds = [...new Set(data.map((item: any) => item.creator))];
	const { data: profiles } = await supabase
		.from('profiles')
		.select('id, name')
		.in('id', creatorIds);

	const profileMap = new Map(profiles?.map((p) => [p.id, p.name]) || []);

	const transactions: Transaction[] = data.map((item: any) => ({
		...item,
		creatorName: profileMap.get(item.creator) || 'Unknown'
	}));

	return { data: transactions, balance };
};

export const createTransaction = async (data: {
	book_id: number;
	amount: number;
	type: string;
	title: string;
	description?: string;
}): Promise<TransactionsResult> => {
	const user = await supabase.auth.getUser();
	if (!user.data.user) throw new Error('Not authenticated');

	const { error } = await supabase.from('transactions').insert({
		book_id: data.book_id,
		creator: user.data.user.id,
		amount: data.amount,
		type: data.type,
		title: data.title,
		description: data.description || null
	});

	if (error) throw error;

	return await getTransactions(data.book_id.toString());
};

export const deleteTransaction = async (data: {
	book_id: string;
	transactionId: number;
}): Promise<TransactionsResult> => {
	const { error } = await supabase.from('transactions').delete().eq('id', data.transactionId);

	if (error) throw error;

	return await getTransactions(data.book_id);
};

export const updateTransaction = async (data: {
	id: number;
	book_id: string;
	amount: number;
	type: string;
	title: string;
	description?: string;
}): Promise<TransactionsResult> => {
	const { error } = await supabase
		.from('transactions')
		.update({
			amount: data.amount,
			type: data.type,
			title: data.title,
			description: data.description || null
		})
		.eq('id', data.id);

	if (error) throw error;

	return await getTransactions(data.book_id);
};
