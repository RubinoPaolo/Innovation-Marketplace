export type PriceCentsLike =
  | string
  | number
  | bigint
  | {
      toString(): string;
    };

function normalizeCentsString(value: PriceCentsLike): string {
  const rawValue = value.toString().trim();

  if (!rawValue) {
    return "0";
  }

  const integerPart = rawValue.split(".")[0] ?? "0";
  const normalizedIntegerPart = integerPart.replace(/^0+(?=\d)/, "");

  if (!/^-?\d+$/.test(normalizedIntegerPart)) {
    return "0";
  }

  return normalizedIntegerPart;
}

function addThousandsSeparators(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatPriceFromCents(priceCents: PriceCentsLike): string {
  const centsString = normalizeCentsString(priceCents);
  const isNegative = centsString.startsWith("-");
  const absoluteCents = isNegative ? centsString.slice(1) : centsString;

  const paddedCents = absoluteCents.padStart(3, "0");
  const euroPart = paddedCents.slice(0, -2) || "0";
  const centPart = paddedCents.slice(-2);

  const formattedEuroPart = addThousandsSeparators(euroPart);

  return `${isNegative ? "-" : ""}€${formattedEuroPart}.${centPart}`;
}

export function priceCentsToInputValue(
  priceCents: PriceCentsLike | null | undefined,
): string {
  if (priceCents === null || priceCents === undefined) {
    return "";
  }

  const centsString = normalizeCentsString(priceCents);

  if (centsString === "0") {
    return "";
  }

  const isNegative = centsString.startsWith("-");
  const absoluteCents = isNegative ? centsString.slice(1) : centsString;

  const paddedCents = absoluteCents.padStart(3, "0");
  const euroPart = paddedCents.slice(0, -2) || "0";
  const centPart = paddedCents.slice(-2);

  return `${isNegative ? "-" : ""}${euroPart},${centPart}`;
}

export function parsePriceToCentsString(value: string): string | null {
  const rawValue = value.trim().replace(/\s+/g, "");

  if (!/^\d+([.,]\d{1,2})?$/.test(rawValue)) {
    return null;
  }

  const [euroPartRaw, centPartRaw = ""] = rawValue.split(/[.,]/);
  const euroPart = euroPartRaw.replace(/^0+(?=\d)/, "") || "0";
  const centPart = centPartRaw.padEnd(2, "0").slice(0, 2);

  if (!/^\d+$/.test(euroPart) || !/^\d{2}$/.test(centPart)) {
    return null;
  }

  const cents = `${euroPart}${centPart}`.replace(/^0+(?=\d)/, "");

  if (!/^\d+$/.test(cents)) {
    return null;
  }

  if (cents === "0") {
    return null;
  }

  return cents;
}