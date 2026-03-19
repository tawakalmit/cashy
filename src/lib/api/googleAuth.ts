import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { safeFetch } from "$lib/utils/utils.ts";

export async function hitGoogle () {
    return safeFetch(
        `${PUBLIC_BACKEND_URL}/auth/google`, 
        {
            method: "GET"
        }, 
        ""
    )
}