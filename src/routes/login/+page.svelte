<script lang="ts">
    import { PUBLIC_BACKEND_URL } from "$env/static/public";
</script>

<div class="w-full h-[100dvh] max-w-[431px] mx-auto bg-white relative">
    <div class="w-full h-full p-5 flex flex-col justify-end gap-10 text-black">
    <h1 class="text-5xl titillium-web-semibold">Keuangan Jelas, Hidup Bebas Cemas.</h1>
    <p>Semua arus kas Kamu ada di genggaman. Cek pemasukan dan pengeluaran bulan ini agar rencana keuangan Anda berjalan mulus.</p>
    <hr class="bg-black h-0.5" />
    <div class="w-full flex items-center justify-center">
        <a href={`${PUBLIC_BACKEND_URL}/auth/google`} class="py-2 px-10 border border-black rounded-[999px] cursor-pointer flex items-center gap-5">
            <img class="w-5" src="/icons/google.svg" alt="google">
            <span class="text-bold">Masuk Dengan Google</span>
        </a>
    </div>
    </div>
    <div class="absolute top-0 right-0 w-40"><img src="/homepage/Ellipse 1.png" width={1000} height={1000} alt="img" class="w-full h-full" /></div>
    <div class="absolute top-[20%] right-0 w-16"><img src="/homepage/Ellipse 2.png" width={500} height={500} alt="img" class="w-full h-full" /></div>
    <div class="absolute top-0 right-0 w-[20rem]"><img src="/homepage/Ellipse 3.png" width={2000} height={2000} alt="img" class="w-full h-full" /></div>
    <div class="absolute top-[20%] left-0 w-20"><img src="/homepage/Ellipse 4.png" width={800} height={800} alt="img" class="w-full h-full" /></div>
    <div class="absolute top-[30%] left-[10%] w-20"><img src="/homepage/Ellipse 5.png" width={500} height={500} alt="img" class="w-full h-full" /></div>
</div>