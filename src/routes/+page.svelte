<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { getBooks, createABook, deleteBook, searchUsers } from '$lib/api/booksApi';
	import { logout } from '$lib/utils/utils';
	import type { Book } from '$lib/types/book';
	import type { UserSuggestion } from '$lib/api/booksApi';
	import { supabase } from '$lib/supabase';

	import Swal from 'sweetalert2';

	let optionIsOpen = $state(false);
	let createModalIsOpen = $state(false);
	let editMode = $state(false);
	let loading = $state(true);

	let books = $state<Book[]>([]);
	let members = $state<string[]>([]);
	let bookTitle = $state<string>('');
	let memberSuggestions = $state<UserSuggestion[]>([]);
	let activeMemberIndex = $state<number | null>(null);
	let currentUserId = $state<string>('');
	let invitationCount = $state<number>(0);
	let realtimeChannel: any = null;
	let deferredPrompt: any = $state(null);

	// Capture the beforeinstallprompt event
	if (typeof window !== 'undefined') {
		window.addEventListener('beforeinstallprompt', (e: any) => {
			e.preventDefault();
			deferredPrompt = e;
		});
	}

	const installApp = async () => {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === 'accepted') {
			deferredPrompt = null;
		}
	};

	onMount(async () => {
		const { data: { session } } = await supabase.auth.getSession();

		if (!session) {
			goto('/login');
			return;
		}

		currentUserId = session.user.id;
		const userEmail = session.user.email;

		try {
			const result = await getBooks();
			books = result;
		} catch (error) {
			console.error('Failed to get books:', error);
		} finally {
			loading = false;
		}

		// Fetch initial invitation count
		const { count } = await supabase
			.from('invitations')
			.select('*', { count: 'exact', head: true })
			.eq('user_email', userEmail)
			.eq('status', 'pending');

		invitationCount = count || 0;

		// Subscribe to realtime changes on invitations
		realtimeChannel = supabase
			.channel('invitations-realtime')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'invitations',
					filter: `user_email=eq.${userEmail}`
				},
				async () => {
					const { count: newCount } = await supabase
						.from('invitations')
						.select('*', { count: 'exact', head: true })
						.eq('user_email', userEmail)
						.eq('status', 'pending');
					invitationCount = newCount || 0;
				}
			)
			.subscribe();
	});

	onDestroy(() => {
		if (realtimeChannel) {
			supabase.removeChannel(realtimeChannel);
		}
	});

	const addMoreMemberField = () => {
		members = [...members, ''];
	};

	const removeMemberField = (index: number) => {
		members = members.filter((_, i) => i !== index);
	};

	const handleMemberInput = async (index: number) => {
		const query = members[index];
		activeMemberIndex = index;
		if (query && query.length >= 2) {
			memberSuggestions = await searchUsers(query);
		} else {
			memberSuggestions = [];
		}
	};

	const selectMemberSuggestion = (index: number, user: UserSuggestion) => {
		members[index] = user.email;
		memberSuggestions = [];
		activeMemberIndex = null;
	};

	const createBook = async () => {
		let bookData = {
			title: bookTitle,
			members: [] as any[]
		};
		if (members.length > 0) {
			members.forEach((item) => {
				let obj = {
					email: item,
					role: 'editor' as const,
					status: 'pending' as const
				};
				bookData.members.push(obj);
			});
		}

		try {
			const result = await createABook(bookData);
			books = result;

			bookTitle = '';
			members = [];
			createModalIsOpen = false;

			Toast.fire({
				icon: 'success',
				title: 'Buku berhasil dibuat'
			});
		} catch (error) {
			console.error('Failed to create book:', error);
		}
	};

	const Toast = Swal.mixin({
		toast: true,
		position: 'bottom',
		showConfirmButton: false,
		timer: 3000,
		timerProgressBar: true,
		didOpen: (toast) => {
			toast.onmouseenter = Swal.stopTimer;
			toast.onmouseleave = Swal.resumeTimer;
		}
	});

	const toogleEditMode = () => {
		editMode = !editMode;
		optionIsOpen = false;
	};

	const toggleEdit = () => {
		optionIsOpen = !optionIsOpen;
		editMode = false;
	};

	const removeBook = async (book_id: number) => {
		Swal.fire({
			title: 'Apakah kamu yakin?',
			text: 'Data yang sudah dihapus tidak bisa dikembalikan!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Ya, hapus!'
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					const result = await deleteBook(book_id);
					books = result;

					Toast.fire({
						icon: 'success',
						title: 'Buku berhasil dihapus'
					});
				} catch (error) {
					throw error;
				}
			}
		});
	};
</script>

