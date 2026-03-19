<script lang="ts">
import { getTransactions, createTransaction, deleteTransaction } from "$lib/api/transactionApi.ts";
import { getUser } from "$lib/utils/utils.ts";
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { getBook } from "$lib/api/booksApi.ts";
import type { Transaction } from "$lib/types/transactions.ts";
import Swal from "sweetalert2";

let token = $state<string>("")
let transactions = $state<Transaction[]>([])
let book_id = $state<string>($page?.params?.book_id || "")
let balance = $state<string>("")
let bookTitle = $state<string>("")

let createTransactionModalIsOpen = $state<boolean>(false)
let transactionTitle = $state<string>("")
let transactionDescription = $state<string>("")
let transactionAmount = $state<string>("")
let transactionType = $state<string>("")

onMount(async() => {
    const cassy_user = await getUser()
    if (cassy_user == null) goto("/login")
    token = cassy_user.token

    const getTransactionsData = await getTransactions(token, book_id)
    const getBookData = await getBook(token, parseInt(book_id))

    bookTitle = getBookData.data.title
    transactions = getTransactionsData.data
    balance = getTransactionsData.balance
})

const formatTanggalIndo = (dateString) => {
    const date = new Date(dateString);

    const bulan = [
        "januari", "februari", "maret", "april",
        "mei", "juni", "juli", "agustus",
        "september", "oktober", "november", "desember"
    ];

    const hari = date.getDate();
    const namaBulan = bulan[date.getMonth()];
    const tahun = date.getFullYear();

    const jam = date.getHours().toString().padStart(2, '0');
    const menit = date.getMinutes().toString().padStart(2, '0');

    return `${hari} ${namaBulan} ${tahun}, ${jam}:${menit}`;
}

const moreDetails = (e:any) => {
  e.currentTarget.children[1].classList.toggle('hidden')
}

const deleteTransItem = (transactionId:number) => {
  Swal.fire({
    title: 'Apakah Anda yakin?',
    text: "Transaksi yang sudah dihapus tidak bisa dikembalikan!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const deleteTrans = await deleteTransaction(token, { book_id, transactionId })
        transactions = deleteTrans.data
        balance = deleteTrans.balance
        Swal.fire(
          'Terhapus!',
          'Transaksi berhasil dihapus.',
          'success'
        )
      } catch (error) {
        console.error(error)
        Swal.fire(
          'Gagal!',
          'Terjadi kesalahan saat menghapus transaksi.',
          'error'
        )
      }
    }
  })
}

const createATransaction = async () => {
  let dataToSend = {
    title: transactionTitle,
    description: transactionDescription,
    amount: parseInt(transactionAmount),
    type: transactionType,
    book_id: parseInt(book_id)
  }

  try {
    const buatTransaksi = await createTransaction(token, dataToSend)
    transactions = buatTransaksi.data
    balance = buatTransaksi.balance
    createTransactionModalIsOpen = false

    transactionTitle = ""
    transactionDescription = ""
    transactionAmount = ""
    transactionType = ""

    Swal.fire({
      title: 'Berhasil',
      text: 'Transaksi berhasil dibuat',
      icon: 'success',
    })
  } catch (error) {
    console.error(error)
  }
}
</script>

