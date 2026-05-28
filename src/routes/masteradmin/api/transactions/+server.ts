import { json } from '@sveltejs/kit';
import { ADMIN_USER, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const POST: RequestHandler = async ({ request }) => {
	const { token } = await request.json();

	if (!token) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		const decoded = atob(token);
		const [user] = decoded.split(':');
		if (user !== ADMIN_USER) return json({ message: 'Unauthorized' }, { status: 401 });
	} catch {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	const { data, error } = await supabaseAdmin
		.from('transactions')
		.select('*, profiles(name, email), books(title)')
		.order('created_at', { ascending: false });

	if (error) return json({ message: error.message }, { status: 500 });

	return json({ data });
};
