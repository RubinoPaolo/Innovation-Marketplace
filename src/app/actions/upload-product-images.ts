'use server';

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";

export type ProductImageUploadState = {
  status: "idle" | "success" | "error";
  message: string;
};

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function getImageExtension(file: File): string | null {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return null;
  }
}

function collectImageFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export async function uploadProductImages(
  _previousState: ProductImageUploadState,
  formData: FormData,
): Promise<ProductImageUploadState> {
  const currentSession = await getCurrentStudentSession();

  if (!currentSession) {
    return {
      status: "error",
      message: "Your session is no longer valid. Return to the homepage and sign in again.",
    };
  }

  const product = await prisma.product.findUnique({
    where: {
      groupId: currentSession.member.groupId,
    },
    select: {
      id: true,
      title: true,
      images: {
        select: {
          id: true,
          isCover: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!product) {
    return {
      status: "error",
      message: "Create and save the product draft before uploading images.",
    };
  }

  const files = collectImageFiles(formData);

  if (files.length === 0) {
    return {
      status: "error",
      message: "Choose at least one image to upload.",
    };
  }

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return {
        status: "error",
        message: "Only JPG, PNG, WEBP and AVIF images are supported.",
      };
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        status: "error",
        message: "Each image must be 5 MB or smaller.",
      };
    }
  }

  const uploadDirectory = path.join(
    process.cwd(),
    "public",
    "uploads",
    "products",
  );

  await mkdir(uploadDirectory, { recursive: true });

  const hasCoverImage = product.images.some((image) => image.isCover);
  const startingSortOrder =
    product.images.length > 0
      ? Math.max(...product.images.map((image) => image.sortOrder)) + 1
      : 0;

  const newImagesData: Array<{
    imageUrl: string;
    altText: string;
    isCover: boolean;
    sortOrder: number;
  }> = [];

  for (const [index, file] of files.entries()) {
    const extension = getImageExtension(file);

    if (!extension) {
      return {
        status: "error",
        message: "One of the selected files has an unsupported format.",
      };
    }

    const filename = `${product.id}-${Date.now()}-${randomUUID()}.${extension}`;
    const absoluteFilePath = path.join(uploadDirectory, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(absoluteFilePath, buffer);

    newImagesData.push({
      imageUrl: `/uploads/products/${filename}`,
      altText: `${product.title} product image ${startingSortOrder + index + 1}`,
      isCover: !hasCoverImage && index === 0,
      sortOrder: startingSortOrder + index,
    });
  }

  await prisma.productImage.createMany({
    data: newImagesData.map((image) => ({
      productId: product.id,
      ...image,
    })),
  });

  revalidatePath("/area-gruppo/media");
  revalidatePath("/catalogo");

  return {
    status: "success",
    message:
      files.length === 1
        ? "Image uploaded successfully."
        : "Images uploaded successfully.",
  };
}