<div class="w-full min-h-[100dvh] max-w-[431px] mx-auto bg-white relative">

  <div class="w-full h-fit py-4 px-5 bg-[#ecf0f1] flex items-center justify-between">
    <a href="/">
      <img src="/icons/back-btn-icon.svg" width="20" height="20" alt="back" />
    </a>

    <span class="text-black titillium-web-bold w-10/12 text-center">
      {bookTitle}
    </span>

    <div class="cursor-pointer relative w-fit h-fit" style="visibility: hidden;">
      <img src="/icons/option.svg" width="20" height="20" alt="profile" />

      <div class="w-[8rem] h-fit shadow-md gap-3 flex flex-col bg-[#dddddd] rounded absolute right-0 top-8 p-3 items-end hidden">
        <div class="text-xs text-black">Kelola Transaksi</div>
      </div>
    </div>
  </div>

  <!-- Kondisi data eksis -->
  <div class="w-full flex flex-col gap-3 px-5 py-10 h-[75dvh] overflow-y-auto">
    {#each transactions as transaction}
    <div
      on:click={(e) => moreDetails(e)}
      on:keydown={(e) => moreDetails(e)}
      role="button" 
      tabindex="0" 
    >
      <div class="w-full h-fit rounded-xl p-3 flex items-center justify-between relative z-50 select-none cursor-pointer {transaction.type == 'in' ? 'bg-[#2ecc71]' : transaction.type == 'out' ? 'bg-[#e74c3c]' : transaction.type == 'pending_in' ? 'bg-[#1abc9c]' : transaction.type == 'pending_out' ? 'bg-[#d35400]' : 'bg-gray-500'}">
        <span class="w-8/12 text-sm text-white titillium-web-semibold line-clamp-1">{transaction.title}</span>
        <span class="w-3/12 text-sm text-white titillium-web-semibold text-right">{transaction.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
      </div>
      <div class="w-full h-fit bg-[#ecf0f1] -mt-10 relative rounded-br-xl rounded-bl-xl pt-14 px-4 pb-4 flex flex-col gap-3 hidden">
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
          <span>{transaction.type == "in" ? "Pemasukan" : transaction.type == "out" ? "Pengeluaran" : transaction.type == "pending_in" ? "Pemasukan tertunda" : "Pengeluaran tertunda"}</span>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <span class="w-14">Nilai</span>
          <span>{transaction.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <span class="w-14">Tanggal</span>
          <span>{formatTanggalIndo(transaction.created_at)}</span>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <span class="w-14">Kreator</span>
          <span>{transaction.creatorName}</span>
        </div>
        <div class="w-full flex justify-end">
          <button class="w-fit" on:click|stopPropagation={() => deleteTransItem(transaction.id)}><img class="w-5" src="/icons/delete.svg" alt="Delete"></button>
        </div>
      </div>
    </div>
    {/each}
  </div>

  {#if createTransactionModalIsOpen}
  <form class="w-full h-[100dvh] max-w-[431px] mx-auto bg-white fixed top-0 z-[100]">
      <div class='w-full h-[4rem] bg-[#f1c40f] flex items-center justify-center px-5 relative text-white'>
          <button class="absolute left-5" on:click={() => createTransactionModalIsOpen = false}><img src="/icons/back-btn-icon.svg" width=30 height=30 alt="back"/></button>
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
          <input bind:value={transactionTitle} type="text" placeholder="Masukkan Judul Transaksi" class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black" />
      </div>
      <div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
          <label class="text-black titillium-web-semibold">Deskripsi</label>
          <input bind:value={transactionDescription} type="text" placeholder="Masukkan Deskripsi Transaksi" class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black" />
      </div>
      <div class="w-10/12 mx-auto flex flex-col gap-3 mt-5">
          <label class="text-black titillium-web-semibold">Jumlah</label>
          <input bind:value={transactionAmount} type="text" placeholder="Masukkan Jumlah Transaksi" class="border border-[#ddd] rounded-full px-5 py-3 outline-none text-black" />
      </div>
      
      <button on:click={createATransaction} class="text-center text-lg cursor-pointer select-none absolute bottom-0 w-full py-3 bg-[#f1c40f] text-white titillium-web-semibold">Simpan</button>
  </form>
  {/if}

  <div class="w-full h-fit py-4 px-5 flex items-center justify-between absolute bottom-14 left-0">
    <button on:click={() => createTransactionModalIsOpen = true} class="cursor-pointer flex items-center w-fit mx-auto bg-[#f1c40f] rounded-full px-5">
      <img src="/icons/add-icon.svg" width="40" height="40" alt="add" />
      <span class="titillium-web-bold text-white">Tambah Transaksi</span>
    </button>
  </div>
  <div class="w-full h-fit py-4 px-5 bg-[#ecf0f1] flex items-center justify-between absolute bottom-0 left-0">
    <span>Sisa Saldo</span>
    <span>{balance ? balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0"}</span>
  </div>

</div>