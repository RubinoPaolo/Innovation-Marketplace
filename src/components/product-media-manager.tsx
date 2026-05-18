'use client';

import { useActionState } from "react";
import {
  deleteProductImage,
  type DeleteProductImageState,
} from "@/app/actions/delete-product-image";
import {
  setProductCoverImage,
  type ProductImageActionState,
} from "@/app/actions/set-product-cover-image";
import {
  toggleProductPublication,
  type ProductPublicationState,
} from "@/app/actions/toggle-product-publication";
import {
  uploadProductImages,
  type ProductImageUploadState,
} from "@/app/actions/upload-product-images";

type ProductImageView = {
  id: number;
  imageUrl: string;
  altText: string | null;
  isCover: boolean;
};

type ProductMediaManagerProps = {
  productTitle: string;
  productStatus: string;
  images: ProductImageView[];
};

const initialUploadState: ProductImageUploadState = {
  status: "idle",
  message: "",
};

const initialPublicationState: ProductPublicationState = {
  status: "idle",
  message: "",
};

const initialCoverState: ProductImageActionState = {
  status: "idle",
  message: "",
};

const initialDeleteState: DeleteProductImageState = {
  status: "idle",
  message: "",
};

export function ProductMediaManager({
  productTitle,
  productStatus,
  images,
}: ProductMediaManagerProps) {
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadProductImages,
    initialUploadState,
  );

  const [publicationState, publicationAction, publicationPending] =
    useActionState(toggleProductPublication, initialPublicationState);

  const [coverState, coverAction, coverPending] = useActionState(
    setProductCoverImage,
    initialCoverState,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteProductImage,
    initialDeleteState,
  );

  const isPublished = productStatus === "PUBLISHED";

  return (
    <div className="space-y-6">
      <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] xl:items-start">
          <div className="space-y-3">
            <p className="premium-kicker">Product images</p>
            <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
              Upload visual assets for {productTitle}.
            </h2>
            <p className="max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
              Upload JPG, PNG, WEBP or AVIF files. The first uploaded image becomes the default cover, but you can change it later from the gallery.
            </p>
          </div>

          <div className="premium-muted rounded-[1.8rem] p-4 sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Upload guidance
            </p>
            <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-600">
              <li>Accepted: JPG, PNG, WEBP, AVIF</li>
              <li>Maximum: 5 MB per file</li>
              <li>Use clear, landscape-friendly visuals</li>
            </ul>
          </div>
        </div>

        <form action={uploadAction} className="mt-6 space-y-5">
          <div className="space-y-2.5">
            <label htmlFor="images" className="block text-sm font-black text-slate-900">
              Select images
            </label>
            <input
              id="images"
              name="images"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div
            aria-live="polite"
            className={`min-h-6 text-sm font-black ${
              uploadState.status === "success"
                ? "text-emerald-700"
                : uploadState.status === "error"
                  ? "text-rose-700"
                  : "text-slate-500"
            }`}
          >
            {uploadState.message || "No image upload started yet."}
          </div>

          <button
            type="submit"
            disabled={uploadPending}
            className="premium-button-primary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploadPending ? "Uploading..." : "Upload images"}
          </button>
        </form>
      </section>

      <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="premium-kicker">Uploaded images</p>
            <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
              Current visual gallery.
            </h2>
            <p className="max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
              Choose the catalog cover or remove files uploaded by mistake.
            </p>
          </div>

          <article className="premium-stat-card min-w-[12rem] rounded-[1.7rem] p-5">
            <p className="relative z-10 text-sm font-bold text-slate-500">
              Images uploaded
            </p>
            <p className="relative z-10 mt-4 text-4xl font-black tracking-tight text-slate-950">
              {images.length}
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div
            aria-live="polite"
            className={`min-h-6 rounded-2xl border px-4 py-3 text-sm font-black ${
              coverState.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : coverState.status === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white/76 text-slate-500"
            }`}
          >
            {coverState.message || "No cover change made yet."}
          </div>

          <div
            aria-live="polite"
            className={`min-h-6 rounded-2xl border px-4 py-3 text-sm font-black ${
              deleteState.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : deleteState.status === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white/76 text-slate-500"
            }`}
          >
            {deleteState.message || "No image removed yet."}
          </div>
        </div>

        {images.length === 0 ? (
          <div className="premium-muted mt-6 rounded-[1.7rem] p-6 text-sm font-semibold leading-7 text-slate-600">
            No product images uploaded yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image) => (
              <article
                key={image.id}
                className="premium-surface premium-card-hover group overflow-hidden rounded-[1.9rem]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-200/80">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.imageUrl}
                    alt={image.altText ?? `${productTitle} product image`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/45 to-transparent" />
                </div>

                <div className="space-y-4 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-black text-slate-800">
                      Product image
                    </p>
                    {image.isCover ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                        Cover
                      </span>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    {image.isCover ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm font-black text-slate-500"
                      >
                        Current cover
                      </button>
                    ) : (
                      <form action={coverAction}>
                        <input type="hidden" name="imageId" value={image.id} />
                        <button
                          type="submit"
                          disabled={coverPending}
                          className="premium-button-secondary inline-flex h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {coverPending ? "Updating..." : "Set as cover"}
                        </button>
                      </form>
                    )}

                    <form
                      action={deleteAction}
                      onSubmit={(event) => {
                        if (!window.confirm("Remove this image? This cannot be undone.")) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="imageId" value={image.id} />
                      <button
                        type="submit"
                        disabled={deletePending}
                        className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletePending ? "Removing..." : "Remove image"}
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="premium-kicker">Publication status</p>
            <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
              {isPublished ? "Product currently published." : "Product currently in draft."}
            </h2>
            <p className="max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
              Published products appear in the shared catalog. You can move the product back to draft at any time.
            </p>
          </div>

          <div className="premium-muted rounded-[1.7rem] px-5 py-4">
            <p className="text-sm font-bold text-slate-500">Current status</p>
            <p className={`mt-2 text-lg font-black ${isPublished ? "text-emerald-700" : "text-amber-700"}`}>
              {isPublished ? "Published" : "Draft"}
            </p>
          </div>
        </div>

        <form action={publicationAction} className="mt-6 space-y-5">
          <div
            aria-live="polite"
            className={`min-h-6 text-sm font-black ${
              publicationState.status === "success"
                ? "text-emerald-700"
                : publicationState.status === "error"
                  ? "text-rose-700"
                  : "text-slate-500"
            }`}
          >
            {publicationState.message || "No publication change made yet."}
          </div>

          <button
            type="submit"
            disabled={publicationPending}
            className="premium-button-primary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {publicationPending
              ? "Updating..."
              : isPublished
                ? "Move back to draft"
                : "Publish in catalog"}
          </button>
        </form>
      </section>
    </div>
  );
}
