export type FormState =
  | { status: "idle"; message: null }
  | { status: "success"; message: string | null }
  | { status: "error"; message: string };

export const initialFormState: FormState = { status: "idle", message: null };
