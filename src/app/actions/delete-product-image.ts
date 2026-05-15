'use server';

import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";

export type DeleteProductImageState = {
  status: "idle" | "success" | "error";
  message: string;
};

function parseImageId(value: unknown): number | null {
  const imageId = Number(String(value ?? "").trim());

  if (!Number.isInteger(imageId) || imageId <= 0) {
    return null;
  }

  return imageId;
}

async function removeStoredFile(imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith("/uploads/products/")) {
    return;
  }

  const relativePath = imageUrl.replace(/^\/+/, "");
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  try {
    await unlink(absolutePath);
  } catch {
    // The database removal should remain valid even if the local file is already missing.
  }
}

export async function deleteProductImage(
  _previousState: DeleteProductImageState,
  formData: FormData,
): Promise<DeleteProductImageState> {
  const currentSession = await getCurrentStudentSession();

  if (!currentSession) {
    return {
      status: "error",
      message:
        "Your session is no longer valid. Return to the homepage and sign in again.",
    };
  }

  const imageId = parseImageId(formData.get("imageId"));

  if (!imageId) {
    return {
      status: "error",
      message: "The selected image is not valid.",
    };
  }

  const image = await prisma.productImage.findFirst({
    where: {
      id: imageId,
      product: {
        groupId: currentSession.member.groupId,
      },
    },
    select: {
      id: true,
      productId: true,
      imageUrl: true,
      isCover: true,
    },
  });

  if (!image) {
    return {
      status: "error",
      message: "The selected image does not belong to your product.",
    };
  }

  await prisma.productImage.delete({
    where: {
      id: image.id,
    },
  });

  await removeStoredFile(image.imageUrl);

  if (image.isCover) {
    await prisma.productImage.updateMany({
      where: {
        productId: image.productId,
      },
      data: {
        isCover: false,
      },
    });

    const replacementCover = await prisma.productImage.findFirst({
      where: {
        productId: image.productId,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
      },
    });

    if (replacementCover) {
      await prisma.productImage.update({
        where: {
          id: replacementCover.id,
        },
        data: {
          isCover: true,
        },
      });
    }
  }

  revalidatePath("/area-gruppo/media");
  revalidatePath("/catalogo");

  return {
    status: "success",
    message: "Image removed successfully.",
  };
}
