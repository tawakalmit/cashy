import { goto } from "$app/navigation";

/* ============================
  SAFE FETCH (REUSE PATTERN)
============================ */
export async function safeFetch(url:string, opts = {}, token:string) {
 const headers = opts.headers ? { ...opts.headers } : {};
 if (token) headers['Authorization'] = `Bearer ${token}`;

 const res = await fetch(url, { ...opts, headers });

 const data = await res.json().catch(() => null);

 if (!res.ok) {
   const err = new Error(
     data?.message || `HTTP ${res.status} - ${res.statusText}`
   );
   err.status = res.status;
   err.errors = data?.errors || null;
   if (data?.message !== "Video generation not found") {
     alert(err)
     location.reload()
   }
   throw err;
 }

 return data;
}

export const getUser = () => {
  try {
    const cassyUser = localStorage.getItem("cassy_user");
    return cassyUser ? JSON.parse(cassyUser) : null;
  } catch (err) {
    console.error("Failed to parse user:", err);
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem("cassy_user");
  goto("/login")
}