<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getTransactions } from '$lib/api/transactionApi';
	import { getBook } from '$lib/api/booksApi';
	import { supabase } from '$lib/supabase';

	let loading = $state(true);
	let book_id = $state<string>($page?.params?.book_id || '');
	let bookTitle = $state('');
	let totalIn = $state(0);
	let totalOut = $state(0);
	let totalPendingIn = $state(0);
	let totalPendingOut = $state(0);
	let sisa = $state(0);

	onMount(async () => {
		const { data: { session } } = await supabase.auth.getSession();
		if (!session) { goto('/login'); return; }

		try {
			const [transData, bookData] = await Promise.all([
				getTransactions(book_id),
				getBook(parseInt(book_id))
			]);

			bookTitle = bookData.title;

			transData.data.forEach((t) => {
				if (t.type === 'in') totalIn += t.amount;
				else if (t.type === 'out') totalOut += t.amount;
				else if (t.type === 'pending_in') totalPendingIn += t.amount;
				else if (t.type === 'pending_out') totalPendingOut += t.amount;
			});

			sisa = totalIn - totalOut;
		} catch (error) {
			console.error('Failed to load report:', error);
		} finally {
			loading = false;
		}
	});

	const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
</script>

<div class="w-full min-h-[100dvh] max-w-[431px] mx-auto bg-white relative">
	<div class="w-full h-fit py-4 px-5 bg-[#ecf0f1] flex items-center justify-between">
		<a href={`/book/${book_id}`}>
			<img src="/icons/back-btn-icon.svg" width="20" height="20" alt="kembali" />
		</a>
		<span class="text-black titillium-web-bold w-10/12 text-center">Laporan</span>
		<div style="width: 20px;"></div>
	</div>

	{#if loading}
	<div class="w-full h-[80dvh] flex items-center justify-center">
		<span class="text-gray-400 titillium-web-semibold">Memuat laporan...</span>
	</div>
	{:else}
	<div class="w-full px-5 py-8 flex flex-col mt-5" style="gap: 1rem;">
		<h2 class="titillium-web-bold text-lg text-[#2c3e50]">{bookTitle}</h2>

		<!-- Total Pemasukan -->
		<div class="w-full rounded-xl p-4 bg-[#2ecc71]/10 flex justify-between items-center">
			<span class="text-sm text-[#2c3e50] titillium-web-semibold">Total Pemasukan</span>
			<span class="text-sm titillium-web-bold text-[#2ecc71]">{fmt(totalIn)}</span>
		</div>

		<!-- Total Pengeluaran -->
		<div class="w-full rounded-xl p-4 bg-[#e74c3c]/10 flex justify-between items-center">
			<span class="text-sm text-[#2c3e50] titillium-web-semibold">Total Pengeluaran</span>
			<span class="text-sm titillium-web-bold text-[#e74c3c]">{fmt(totalOut)}</span>
		</div>

		<!-- Total Pending In -->
		<div class="w-full rounded-xl p-4 bg-[#1abc9c]/10 flex justify-between items-center">
			<span class="text-sm text-[#2c3e50] titillium-web-semibold">Pemasukan Tertunda</span>
			<span class="text-sm titillium-web-bold text-[#1abc9c]">{fmt(totalPendingIn)}</span>
		</div>

		<!-- Total Pending Out -->
		<div class="w-full rounded-xl p-4 bg-[#d35400]/10 flex justify-between items-center">
			<span class="text-sm text-[#2c3e50] titillium-web-semibold">Pengeluaran Tertunda</span>
			<span class="text-sm titillium-web-bold text-[#d35400]">{fmt(totalPendingOut)}</span>
		</div>

		<!-- Sisa Saldo -->
		<div class="w-full rounded-xl p-4 bg-[#2c3e50]/10 flex justify-between items-center mt-4">
			<span class="text-sm text-[#2c3e50] titillium-web-bold">Sisa Saldo</span>
			<span class="text-lg titillium-web-bold text-[#2c3e50]">{fmt(sisa)}</span>
		</div>
	</div>
	{/if}
</div>
