<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';

	onMount(async () => {
		// Supabase handles the OAuth callback automatically via URL hash
		const {
			data: { session },
			error
		} = await supabase.auth.getSession();

		if (session) {
			goto('/');
		} else {
			// Wait a moment for Supabase to process the callback
			setTimeout(async () => {
				const {
					data: { session: retrySession }
				} = await supabase.auth.getSession();
				if (retrySession) {
					goto('/');
				} else {
					alert('Login gagal');
					goto('/login');
				}
			}, 1000);
		}
	});
</script>

<div class="w-full h-[100dvh] flex items-center justify-center">
	<p class="text-white">Memproses login...</p>
</div>
