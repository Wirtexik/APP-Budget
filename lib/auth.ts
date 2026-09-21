// Użytkownik loguje się samym loginem, a Supabase wymaga adresu e-mail –
// dlatego do loginu dokładamy stałą domenę. Konta w Supabase muszą mieć
// adresy w formacie `login@budzet.local`.
export const EMAIL_DOMAIN = "@budzet.local";

export const loginToEmail = (login: string) => `${login.trim()}${EMAIL_DOMAIN}`;

export const emailToLogin = (email: string | undefined) =>
  email?.replace(EMAIL_DOMAIN, "") ?? "";
