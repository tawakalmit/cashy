<script lang="ts">
	import { goto } from '$app/navigation';

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	const handleLogin = async () => {
		error = '';
		loading = true;

		try {
			const res = await fetch('/masteradmin/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			const data = await res.json();

			if (res.ok) {
				localStorage.setItem('admin_token', data.token);
				goto('/masteradmin');
			} else {
				error = data.message || 'Login gagal';
			}
		} catch (err) {
			error = 'Terjadi kesalahan';
		} finally {
			loading = false;
		}
	};
</script>

<div class="w-full min-h-[100dvh] flex items-center justify-center bg-[#2c3e50]">
	<div class="w-full max-w-[380px] bg-white rounded-xl p-8 shadow-lg">
		<h1 class="text-2xl titillium-web-bold text-center text-[#2c3e50] mb-6">Login Admin</h1>

		{#if error}
			<div class="bg-red-100 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>
		{/if}

		<form on:submit|preventDefault={handleLogin} class="flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<label for="username" class="text-sm text-gray-600">Nama Pengguna</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					placeholder="Masukkan nama pengguna"
					class="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#f1c40f]"
					required
				/>
			</div>
			<div class="flex flex-col gap-1">
				<label for="password" class="text-sm text-gray-600">Kata Sandi</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Masukkan kata sandi"
					class="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#f1c40f]"
					required
				/>
			</div>
			<button
				type="submit"
				disabled={loading}
				class="w-full py-3 bg-[#f1c40f] text-white rounded-lg titillium-web-semibold text-lg cursor-pointer disabled:opacity-50"
			>
				{loading ? 'Memproses...' : 'Masuk'}
			</button>
		</form>
	</div>
</div>
