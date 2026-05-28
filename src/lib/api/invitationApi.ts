import { supabase } from '$lib/supabase';

export interface Invitation {
	id: number;
	creator: string;
	user_email: string;
	book_id: number;
	role: string;
	status: string;
	created_at: string;
	creatorName: string;
	bookTitle: string;
}

export const getInvitations = async (): Promise<Invitation[]> => {
	const user = await supabase.auth.getUser();
	if (!user.data.user) throw new Error('Not authenticated');

	const { data, error } = await supabase
		.from('invitations')
		.select('*, books(title), profiles(name)')
		.eq('user_email', user.data.user.email)
		.eq('status', 'pending');

	if (error) throw error;

	return data.map((item: any) => ({
		...item,
		creatorName: item.profiles?.name || 'Tanpa nama',
		bookTitle: item.books?.title || 'Tanpa judul'
	}));
};

export const acceptInvitation = async (invitationId: number): Promise<void> => {
	const user = await supabase.auth.getUser();
	if (!user.data.user) throw new Error('Not authenticated');

	// Get the invitation
	const { data: invitation, error: invError } = await supabase
		.from('invitations')
		.select('*')
		.eq('id', invitationId)
		.single();

	if (invError) throw invError;

	// Validate that this invitation is for the current user
	if (invitation.user_email !== user.data.user.email) {
		throw new Error('Not authorized to accept this invitation');
	}

	// Update invitation status
	const { error: updateInvError } = await supabase
		.from('invitations')
		.update({ status: 'active' })
		.eq('id', invitationId);

	if (updateInvError) throw updateInvError;

	// Update book members - set status to active
	const { data: book, error: bookError } = await supabase
		.from('books')
		.select('members')
		.eq('id', invitation.book_id)
		.single();

	if (bookError) throw bookError;

	const members = typeof book.members === 'string' ? JSON.parse(book.members) : book.members || [];
	const updatedMembers = members.map((member: any) => {
		if (member.email === user.data.user!.email) {
			return { ...member, status: 'active' };
		}
		return member;
	});

	const { error: updateBookError } = await supabase
		.from('books')
		.update({ members: updatedMembers })
		.eq('id', invitation.book_id);

	if (updateBookError) throw updateBookError;
};
