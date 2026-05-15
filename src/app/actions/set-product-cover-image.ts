'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";

export type ProductImageActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function parseImageId(value: FormDataEntryValue | null): number | null {
  const imageId = Number(String(value ?? "").trim());

  if (!Number.isInteger(imageId) || imageId <= 0) {
    return null;
  }

  return imageId;
}

export async function setProductCoverImage(
  _previousState: ProductImageActionState,
  formData: FormData,
): Promise<ProductImageActionState> {
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
      isCover: true,
    },
  });

  if (!image) {
    return {
      status: "error",
      message: "The selected image does not belong to your product.",
    };
  }

  if (image.isCover) {
    return {
      status: "success",
      message: "This image is already the product cover.",
    };
  }

  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: {
        productId: image.productId,
      },
      data: {
        isCover: false,
      },
    }),
    prisma.productImage.update({
      where: {
        id: image.id,
      },
      data: {
        isCover: true,
      },
    }),
  ]);

  revalidatePath("/area-gruppo/media");
  revalidatePath("/catalogo");

  return {
    status: "success",
    message: "Cover image updated successfully.",
  };
}
