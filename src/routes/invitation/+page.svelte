<script lang="ts">
	import { onMount } from 'svelte';
	import { getInvitations, acceptInvitation } from '$lib/api/invitationApi';
	import { getUser } from '$lib/utils/utils';
	import { goto } from '$app/navigation';
	import Swal from 'sweetalert2';

	let invitations = $state<any[]>([]);

	onMount(async () => {
		const user = await getUser();
		if (user == null) {
			goto('/login');
			return;
		}
		try {
			const data = await getInvitations();
			invitations = data;
		} catch (error) {
			console.error('Failed to get invitations:', error);
		}
	});

	const acceptInvitationItem = async (invitationId: number) => {
		Swal.fire({
			title: 'Apakah kamu yakin?',
			text: 'Kamu akan menerima undangan ini.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#1abc9c',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Ya, terima!',
			cancelButtonText: 'Batal'
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await acceptInvitation(invitationId);
					Swal.fire('Diterima!', 'Undangan berhasil diterima.', 'success');
					setTimeout(() => {
						window.location.reload();
					}, 1500);
				} catch (error) {
					console.error('Error accepting invitation:', error);
					Swal.fire('Gagal!', 'Terjadi kesalahan saat menerima undangan.', 'error');
				}
			}
		});
	};
</script>

<div class="w-full min-h-[100dvh] max-w-[431px] mx-auto bg-[#f1c40f] relative">
	<div class="w-full h-fit py-4 px-5 bg-[#ecf0f1] flex items-center justify-between">
		<a href="/">
			<img src="/icons/back-btn-icon.svg" width="20" height="20" alt="back" />
		</a>
		<span class="text-black titillium-web-bold w-10/12 text-center">Undangan</span>
		<div class="cursor-pointer relative w-fit h-fit" style="visibility: hidden;">
			<img src="/icons/option.svg" width="20" height="20" alt="profile" />
		</div>
	</div>

	{#if invitations.length == 0}
		<div class="w-full h-[75dvh] flex items-center justify-center">
			<span class="text-gray-500 titillium-web-regular">Belum ada undangan</span>
		</div>
	{/if}

	<div class="w-full flex flex-col gap-3 px-5 py-10 h-[75dvh] overflow-y-auto">
		{#each invitations as invitation}
			<div>
				<div
					class="w-full h-fit rounded-xl p-3 flex items-center justify-between relative z-50 select-none cursor-pointer bg-gray-500"
				>
					<span class="w-8/12 text-sm text-white titillium-web-semibold line-clamp-1"
						>{invitation.bookTitle}</span
					>
					<span class="w-3/12 text-sm text-white titillium-web-semibold text-right"
						>Dari {invitation.creatorName}</span
					>
				</div>
				<div
					class="w-full h-fit bg-[#ecf0f1] -mt-10 relative rounded-br-xl rounded-bl-xl pt-14 px-4 pb-4 flex flex-col gap-3"
				>
					<button
						on:click={() => acceptInvitationItem(invitation.id)}
						class="px-5 py-2 bg-[#1abc9c] text-white w-fit mx-auto rounded-xl cursor-pointer"
						>Terima</button
					>
				</div>
			</div>
		{/each}
	</div>
</div>
