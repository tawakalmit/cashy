import { json } from '@sveltejs/kit';
import { ADMIN_USER } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { token } = await request.json();

	if (!token) {
		return json({ valid: false }, { status: 401 });
	}

	try {
		const decoded = atob(token);
		const [user] = decoded.split(':');

		if (user === ADMIN_USER) {
			return json({ valid: true });
		}
	} catch {
		// invalid token
	}

	return json({ valid: false }, { status: 401 });
};
