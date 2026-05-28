<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let loading = $state(true);
	let users = $state<any[]>([]);

	onMount(async () => {
		const token = localStorage.getItem('admin_token');
		if (!token) { goto('/masteradmin/login'); return; }

		const res = await fetch('/masteradmin/api/users', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token })
		});

		if (!res.ok) { goto('/masteradmin/login'); return; }

		const data = await res.json();
		users = data.data;
		loading = false;
	});
</script>

{#if loading}
<div class="w-full min-h-[100dvh] flex items-center justify-center bg-[#2c3e50]">
	<span class="text-white titillium-web-semibold">Memuat data...</span>
</div>
{:else}
<div class="w-full min-h-[100dvh] bg-[#ecf0f1]">
	<div class="w-full py-4 px-6 bg-[#2c3e50] flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/masteradmin" class="text-white text-sm">← Kembali</a>
			<h1 class="text-white titillium-web-bold text-lg">Data Pengguna</h1>
		</div>
	</div>

	<div class="max-w-[900px] mx-auto p-6">
		<div class="bg-white rounded-xl shadow-sm overflow-x-auto">
			<table class="w-full text-sm text-left">
				<thead class="bg-[#2c3e50] text-white">
					<tr>
						<th class="px-4 py-3">No</th>
						<th class="px-4 py-3">Nama</th>
						<th class="px-4 py-3">Email</th>
						<th class="px-4 py-3">Tanggal Daftar</th>
					</tr>
				</thead>
				<tbody>
					{#each users as user, i}
					<tr class="border-b border-gray-100 hover:bg-gray-50">
						<td class="px-4 py-3">{i + 1}</td>
						<td class="px-4 py-3">{user.name || '-'}</td>
						<td class="px-4 py-3">{user.email}</td>
						<td class="px-4 py-3">{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
{/if}
