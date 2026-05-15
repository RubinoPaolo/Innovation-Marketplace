'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";

export type ProductFormValues = {
  title: string;
  shortDescription: string;
  description: string;
  priceEuro: string;
  categoryId: string;
  features: string[];
  badgeIds: string[];
};

export type ProductFormState = {
  status: "idle" | "success" | "error";
  message: string;
  values: ProductFormValues;
};

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeLongText(value: string): string {
  return value.trim();
}

function extractSubmittedValues(formData: FormData): ProductFormValues {
  return {
    title: String(formData.get("title") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    description: String(formData.get("description") ?? ""),
    priceEuro: String(formData.get("priceEuro") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    features: [1, 2, 3, 4, 5].map((index) =>
      String(formData.get(`feature${index}`) ?? ""),
    ),
    badgeIds: formData.getAll("badgeIds").map((value) => String(value)),
  };
}

function errorState(
  values: ProductFormValues,
  message: string,
): ProductFormState {
  return {
    status: "error",
    message,
    values,
  };
}

function parseOptionalPositiveInteger(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsed = Number(trimmedValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parsePriceToCents(value: string): number | null {
  const rawValue = value.trim().replace(/\s+/g, "");

  if (!/^\d+([.,]\d{1,2})?$/.test(rawValue)) {
    return null;
  }

  const normalizedValue = rawValue.replace(",", ".");
  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return Math.round(numericValue * 100);
}

function collectFeatures(values: ProductFormValues): string[] {
  const normalizedFeatures = values.features.map((feature) =>
    normalizeText(feature),
  );

  return normalizedFeatures.filter((feature, index, features) => {
    return feature.length > 0 && features.indexOf(feature) === index;
  });
}

function collectBadgeIds(values: ProductFormValues): number[] {
  return values.badgeIds
    .map((badgeId) => Number(badgeId.trim()))
    .filter((badgeId, index, badgeIds) => {
      return (
        Number.isInteger(badgeId) &&
        badgeId > 0 &&
        badgeIds.indexOf(badgeId) === index
      );
    });
}

export async function saveGroupProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const values = extractSubmittedValues(formData);
  const currentSession = await getCurrentStudentSession();

  if (!currentSession) {
    return errorState(
      values,
      "Your session is no longer valid. Return to the homepage and sign in again.",
    );
  }

  const title = normalizeText(values.title);
  const shortDescription = normalizeText(values.shortDescription);
  const description = normalizeLongText(values.description);
  const priceCents = parsePriceToCents(values.priceEuro);
  const categoryId = parseOptionalPositiveInteger(values.categoryId);
  const features = collectFeatures(values);
  const badgeIds = collectBadgeIds(values);

  if (!title) {
    return errorState(
      values,
      "Enter a product name.",
    );
  }

  if (!priceCents) {
    return errorState(
      values,
      "Enter a valid price, for example 29.90.",
    );
  }

  if (values.categoryId.trim() && !categoryId) {
    return errorState(
      values,
      "The selected category is not valid.",
    );
  }

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      return errorState(
        values,
        "The selected category is not valid.",
      );
    }
  }

  const validBadges = await prisma.badge.findMany({
    where: {
      id: {
        in: badgeIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (validBadges.length !== badgeIds.length) {
    return errorState(
      values,
      "One or more selected badges are not valid.",
    );
  }

  const existingProduct = await prisma.product.findUnique({
    where: {
      groupId: currentSession.member.groupId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existingProduct) {
    await prisma.product.update({
      where: {
        id: existingProduct.id,
      },
      data: {
        title,
        shortDescription: shortDescription || null,
        description,
        priceCents,
        categoryId,
        status: existingProduct.status,
        features: {
          deleteMany: {},
          create: features.map((text, index) => ({
            text,
            sortOrder: index,
          })),
        },
        badges: {
          deleteMany: {},
          create: badgeIds.map((badgeId) => ({
            badge: {
              connect: {
                id: badgeId,
              },
            },
          })),
        },
      },
    });
  } else {
    await prisma.product.create({
      data: {
        groupId: currentSession.member.groupId,
        title,
        shortDescription: shortDescription || null,
        description,
        priceCents,
        categoryId,
        status: "DRAFT",
        features: {
          create: features.map((text, index) => ({
            text,
            sortOrder: index,
          })),
        },
        badges: {
          create: badgeIds.map((badgeId) => ({
            badge: {
              connect: {
                id: badgeId,
              },
            },
          })),
        },
      },
    });
  }

  revalidatePath("/area-gruppo");
  revalidatePath("/catalogo");

  return {
    status: "success",
    message: "Product draft saved successfully.",
    values,
  };
}