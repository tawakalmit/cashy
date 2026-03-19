<script lang="ts">
import { onMount } from "svelte";
import { getInvitations, acceptInvitation } from "$lib/api/invitationApi.ts";
import { getUser } from "$lib/utils/utils.ts";
import { goto } from "$app/navigation";
	import Swal from "sweetalert2";

let token = $state<string>("")
let invitations = $state<any[]>([])

onMount(async() => {
    const cassy_user = await getUser()
    if (cassy_user == null) goto("/login")
    token = cassy_user.token
    const getInvitationsData = await getInvitations(token)
    invitations = getInvitationsData.data
})

const acceptInvitationItem = async (invitationId: string) => {
  Swal.fire({
    title: 'Are you sure?',
    text: "You are about to accept this invitation.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1abc9c',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, accept it!'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await acceptInvitation(token, invitationId)
        Swal.fire(
          'Accepted!',
          'The invitation has been accepted.',
          'success'
        )
        setTimeout(() => {
          window.location.reload();
        }, 1500)
      } catch (error) {
        console.error("Error accepting invitation:", error);
        Swal.fire(
          'Error!',
          'There was an error accepting the invitation.',
          'error'
        )
      }
    }
  })
}

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
      <div class="w-full h-fit rounded-xl p-3 flex items-center justify-between relative z-50 select-none cursor-pointer {invitation.type == 'in' ? 'bg-[#2ecc71]' : invitation.type == 'out' ? 'bg-[#e74c3c]' : invitation.type == 'pending_in' ? 'bg-[#1abc9c]' : invitation.type == 'pending_out' ? 'bg-[#d35400]' : 'bg-gray-500'}">
        <span class="w-8/12 text-sm text-white titillium-web-semibold line-clamp-1">{invitation.bookTitle}</span>
        <span class="w-3/12 text-sm text-white titillium-web-semibold text-right">From {invitation.creatorName}</span>
      </div>
      <div class="w-full h-fit bg-[#ecf0f1] -mt-10 relative rounded-br-xl rounded-bl-xl pt-14 px-4 pb-4 flex flex-col gap-3">
        <button on:click={() => acceptInvitationItem(invitation.id)} class="px-5 py-2 bg-[#1abc9c] text-white w-fit mx-auto rounded-xl cursor-pointer">Accept</button>
      </div>
    </div>
    {/each}
  </div>

</div>