import { safeFetch } from "$lib/utils/utils.ts";
import { PUBLIC_BACKEND_URL } from "$env/static/public";

export const getBooks = (token:string) => {
    return safeFetch(
        `${PUBLIC_BACKEND_URL}/api/books`,
        {
            method: "GET"
        },
        token
    )
}

export const getBook = (token:string, book_id:number) => {
    return safeFetch(
        `${PUBLIC_BACKEND_URL}/api/book/${book_id}`,
        {
            method: "GET"
        },
        token
    )
}

export const createABook = (token:string, payload:any[]) => {
    return safeFetch(
        `${PUBLIC_BACKEND_URL}/api/book`,
        {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        },
        token
    )
}

export const deleteBook = (token:string, book_id:number) => {
    return safeFetch(
        `${PUBLIC_BACKEND_URL}/api/book/${book_id}`,
        {
            method: "DELETE"
        },
        token
    )
}