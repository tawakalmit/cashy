<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let loading = $state(true);
	let transactions = $state<any[]>([]);

	onMount(async () => {
		const token = localStorage.getItem('admin_token');
		if (!token) { goto('/masteradmin/login'); return; }

		const res = await fetch('/masteradmin/api/transactions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token })
		});

		if (!res.ok) { goto('/masteradmin/login'); return; }

		const data = await res.json();
		transactions = data.data;
		loading = false;
	});

	const formatType = (type: string) => {
		switch (type) {
			case 'in': return 'Pemasukan';
			case 'out': return 'Pengeluaran';
			case 'pending_in': return 'Pemasukan Tertunda';
			case 'pending_out': return 'Pengeluaran Tertunda';
			default: return type;
		}
	};
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
			<h1 class="text-white titillium-web-bold text-lg">Data Transaksi</h1>
		</div>
	</div>

	<div class="max-w-[1000px] mx-auto p-6">
		<div class="bg-white rounded-xl shadow-sm overflow-x-auto">
			<table class="w-full text-sm text-left">
				<thead class="bg-[#2c3e50] text-white">
					<tr>
						<th class="px-4 py-3">No</th>
						<th class="px-4 py-3">Judul</th>
						<th class="px-4 py-3">Tipe</th>
						<th class="px-4 py-3">Jumlah</th>
						<th class="px-4 py-3">Buku</th>
						<th class="px-4 py-3">Kreator</th>
						<th class="px-4 py-3">Tanggal</th>
					</tr>
				</thead>
				<tbody>
					{#each transactions as trx, i}
					<tr class="border-b border-gray-100 hover:bg-gray-50">
						<td class="px-4 py-3">{i + 1}</td>
						<td class="px-4 py-3">{trx.title || '-'}</td>
						<td class="px-4 py-3">
							<span class="px-2 py-1 rounded text-xs text-white {trx.type === 'in' ? 'bg-[#2ecc71]' : trx.type === 'out' ? 'bg-[#e74c3c]' : trx.type === 'pending_in' ? 'bg-[#1abc9c]' : 'bg-[#d35400]'}">
								{formatType(trx.type)}
							</span>
						</td>
						<td class="px-4 py-3">{trx.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</td>
						<td class="px-4 py-3">{trx.books?.title || '-'}</td>
						<td class="px-4 py-3">{trx.profiles?.name || trx.profiles?.email || '-'}</td>
						<td class="px-4 py-3">{new Date(trx.created_at).toLocaleDateString('id-ID')}</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
{/if}
