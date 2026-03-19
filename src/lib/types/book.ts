// =======================
// ENUM / UNION TYPES
// =======================
export type Role = "viewer" | "editor" | "owner";
export type Status = "active" | "pending";

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
  user_id: number;
  title: string;
  members: Member[];
  created_at: string; // ISO date string
};

// =======================
// RESPONSE TYPES
// =======================

// Kalau API kamu langsung return array
export type BooksResponse = Book[];

// Kalau API kamu pakai wrapper (optional)
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};