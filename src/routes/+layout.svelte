<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { initTheme } from '$lib/stores/theme';

	const { children } = $props();

	onMount(() => {
		initTheme();

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_OUT') {
				goto('/login');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

{@render children()}
