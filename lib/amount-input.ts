// Czyszczenie kwoty wpisywanej w pole mobilne (czysta logika).
//
// Klawiatura `inputMode="decimal"` daje przecinek albo kropkę (zależnie od
// regionu telefonu), a na Androidzie bywa szersza (`-`, spacja). Pole pokazuje
// zawsze przecinek i przepuszcza tylko to, co da się zapisać: cyfry, jeden
// przecinek, najwyżej 2 miejsca po nim i 8 cyfr przed nim (MAX_AMOUNT).
// Zakres kwoty sprawdza dopiero `parseAmount` przy zapisie.

const MAX_INTEGER_DIGITS = 8;
const MAX_FRACTION_DIGITS = 2;

export function sanitizeAmountInput(raw: string): string {
  const cleaned = raw.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const comma = cleaned.indexOf(",");
  const integerRaw = comma === -1 ? cleaned : cleaned.slice(0, comma);
  // Zera wiodące skracamy („007” → „7”), ale samo „0” zostaje.
  const integer = integerRaw.replace(/^0+(?=\d)/, "").slice(0, MAX_INTEGER_DIGITS);
  if (comma === -1) return integer;

  const fraction = cleaned
    .slice(comma + 1)
    .replace(/,/g, "")
    .slice(0, MAX_FRACTION_DIGITS);
  return `${integer || "0"},${fraction}`;
}
