<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getBooks, createABook, deleteBook } from '$lib/api/booksApi.ts';
    import { getUser } from '$lib/utils/utils.ts';
    import { logout } from '$lib/utils/utils.ts';
    import type { Book } from '$lib/types/book.ts';

    import Swal from 'sweetalert2';

    let optionIsOpen = $state(false);
    let createModalIsOpen = $state(false)
    let editMode = $state(false)

    let token = $state<string>("")
    let books = $state<Book[]>([]);
    let members = $state<string[]>([]);
    let bookTitle = $state<string>("");

    onMount(async() => {
        const cassy_user = await getUser()

        if (cassy_user == null) goto("/login")

        token = cassy_user.token
        const getbooks = await getBooks(token)

        books = getbooks.data
    })

    const addMoreMemberField = () => {
        members = [...members, ""];
    }

    const removeMemberField = (index: number) => {
        members = members.filter((_, i) => i !== index);
    };

    const createBook = async() => {
        let bookData = {
            "title": bookTitle,
            "members": []
        }
        if (members.length > 0) {
            members.forEach((item) => {
                let obj = {
                    "email" : item,
                    "role" : "editor",
                    "status" : "pending"
                }
                bookData.members.push(obj)
            })
        }
        
        const result = await createABook(token, bookData)

        books = result.data

        bookTitle = ""
        members = []

        createModalIsOpen = false
        
        Toast.fire({
            icon: "success",
            title: result.message
        });
    }

    const Toast = Swal.mixin({
        toast: true,
        position: "bottom",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });

    const toogleEditMode = () => {
        editMode = !editMode
        optionIsOpen = false
    }

    const toggleEdit = () => {
        optionIsOpen = !optionIsOpen
        editMode = false
    }

    const removeBook = async (book_id:number) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        })
        .then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const result = await deleteBook(token, book_id)

                    books = result.data

                    Swal.fire({
                        title: "Deleted!",
                        text: "Your file has been deleted.",
                        icon: "success"
                    });
                } catch (error) {
                    throw error
                }
            }
        });
    }

    $inspect({members})
</script>

<div class="w-full min-h-[100dvh] max-w-[431px] mx-auto bg-[#f1c40f] relative">
    
    <!-- Header -->
    <div class="w-full h-fit py-4 px-5 bg-[#ecf0f1] flex items-center justify-between">
        
        <!-- Logo -->
        <div class="flex items-center gap-2">
            <div class="w-5">
                <img src="/cashflow-512.png" alt="img" class="w-full h-full" />
            </div>
            <div class="text-black titillium-web-bold">Cassy</div>
        </div>

        <!-- Dropdown -->
        <div class="relative w-fit h-fit flex items-center justify-center">
            {#if editMode}
            <button on:click={toogleEditMode} class="mr-5 cursor-pointer"><img src="/icons/check.svg" alt="check"></button>
            {/if}

            <button on:click={toggleEdit} class="cursor-pointer">
                <img src="/icons/option.svg" width="20" height="20" alt="profile" />
            </button>

            {#if optionIsOpen}
                <div class="absolute right-0 top-8 z-50 w-32 shadow-md flex flex-col gap-3 bg-[#dddddd] rounded p-3 items-end">
                    <a href="/invitation" class="text-xs text-black">Undangan</a>
                    <button on:click={toogleEditMode} class="text-xs text-black">Kelola Buku</button>
                    <button on:click={logout} class="text-xs text-black">Keluar</button>
                </div>
            {/if}
        </div>
    </div>

    <!-- Content -->
    {#if books.length > 0}
        <div class="w-full h-[90dvh] flex flex-col gap-3 px-5 pb-5 py-10 overflow-y-auto scrollbar-hide">
            {#each books as item}
                <div class="flex items-center justify-between">
                    <a href={`/book/${item.id}`} class="rounded-xl bg-white text-black p-3 flex justify-between {editMode ? 'w-11/12' : 'w-full'}">
                        <span>{item.title}</span>
                    </a>
                    <button on:click|stopPropagation={() => removeBook(item.id)} class="{editMode ? '' : 'hidden'}"><img src="/icons/remove-item-icon.svg" alt="remove-item"></button>
                </div>
            {/each}
        </div>
    {:else}
        <div class="w-full min-h-[90vh] flex items-center flex-col justify-center gap-5">
            <div class="flex items-start justify-center gap-3 w-9/12">
                <img src="/icons/transaction-history.svg" width="70" height="70" alt="transaction" />
                <div class="text-white text-sm">
                    Sepertinya Kamu belum pernah mencatat transaksi.
                </div>
            </div>

            <button
                class="px-10 py-3 bg-white text-black rounded-full text-sm"
                on:click={() => goto('/create-book')}
            >
                Buat Buku
            </button>
        </div>
    {/if}

    <!-- Floating Button -->
    <button
        class="w-10 h-10 shadow-xl bg-[#2c3e50] rounded-full fixed bottom-10 right-10 flex items-center justify-center"
        on:click={() => createModalIsOpen = true}
    >
        <img src="/icons/add-icon.svg" width="40" height="40" alt="add" />
    </button>

    {#if createModalIsOpen}
    <form class="w-full h-[100dvh] max-w-[431px] mx-auto bg-white fixed top-0">
        <div class='w-full h-[4rem] bg-[#f1c40f] flex items-center justify-center px-5 relative text-white'>
            <button class="absolute left-5" on:click={() => createModalIsOpen = false}><img src="/icons/back-btn-icon.svg" width=30 height=30 alt="back"/></button>
            <span class="titillium-web-semibold text-xl">Buat Buku</span>
        </div>
        <div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
            <label class="text-black titillium-web-semibold">Judul Buku</label>
            <input bind:value={bookTitle} type="text" placeholder="masukkan judul buku" class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black" />
        </div>
        <div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
            <label class="text-black titillium-web-semibold">Undang Anggota</label>
            {#each members as member, index}
            <div class="w-full flex items-center justify-between">
                <input 
                    type="email"
                    placeholder="masukkan email anggota"
                    class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black w-11/12"
                    bind:value={members[index]}
                />
                <button on:click={() => removeMemberField(index)}><img src="/icons/remove-icon.svg" alt="remove-icon"></button>
            </div>
            {/each}
        </div>
        <div class="w-full flex justify-center mt-5">
            <button on:click={addMoreMemberField}><img class="w-5" src="/icons/add-member.svg" alt="add-member"></button>
        </div>
        <button on:click={createBook} class="text-center text-lg cursor-pointer select-none absolute bottom-0 w-full py-3 bg-[#f1c40f] text-white titillium-web-semibold">Simpan</button>
    </form>
    {/if}
</div>