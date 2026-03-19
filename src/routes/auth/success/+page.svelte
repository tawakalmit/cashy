<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    onMount(() => {
        const token = $page.url.searchParams.get('token');
        const name = $page.url.searchParams.get('name');
        const picture = $page.url.searchParams.get('picture');

        if (token) {
            let userData = {
                name,
                picture,
                token
            }
            localStorage.setItem('cassy_user', JSON.stringify(userData));
            goto('/');
        } else {
            alert("Login gagal");
        }
    });
</script>