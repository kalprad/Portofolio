/** Bentuk balikan seragam untuk semua server action panel admin. */
export interface FormState {
  ok: boolean;
  message?: string;
  /** Galat per kolom, supaya pesannya bisa menempel di isian yang salah. */
  errors?: Record<string, string>;
}

export const FORM_STATE_AWAL: FormState = { ok: false };
