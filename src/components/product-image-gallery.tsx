'use client';

import { useMemo, useState } from "react";

export type ProductGalleryImage = {
  id: number;
  imageUrl: string;
  altText: string | null;
  isCover: boolean;
};

type ProductImageGalleryProps = {
  images: ProductGalleryImage[];
  productTitle: string;
};

function getImageAltText(
  image: ProductGalleryImage,
  productTitle: string,
  index: number,
): string {
  return image.altText?.trim() || `${productTitle} image ${index + 1}`;
}

export function ProductImageGallery({
  images,
  productTitle,
}: ProductImageGalleryProps) {
  const orderedImages = useMemo(() => {
    const coverImage = images.find((image) => image.isCover);

    if (!coverImage) {
      return images;
    }

    return [
      coverImage,
      ...images.filter((image) => image.id !== coverImage.id),
    ];
  }, [images]);

  const [selectedImageId, setSelectedImageId] = useState<number | null>(
    orderedImages[0]?.id ?? null,
  );

  const selectedImage =
    orderedImages.find((image) => image.id === selectedImageId) ??
    orderedImages[0] ??
    null;

  return (
    <div className="space-y-5">
      <div className="premium-surface-strong overflow-hidden rounded-[2.2rem]">
        <div className="relative aspect-[16/10] bg-slate-100/90">
          {selectedImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.imageUrl}
                alt={getImageAltText(
                  selectedImage,
                  productTitle,
                  orderedImages.findIndex(
                    (image) => image.id === selectedImage.id,
                  ),
                )}
                className="h-full w-full object-contain p-2 sm:p-3"
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/20 to-transparent" />

              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {selectedImage.isCover ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50/95 px-3 py-1 text-xs font-black text-emerald-800 shadow-sm shadow-emerald-900/10 backdrop-blur">
                    Cover image
                  </span>
                ) : (
                  <span className="rounded-full border border-blue-200 bg-blue-50/95 px-3 py-1 text-xs font-black text-blue-800 shadow-sm shadow-blue-900/10 backdrop-blur">
                    Selected image
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm font-bold text-slate-500">
              Product image not available yet
            </div>
          )}
        </div>
      </div>

      {orderedImages.length > 1 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orderedImages.map((image, index) => {
            const selected = selectedImage?.id === image.id;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImageId(image.id)}
                aria-pressed={selected}
                aria-label={`Show ${getImageAltText(
                  image,
                  productTitle,
                  index,
                )} as main image`}
                className={`group premium-surface relative overflow-hidden rounded-[1.8rem] border text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80 ${
                  selected
                    ? "border-blue-500 shadow-lg shadow-blue-900/15 ring-4 ring-blue-100"
                    : "border-transparent hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-900/10"
                }`}
              >
                <div className="aspect-[16/10] bg-slate-100/90">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.imageUrl}
                    alt={getImageAltText(image, productTitle, index)}
                    className="h-full w-full object-contain p-1.5 transition duration-300 group-hover:scale-[1.025]"
                  />
                </div>

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-slate-950/45 to-transparent p-3">
                  <div className="flex flex-wrap gap-2">
                    {image.isCover ? (
                      <span className="rounded-full border border-emerald-100 bg-emerald-50/95 px-3 py-1 text-xs font-black text-emerald-800 shadow-sm backdrop-blur">
                        Cover
                      </span>
                    ) : null}

                    {selected ? (
                      <span className="rounded-full border border-blue-100 bg-blue-50/95 px-3 py-1 text-xs font-black text-blue-800 shadow-sm backdrop-blur">
                        Selected
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}