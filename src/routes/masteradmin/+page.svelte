<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let loading = $state(true);
	let stats = $state({ users: 0, books: 0, transactions: 0 });

	onMount(async () => {
		const token = localStorage.getItem('admin_token');

		if (!token) {
			goto('/masteradmin/login');
			return;
		}

		// Verify token
		const verifyRes = await fetch('/masteradmin/api/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token })
		});

		if (!verifyRes.ok) {
			localStorage.removeItem('admin_token');
			goto('/masteradmin/login');
			return;
		}

		// Fetch stats
		const statsRes = await fetch('/masteradmin/api/stats', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token })
		});

		if (statsRes.ok) {
			stats = await statsRes.json();
		}

		loading = false;
	});

	const handleLogout = () => {
		localStorage.removeItem('admin_token');
		goto('/masteradmin/login');
	};
</script>

{#if loading}
<div class="w-full min-h-[100dvh] flex items-center justify-center bg-[#2c3e50]">
	<span class="text-white titillium-web-semibold">Memuat dashboard...</span>
</div>
{:else}
<div class="w-full min-h-[100dvh] bg-[#ecf0f1]">
	<!-- Header -->
	<div class="w-full py-4 px-6 bg-[#2c3e50] flex items-center justify-between">
		<h1 class="text-white titillium-web-bold text-lg">Cashy Admin</h1>
		<button
			on:click={handleLogout}
			class="text-sm text-white bg-[#e74c3c] px-4 py-2 rounded-lg cursor-pointer"
		>
			Keluar
		</button>
	</div>

	<!-- Stats Cards -->
	<div class="max-w-[800px] mx-auto p-6">
		<h2 class="text-xl titillium-web-semibold text-[#2c3e50] mb-6">Ringkasan Dashboard</h2>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Users -->
			<a href="/masteradmin/users" class="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#3498db] hover:shadow-md transition-shadow">
				<div class="text-sm text-gray-500 mb-1">Total Pengguna</div>
				<div class="text-3xl titillium-web-bold text-[#2c3e50]">{stats.users}</div>
			</a>

			<!-- Books -->
			<a href="/masteradmin/books" class="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#f1c40f] hover:shadow-md transition-shadow">
				<div class="text-sm text-gray-500 mb-1">Total Buku</div>
				<div class="text-3xl titillium-web-bold text-[#2c3e50]">{stats.books}</div>
			</a>

			<!-- Transactions -->
			<a href="/masteradmin/transactions" class="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#2ecc71] hover:shadow-md transition-shadow">
				<div class="text-sm text-gray-500 mb-1">Total Transaksi</div>
				<div class="text-3xl titillium-web-bold text-[#2c3e50]">{stats.transactions}</div>
			</a>
		</div>
	</div>
</div>
{/if}
