<script lang="ts">
	import { getTransactions, createTransaction, deleteTransaction, updateTransaction } from '$lib/api/transactionApi';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getBook, updateBook, deleteBook, searchUsers, leaveBook } from '$lib/api/booksApi';
	import { supabase } from '$lib/supabase';
	import type { Transaction } from '$lib/types/transactions';
	import type { Member } from '$lib/types/book';
	import type { UserSuggestion } from '$lib/api/booksApi';
	import Swal from 'sweetalert2';

	let loading = $state(true);
	let transactions = $state<Transaction[]>([]);
	let book_id = $state<string>($page?.params?.book_id || '');
	let balance = $state<number>(0);
	let bookTitle = $state<string>('');
	let bookMembers = $state<Member[]>([]);
	let isOwner = $state<boolean>(true);

	let kebabMenuOpen = $state(false);
	let editModalIsOpen = $state(false);
	let editTitle = $state('');
	let editMembers = $state<Member[]>([]);
	let suggestions = $state<UserSuggestion[]>([]);
	let activeSuggestionIndex = $state<number | null>(null);

	let createTransactionModalIsOpen = $state<boolean>(false);
	let editTransactionModalIsOpen = $state<boolean>(false);
	let editTransactionId = $state<number>(0);
	let transactionTitle = $state<string>('');
	let transactionDescription = $state<string>('');
	let transactionAmount = $state<string>('');
	let transactionType = $state<string>('');

	onMount(async () => {
		const { data: { session } } = await supabase.auth.getSession();
		if (!session) {
			goto('/login');
			return;
		}

		try {
			const [getTransactionsData, getBookData] = await Promise.all([
				getTransactions(book_id),
				getBook(parseInt(book_id))
			]);

			bookTitle = getBookData.title;
			bookMembers = Array.isArray(getBookData.members) ? getBookData.members : [];
			transactions = getTransactionsData.data;
			balance = getTransactionsData.balance;
			isOwner = getBookData.user_id === session.user.id;
		} catch (error) {
			console.error('Failed to load book data:', error);
		} finally {
			loading = false;
		}
	});

	const openEditModal = () => {
		editTitle = bookTitle;
		editMembers = [...bookMembers.map((m) => ({ ...m }))];
		editModalIsOpen = true;
		kebabMenuOpen = false;
	};

	const addMemberField = () => {
		editMembers = [...editMembers, { email: '', role: 'editor', status: 'pending' }];
	};

	const removeMember = (index: number) => {
		editMembers = editMembers.filter((_, i) => i !== index);
	};

	const handleMemberInput = async (index: number) => {
		const query = editMembers[index].email;
		activeSuggestionIndex = index;
		if (query.length >= 2) {
			suggestions = await searchUsers(query);
		} else {
			suggestions = [];
		}
	};

	const selectSuggestion = (index: number, user: UserSuggestion) => {
		editMembers[index].email = user.email;
		suggestions = [];
		activeSuggestionIndex = null;
	};

	const saveEdit = async () => {
		try {
			const updated = await updateBook(parseInt(book_id), {
				title: editTitle,
				members: editMembers.filter((m) => m.email.trim() !== '')
			});
			bookTitle = updated.title;
			bookMembers = Array.isArray(updated.members) ? updated.members : [];
			editModalIsOpen = false;
			Swal.fire({ title: 'Berhasil', text: 'Buku berhasil diperbarui', icon: 'success' });
		} catch (error) {
			console.error(error);
			Swal.fire('Gagal!', 'Terjadi kesalahan saat memperbarui buku.', 'error');
		}
	};

	const handleDeleteBook = () => {
		kebabMenuOpen = false;
		Swal.fire({
			title: 'Apakah kamu yakin?',
			text: 'Buku dan semua transaksi di dalamnya akan dihapus!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Ya, hapus!',
			cancelButtonText: 'Batal'
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await deleteBook(parseInt(book_id));
					Swal.fire('Terhapus!', 'Buku berhasil dihapus.', 'success');
					goto('/');
				} catch (error) {
					Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus buku.', 'error');
				}
			}
		});
	};

	const handleLeaveBook = () => {
		kebabMenuOpen = false;
		Swal.fire({
			title: 'Keluar dari buku?',
			text: 'Kamu tidak akan bisa melihat transaksi di buku ini lagi.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Ya, keluar!',
			cancelButtonText: 'Batal'
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await leaveBook(parseInt(book_id));
					Swal.fire('Berhasil!', 'Kamu telah keluar dari buku ini.', 'success');
					goto('/');
				} catch (error) {
					console.error(error);
					Swal.fire('Gagal!', 'Terjadi kesalahan saat keluar dari buku.', 'error');
				}
			}
		});
	};

	const formatTanggalIndo = (dateString: string) => {
		const date = new Date(dateString);

		const bulan = [
			'januari',
			'februari',
			'maret',
			'april',
			'mei',
			'juni',
			'juli',
			'agustus',
			'september',
			'oktober',
			'november',
			'desember'
		];

		const hari = date.getDate();
		const namaBulan = bulan[date.getMonth()];
		const tahun = date.getFullYear();

		const jam = date.getHours().toString().padStart(2, '0');
		const menit = date.getMinutes().toString().padStart(2, '0');

		return `${hari} ${namaBulan} ${tahun}, ${jam}:${menit}`;
	};

	const moreDetails = (e: any) => {
		e.currentTarget.children[1].classList.toggle('hidden');
	};

	const deleteTransItem = (transactionId: number) => {
		Swal.fire({
			title: 'Apakah Anda yakin?',
			text: 'Transaksi yang sudah dihapus tidak bisa dikembalikan!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Ya, hapus!',
			cancelButtonText: 'Batal'
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					const deleteTrans = await deleteTransaction({ book_id, transactionId });
					transactions = deleteTrans.data;
					balance = deleteTrans.balance;
					Swal.fire('Terhapus!', 'Transaksi berhasil dihapus.', 'success');
				} catch (error) {
					console.error(error);
					Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus transaksi.', 'error');
				}
			}
		});
	};

	const createATransaction = async () => {
		let dataToSend = {
			title: transactionTitle,
			description: transactionDescription,
			amount: parseInt(transactionAmount),
			type: transactionType,
			book_id: parseInt(book_id)
		};

		try {
			const buatTransaksi = await createTransaction(dataToSend);
			transactions = buatTransaksi.data;
			balance = buatTransaksi.balance;
			createTransactionModalIsOpen = false;

			transactionTitle = '';
			transactionDescription = '';
			transactionAmount = '';
			transactionType = '';

			Swal.fire({
				title: 'Berhasil',
				text: 'Transaksi berhasil dibuat',
				icon: 'success'
			});
		} catch (error) {
			console.error(error);
		}
	};

	const openEditTransaction = (transaction: Transaction) => {
		editTransactionId = transaction.id;
		transactionTitle = transaction.title;
		transactionDescription = transaction.description || '';
		transactionAmount = transaction.amount.toString();
		transactionType = transaction.type;
		editTransactionModalIsOpen = true;
	};

	const saveEditTransaction = async () => {
		try {
			const result = await updateTransaction({
				id: editTransactionId,
				book_id: book_id,
				amount: parseInt(transactionAmount),
				type: transactionType,
				title: transactionTitle,
				description: transactionDescription
			});
			transactions = result.data;
			balance = result.balance;
			editTransactionModalIsOpen = false;

			transactionTitle = '';
			transactionDescription = '';
			transactionAmount = '';
			transactionType = '';

			Swal.fire({
				title: 'Berhasil',
				text: 'Transaksi berhasil diperbarui',
				icon: 'success'
			});
		} catch (error) {
			console.error(error);
			Swal.fire('Gagal!', 'Terjadi kesalahan saat memperbarui transaksi.', 'error');
		}
	};
