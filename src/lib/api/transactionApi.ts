import { safeFetch } from "$lib/utils/utils.ts";
import { PUBLIC_BACKEND_URL } from "$env/static/public";


export const getTransactions = (token:string, book_id:string) => {
    return safeFetch(
        `${PUBLIC_BACKEND_URL}/api/transactions/${book_id}`,
        {
            method: "GET"
        },
        token
    )
}

export const createTransaction = (token:string, data:any) => {
    return safeFetch(
        `${PUBLIC_BACKEND_URL}/api/create-transaction`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        },
        token
    )
}

export const deleteTransaction = (token:string, data:any) => {
    return safeFetch(
        `${PUBLIC_BACKEND_URL}/api/delete-transaction`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        },
        token
    )
}