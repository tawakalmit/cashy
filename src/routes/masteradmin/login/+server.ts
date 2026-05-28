import { json } from '@sveltejs/kit';
import { ADMIN_USER, ADMIN_PASSWORD } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { username, password } = await request.json();

	if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
		// Simple token: base64 encode credentials with a timestamp
		const token = btoa(`${ADMIN_USER}:${Date.now()}`);
		return json({ token });
	}

	return json({ message: 'Username atau password salah' }, { status: 401 });
};