</script>

<div class="w-full min-h-[100dvh] max-w-[431px] mx-auto bg-white relative">
	<div class="w-full h-fit py-4 px-5 bg-[#ecf0f1] flex items-center justify-between">
		<a href="/">
			<img src="/icons/back-btn-icon.svg" width="20" height="20" alt="back" />
		</a>

		<span class="text-black titillium-web-bold w-10/12 text-center">
			{bookTitle}
		</span>

		<div class="cursor-pointer relative w-fit h-fit">
			<button on:click={() => (kebabMenuOpen = !kebabMenuOpen)} class="cursor-pointer">
				<img src="/icons/option.svg" width="20" height="20" alt="opsi" />
			</button>

			{#if kebabMenuOpen}
				<div
					class="fixed inset-0 z-[199]"
					on:click={() => (kebabMenuOpen = false)}
					on:keydown={() => {}}
					role="button"
					tabindex="-1"
				></div>
				<div class="absolute right-0 top-8 z-[200] w-36 shadow-md flex flex-col gap-3 bg-[#dddddd] rounded p-3 items-end">
					<a href={`/book/${book_id}/laporan`} class="text-xs text-black">Laporan</a>
					{#if isOwner}
						<button on:click={openEditModal} class="text-xs text-black">Edit Buku</button>
						<button on:click={handleDeleteBook} class="text-xs text-red-600">Hapus Buku</button>
					{:else}
						<button on:click={handleLeaveBook} class="text-xs text-red-600">Keluar dari Buku</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	{#if loading}
	<div class="w-full h-[75dvh] flex items-center justify-center">
		<span class="text-gray-400 titillium-web-semibold">Memuat transaksi...</span>
	</div>
	{:else}
	<!-- Kondisi data eksis -->
	<div class="w-full flex flex-col gap-3 px-5 py-10 h-[75dvh] overflow-y-auto">
		{#each transactions as transaction}
			<div
				on:click={(e) => moreDetails(e)}
				on:keydown={(e) => moreDetails(e)}
				role="button"
				tabindex="0"
			>
				<div
					class="w-full h-fit rounded-xl p-3 flex items-center justify-between relative z-50 select-none cursor-pointer {transaction.type ==
					'in'
						? 'bg-[#2ecc71]'
						: transaction.type == 'out'
							? 'bg-[#e74c3c]'
							: transaction.type == 'pending_in'
								? 'bg-[#1abc9c]'
								: transaction.type == 'pending_out'
									? 'bg-[#d35400]'
									: 'bg-gray-500'}"
				>
					<span class="w-8/12 text-sm text-white titillium-web-semibold line-clamp-1"
						>{transaction.title}</span
					>
					<span class="w-3/12 text-sm text-white titillium-web-semibold text-right"
						>{transaction.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</span
					>
				</div>
				<div
					class="w-full h-fit bg-[#ecf0f1] -mt-10 relative rounded-br-xl rounded-bl-xl pt-14 px-4 pb-4 flex flex-col gap-3 hidden"
				>
					<div class="flex items-center gap-3 text-xs">
						<span class="w-14">Judul</span>
						<span>{transaction.title}</span>
					</div>
					<div class="flex items-center gap-3 text-xs">
						<span class="w-14">Deskripsi</span>
						<span>{transaction.description ? transaction.description : '-'}</span>
					</div>
					<div class="flex items-center gap-3 text-xs">
						<span class="w-14">Tipe</span>
						<span
							>{transaction.type == 'in'
								? 'Pemasukan'
								: transaction.type == 'out'
									? 'Pengeluaran'
									: transaction.type == 'pending_in'
										? 'Pemasukan tertunda'
										: 'Pengeluaran tertunda'}</span
						>
					</div>
					<div class="flex items-center gap-3 text-xs">
						<span class="w-14">Nilai</span>
						<span
							>{transaction.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</span
						>
					</div>
					<div class="flex items-center gap-3 text-xs">
						<span class="w-14">Tanggal</span>
						<span>{formatTanggalIndo(transaction.created_at)}</span>
					</div>
					<div class="flex items-center gap-3 text-xs">
						<span class="w-14">Kreator</span>
						<span>{transaction.creatorName}</span>
					</div>
					<div class="w-full flex justify-end gap-3">
						<button class="w-fit" on:click|stopPropagation={() => openEditTransaction(transaction)}
							><img class="w-5" src="/icons/edit.svg" alt="Edit" /></button
						>
						<button class="w-fit" on:click|stopPropagation={() => deleteTransItem(transaction.id)}
							><img class="w-5" src="/icons/delete.svg" alt="Hapus" /></button
						>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if createTransactionModalIsOpen}
		<form class="w-full h-[100dvh] max-w-[431px] mx-auto bg-white fixed top-0 z-[100]">
			<div
				class="w-full h-[4rem] bg-[#f1c40f] flex items-center justify-center px-5 relative text-white"
			>
				<button
					class="absolute left-5"
					on:click={() => (createTransactionModalIsOpen = false)}
					><img src="/icons/back-btn-icon.svg" width="30" height="30" alt="back" /></button
				>
				<span class="titillium-web-semibold text-xl">Buat Transaksi</span>
			</div>
			<div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
				<select bind:value={transactionType} class="rounded-full">
					<option value="" disabled selected>Tipe</option>
					<option value="in">Pemasukan</option>
					<option value="out">Pengeluaran</option>
					<option value="pending_in">Pemasukan Tertunda</option>
					<option value="pending_out">Pengeluaran Tertunda</option>
				</select>
			</div>
			<div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
				<label class="text-black titillium-web-semibold">Judul</label>
				<input
					bind:value={transactionTitle}
					type="text"
					placeholder="Masukkan Judul Transaksi"
					class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black"
				/>
			</div>
			<div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
				<label class="text-black titillium-web-semibold">Deskripsi</label>
				<input
					bind:value={transactionDescription}
					type="text"
					placeholder="Masukkan Deskripsi Transaksi"
					class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black"
				/>
			</div>
			<div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
				<label class="text-black titillium-web-semibold">Jumlah</label>
				<input
					bind:value={transactionAmount}
					type="text"
					placeholder="Masukkan Jumlah Transaksi"
					class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black"
				/>
			</div>

			<button
				on:click={createATransaction}
				class="text-center text-lg cursor-pointer select-none absolute bottom-0 w-full py-3 bg-[#f1c40f] text-white titillium-web-semibold"
				>Simpan</button
			>
		</form>
	{/if}

	{#if editTransactionModalIsOpen}
		<form class="w-full h-[100dvh] max-w-[431px] mx-auto bg-white fixed top-0 z-[100]">
			<div
				class="w-full h-[4rem] bg-[#f1c40f] flex items-center justify-center px-5 relative text-white"
			>
				<button
					class="absolute left-5"
					on:click={() => { editTransactionModalIsOpen = false; transactionTitle = ''; transactionDescription = ''; transactionAmount = ''; transactionType = ''; }}
					><img src="/icons/back-btn-icon.svg" width="30" height="30" alt="back" /></button
				>
				<span class="titillium-web-semibold text-xl">Edit Transaksi</span>
			</div>
			<div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
				<select bind:value={transactionType} class="rounded-full">
					<option value="" disabled>Tipe</option>
					<option value="in">Pemasukan</option>
					<option value="out">Pengeluaran</option>
					<option value="pending_in">Pemasukan Tertunda</option>
					<option value="pending_out">Pengeluaran Tertunda</option>
				</select>
			</div>
			<div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
				<label class="text-black titillium-web-semibold">Judul</label>
				<input
					bind:value={transactionTitle}
					type="text"
					placeholder="Masukkan Judul Transaksi"
					class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black"
				/>
			</div>
			<div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
				<label class="text-black titillium-web-semibold">Deskripsi</label>
				<input
					bind:value={transactionDescription}
					type="text"
					placeholder="Masukkan Deskripsi Transaksi"
					class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black"
				/>
			</div>
			<div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
				<label class="text-black titillium-web-semibold">Jumlah</label>
				<input
					bind:value={transactionAmount}
					type="text"
					placeholder="Masukkan Jumlah Transaksi"
					class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black"
				/>
			</div>

			<button
				on:click={saveEditTransaction}
				class="text-center text-lg cursor-pointer select-none absolute bottom-0 w-full py-3 bg-[#f1c40f] text-white titillium-web-semibold"
				>Simpan</button
			>
		</form>
	{/if}

	<div class="w-full h-fit py-4 px-5 flex items-center justify-between absolute bottom-14 left-0">
		<button
			on:click={() => (createTransactionModalIsOpen = true)}
			class="cursor-pointer flex items-center w-fit mx-auto bg-[#f1c40f] rounded-full px-5"
		>
			<img src="/icons/add-icon.svg" width="40" height="40" alt="add" />
			<span class="titillium-web-bold text-white">Tambah Transaksi</span>
		</button>
	</div>
	<div
		class="w-full h-fit py-4 px-5 bg-[#ecf0f1] flex items-center justify-between absolute bottom-0 left-0"
	>
		<span>Sisa Saldo</span>
		<span>{balance ? balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0'}</span>
	</div>

	{#if editModalIsOpen}
		<div class="w-full h-[100dvh] max-w-[431px] mx-auto bg-white fixed top-0 z-[150] overflow-y-auto">
			<div class="w-full h-[4rem] bg-[#f1c40f] flex items-center justify-center px-5 relative text-white">
				<button class="absolute left-5" on:click={() => (editModalIsOpen = false)}>
					<img src="/icons/back-btn-icon.svg" width="30" height="30" alt="kembali" />
				</button>
				<span class="titillium-web-semibold text-xl">Edit Buku</span>
			</div>
			<div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
				<label class="text-black titillium-web-semibold">Nama Buku</label>
				<input
					bind:value={editTitle}
					type="text"
					placeholder="Masukkan nama buku"
					class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black"
				/>
			</div>
			<div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
				<label class="text-black titillium-web-semibold">Anggota</label>
				{#each editMembers as member, index}
					<div class="w-full flex items-center gap-2 relative">
						<div class="flex-1 relative">
							<input
								type="text"
								autocomplete="off"
								placeholder="Email anggota"
								class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black w-full"
								bind:value={editMembers[index].email}
								on:input={() => handleMemberInput(index)}
								on:focus={() => handleMemberInput(index)}
								on:blur={() => setTimeout(() => { if (activeSuggestionIndex === index) { suggestions = []; activeSuggestionIndex = null; } }, 200)}
							/>
							{#if activeSuggestionIndex === index && suggestions.length > 0}
								<div class="absolute top-full left-0 w-full bg-white border border-[#ddd] rounded-lg mt-1 shadow-lg z-[300] max-h-40 overflow-y-auto">
									{#each suggestions as user}
										<button
											class="w-full text-left px-4 py-2 hover:bg-[#f1c40f]/10 text-sm text-black flex flex-col"
											on:mousedown|preventDefault={() => selectSuggestion(index, user)}
										>
											<span class="font-medium">{user.name || 'Tanpa nama'}</span>
											<span class="text-xs text-gray-500">{user.email}</span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
						<span class="text-xs text-gray-500 w-14 text-center">
							{member.status === 'active' ? 'Aktif' : 'Pending'}
						</span>
						<button on:click={() => removeMember(index)} class="w-6">
							<img src="/icons/remove-icon.svg" alt="hapus" />
						</button>
					</div>
				{/each}
			</div>
			<div class="w-full flex justify-center mt-5">
				<button on:click={addMemberField}>
					<img class="w-5" src="/icons/add-member.svg" alt="tambah anggota" />
				</button>
			</div>
			<div class="w-full px-6 mt-10 pb-20">
				<button
					on:click={saveEdit}
					class="text-center text-lg cursor-pointer select-none w-full py-3 bg-[#f1c40f] text-white titillium-web-semibold rounded-full"
				>Simpan</button>
			</div>
		</div>
	{/if}
	{/if}
</div>
