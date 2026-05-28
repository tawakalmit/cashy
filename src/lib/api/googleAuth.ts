import { supabase } from '$lib/supabase';

export async function signInWithGoogle() {
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: `${window.location.origin}/auth/success`
		}
	});

	if (error) {
		console.error('Google sign-in error:', error.message);
		throw error;
	}

	return data;
}
