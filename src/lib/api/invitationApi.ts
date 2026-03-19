import { safeFetch } from "$lib/utils/utils.ts";
import { PUBLIC_BACKEND_URL } from "$env/static/public";

export const getInvitations = (token:string) => {
    return safeFetch(
        `${PUBLIC_BACKEND_URL}/api/invitations`,
        {
            method: "GET"
        },
        token
    )
}

export const acceptInvitation = (token:string, invitationId:string) => {
    return safeFetch(
        `${PUBLIC_BACKEND_URL}/api/accept-invitation/${invitationId}`,
        {
            method: "POST"
        },
        token
    )
}