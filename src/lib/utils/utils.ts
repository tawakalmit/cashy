import { goto } from '$app/navigation';
import { supabase } from '$lib/supabase';

/**
 * Get current authenticated user from Supabase
 */
export const getUser = async () => {
	const {
		data: { session }
	} = await supabase.auth.getSession();

	if (!session) return null;

	const { data: profile } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', session.user.id)
		.single();

	return {
		id: session.user.id,
		email: session.user.email,
		name: profile?.name || session.user.user_metadata?.full_name || '',
		avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url || ''
	};
};

/**
 * Logout user
 */
export const logout = async () => {
	await supabase.auth.signOut();
	goto('/login');
};