<div class="w-full min-h-[100dvh] max-w-[431px] mx-auto bg-[#f1c40f] relative">

	{#if loading}
	<div class="w-full h-[100dvh] flex items-center justify-center">
		<span class="text-white titillium-web-semibold">Memuat...</span>
	</div>
	{:else}
	<!-- Header -->
	<div class="w-full h-fit py-4 px-5 bg-[#ecf0f1] flex items-center justify-between">
		<!-- Logo -->
		<div class="flex items-center gap-2">
			<div class="w-5">
				<img src="/cashflow-512.png" alt="img" class="w-full h-full" />
			</div>
			<div class="text-black titillium-web-bold">Cashy</div>
		</div>

		<!-- Dropdown -->
		<div class="relative w-fit h-fit flex items-center justify-center">
			{#if editMode}
				<button on:click={toogleEditMode} class="mr-5 cursor-pointer"
					><img src="/icons/check.svg" alt="check" /></button
				>
			{/if}

			<button on:click={toggleEdit} class="cursor-pointer relative">
				<img src="/icons/option.svg" width="20" height="20" alt="profile" />
				{#if invitationCount > 0}
					<span class="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">{invitationCount}</span>
				{/if}
			</button>

			{#if optionIsOpen}
				<div
					class="fixed inset-0 z-40"
					on:click={() => (optionIsOpen = false)}
					on:keydown={() => {}}
					role="button"
					tabindex="-1"
				></div>
				<div
					class="absolute right-0 top-8 z-50 w-32 shadow-md flex flex-col gap-3 bg-[#dddddd] rounded p-3 items-end"
				>
					<a href="/invitation" class="text-xs text-black relative">
						Undangan
						{#if invitationCount > 0}
							<span class="absolute -top-2 -right-4 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{invitationCount}</span>
						{/if}
					</a>
					<button on:click={toogleEditMode} class="text-xs text-black">Kelola Buku</button>
					<a href="/support" class="text-xs text-black">Support</a>
					{#if deferredPrompt}
						<button on:click={installApp} class="text-xs text-black">Install Aplikasi</button>
					{/if}
					<button on:click={logout} class="text-xs text-black">Keluar</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Content -->
	{#if books.length > 0}
		<div
			class="w-full h-[90dvh] flex flex-col gap-3 px-5 pb-5 py-10 overflow-y-auto scrollbar-hide"
		>
			{#each books as item}
				<div class="flex items-center justify-between">
					<a
						href={`/book/${item.id}`}
						class="rounded-xl bg-white text-black p-3 flex justify-between items-center relative overflow-hidden {editMode
							? 'w-11/12'
							: 'w-full'}"
					>
						<span>{item.title}</span>
						{#if item.user_id !== currentUserId}
							<span class="text-[10px] bg-[#3498db] text-white px-2 py-0.5 rounded-full">Anggota</span>
						{/if}
					</a>
					<button
						on:click|stopPropagation={() => removeBook(item.id)}
						class={editMode ? '' : 'hidden'}
						><img src="/icons/remove-item-icon.svg" alt="remove-item" /></button
					>
				</div>
			{/each}
		</div>
	{:else}
		<div class="w-full min-h-[90vh] flex items-center flex-col justify-center gap-5">
			<div class="flex items-start justify-center gap-3 w-9/12">
				<img
					src="/icons/transaction-history.svg"
					width="70"
					height="70"
					alt="transaction"
				/>
				<div class="text-white text-sm">
					Sepertinya Kamu belum pernah mencatat transaksi.
				</div>
			</div>

			<button
				class="px-10 py-3 bg-white text-black rounded-full text-sm"
				on:click={() => (createModalIsOpen = true)}
			>
				Buat Buku
			</button>
		</div>
	{/if}

	<!-- Floating Button -->
	<button
		class="w-10 h-10 shadow-xl bg-[#2c3e50] rounded-full fixed bottom-10 right-10 flex items-center justify-center"
		on:click={() => (createModalIsOpen = true)}
	>
		<img src="/icons/add-icon.svg" width="40" height="40" alt="add" />
	</button>

	{#if createModalIsOpen}
		<form class="w-full h-[100dvh] max-w-[431px] mx-auto bg-white fixed top-0">
			<div
				class="w-full h-[4rem] bg-[#f1c40f] flex items-center justify-center px-5 relative text-white"
			>
				<button class="absolute left-5" on:click={() => (createModalIsOpen = false)}
					><img src="/icons/back-btn-icon.svg" width="30" height="30" alt="back" /></button
				>
				<span class="titillium-web-semibold text-xl">Buat Buku</span>
			</div>
			<div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
				<label class="text-black titillium-web-semibold">Judul Buku</label>
				<input
					bind:value={bookTitle}
					type="text"
					placeholder="masukkan judul buku"
					class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black"
				/>
			</div>
			<div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
				<label class="text-black titillium-web-semibold">Undang Anggota</label>
				{#each members as member, index}
					<div class="w-full flex items-center justify-between relative">
						<div class="w-11/12 relative">
							<input
								type="text"
								autocomplete="off"
								placeholder="masukkan email anggota"
								class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black w-full"
								bind:value={members[index]}
								on:input={() => handleMemberInput(index)}
								on:focus={() => handleMemberInput(index)}
								on:blur={() => setTimeout(() => { if (activeMemberIndex === index) { memberSuggestions = []; activeMemberIndex = null; } }, 200)}
							/>
							{#if activeMemberIndex === index && memberSuggestions.length > 0}
								<div class="absolute top-full left-0 w-full bg-white border border-[#ddd] rounded-lg mt-1 shadow-lg z-[300] max-h-40 overflow-y-auto">
									{#each memberSuggestions as user}
										<button
											class="w-full text-left px-4 py-2 hover:bg-[#f1c40f]/10 text-sm text-black flex flex-col"
											on:mousedown|preventDefault={() => selectMemberSuggestion(index, user)}
										>
											<span class="font-medium">{user.name || 'Tanpa nama'}</span>
											<span class="text-xs text-gray-500">{user.email}</span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
						<button on:click={() => removeMemberField(index)}
							><img src="/icons/remove-icon.svg" alt="remove-icon" /></button
						>
					</div>
				{/each}
			</div>
			<div class="w-full flex justify-center mt-5">
				<button on:click={addMoreMemberField}
					><img class="w-5" src="/icons/add-member.svg" alt="add-member" /></button
				>
			</div>
			<button
				on:click={createBook}
				class="text-center text-lg cursor-pointer select-none absolute bottom-0 w-full py-3 bg-[#f1c40f] text-white titillium-web-semibold"
				>Simpan</button
			>
		</form>
	{/if}
	{/if}
</div>
