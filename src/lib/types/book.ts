// =======================
// ENUM / UNION TYPES
// =======================
export type Role = 'viewer' | 'editor' | 'owner';
export type Status = 'active' | 'pending';

// =======================
// MEMBER TYPE
// =======================
export type Member = {
	role: Role;
	email: string;
	status: Status;
};

// =======================
// BOOK TYPE
// =======================
export type Book = {
	id: number;
	user_id: string; // UUID from Supabase Auth
	title: string;
	members: Member[];
	created_at: string; // ISO date string
};
