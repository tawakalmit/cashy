import { json } from '@sveltejs/kit';
import { ADMIN_USER, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const POST: RequestHandler = async ({ request }) => {
	const { token } = await request.json();

	if (!token) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const decoded = atob(token);
		const [user] = decoded.split(':');

		if (user !== ADMIN_USER) {
			return json({ message: 'Unauthorized' }, { status: 401 });
		}
	} catch {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	// Fetch stats using service role key (bypasses RLS)
	const { count: usersCount } = await supabaseAdmin
		.from('profiles')
		.select('*', { count: 'exact', head: true });

	const { count: booksCount } = await supabaseAdmin
		.from('books')
		.select('*', { count: 'exact', head: true });

	const { count: transactionsCount } = await supabaseAdmin
		.from('transactions')
		.select('*', { count: 'exact', head: true });

	return json({
		users: usersCount || 0,
		books: booksCount || 0,
		transactions: transactionsCount || 0
	});
};
