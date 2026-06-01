import { supabase } from '$lib/supabase';
import type { Book, Member } from '$lib/types/book';

export interface UserSuggestion {
	id: string;
	email: string;
	name: string;
}

export const searchUsers = async (query: string): Promise<UserSuggestion[]> => {
	if (!query || query.length < 2) return [];

	const { data, error } = await supabase
		.from('profiles')
		.select('id, email, name')
		.ilike('email', `%${query}%`)
		.limit(5);

	if (error) return [];
	return data as UserSuggestion[];
};

export const getBooks = async (): Promise<Book[]> => {
	const user = await supabase.auth.getUser();
	if (!user.data.user) throw new Error('Not authenticated');

	const { data, error } = await supabase
		.from('books')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) throw error;

	return data as Book[];
};

export const getBook = async (bookId: number): Promise<Book> => {
	const { data, error } = await supabase.from('books').select('*').eq('id', bookId).single();

	if (error) throw error;

	return data as Book;
};

export const createABook = async (payload: {
	title: string;
	members: Member[];
}): Promise<Book[]> => {
	const user = await supabase.auth.getUser();
	if (!user.data.user) throw new Error('Not authenticated');

	// Create the book
	const { data: newBook, error: createError } = await supabase
		.from('books')
		.insert({
			user_id: user.data.user.id,
			title: payload.title,
			members: payload.members
		})
		.select()
		.single();

	if (createError) throw createError;

	// Create invitations for members
	if (payload.members && payload.members.length > 0) {
		const invitations = payload.members.map((member) => ({
			creator: user.data.user!.id,
			user_email: member.email,
			book_id: newBook.id,
			role: member.role,
			status: 'pending'
		}));

		await supabase.from('invitations').insert(invitations);
	}

	// Return updated books list
	return await getBooks();
};

export const deleteBook = async (bookId: number): Promise<Book[]> => {
	const { error } = await supabase.from('books').delete().eq('id', bookId);

	if (error) throw error;

	// Also delete related invitations
	await supabase.from('invitations').delete().eq('book_id', bookId);

	// Return updated books list
	return await getBooks();
};

export const updateBook = async (
	bookId: number,
	payload: { title: string; members: Member[] }
): Promise<Book> => {
	const user = await supabase.auth.getUser();
	if (!user.data.user) throw new Error('Not authenticated');

	const { data, error } = await supabase
		.from('books')
		.update({
			title: payload.title,
			members: payload.members
		})
		.eq('id', bookId)
		.select()
		.single();

	if (error) throw error;

	// Handle invitations for new members
	// Get existing invitations for this book
	const { data: existingInvitations } = await supabase
		.from('invitations')
		.select('user_email')
		.eq('book_id', bookId);

	const existingEmails = new Set(existingInvitations?.map((inv) => inv.user_email) || []);

	// Create invitations for new members that don't have one yet
	const newInvitations = payload.members
		.filter((member) => !existingEmails.has(member.email) && member.status === 'pending')
		.map((member) => ({
			creator: user.data.user!.id,
			user_email: member.email,
			book_id: bookId,
			role: member.role,
			status: 'pending'
		}));

	if (newInvitations.length > 0) {
		await supabase.from('invitations').insert(newInvitations);
	}

	return data as Book;
};

export const leaveBook = async (bookId: number): Promise<void> => {
	const user = await supabase.auth.getUser();
	if (!user.data.user) throw new Error('Not authenticated');

	const userEmail = user.data.user.email;

	// Remove current user from book members using RPC (bypasses RLS)
	const { error: updateError } = await supabase.rpc('leave_book', {
		p_book_id: bookId,
		p_user_email: userEmail
	});

	if (updateError) throw updateError;

	// Delete the invitation record
	await supabase
		.from('invitations')
		.delete()
		.eq('book_id', bookId)
		.eq('user_email', userEmail);
};
