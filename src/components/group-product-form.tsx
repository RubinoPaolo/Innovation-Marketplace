'use client';

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  saveGroupProduct,
  type ProductFormState,
  type ProductFormValues,
} from "@/app/actions/save-group-product";
import { GroupProductWithdrawButton } from "@/components/group-product-withdraw-button";
import { priceCentsToInputValue } from "@/lib/price";

type CategoryOption = {
  id: number;
  name: string;
};

type BadgeOption = {
  id: number;
  name: string;
};

type ExistingProduct = {
  title: string;
  shortDescription: string | null;
  description: string | null;
  priceCents: string;
  categoryId: number | null;
  features: Array<{
    text: string;
  }>;
  badgeIds: number[];
} | null;

type GroupProductFormProps = {
  categories: CategoryOption[];
  badges: BadgeOption[];
  product: ExistingProduct;
  publishedProductTitle: string | null;
};

const productDraftFormId = "group-product-draft-form";

function buildInitialValues(product: ExistingProduct): ProductFormValues {
  return {
    title: product?.title ?? "",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    priceEuro: priceCentsToInputValue(product?.priceCents),
    categoryId: product?.categoryId ? String(product.categoryId) : "",
    features: [0, 1, 2, 3, 4].map(
      (index) => product?.features[index]?.text ?? "",
    ),
    badgeIds: product?.badgeIds.map((badgeId) => String(badgeId)) ?? [],
  };
}

export function GroupProductForm({
  categories,
  badges,
  product,
  publishedProductTitle,
}: GroupProductFormProps) {
  const initialValues = useMemo(() => buildInitialValues(product), [product]);

  const initialState: ProductFormState = {
    status: "idle",
    message: "",
    values: initialValues,
  };

  const [state, formAction, pending] = useActionState(
    saveGroupProduct,
    initialState,
  );

  const [values, setValues] = useState<ProductFormValues>(initialValues);

  useEffect(() => {
    setValues(state.values);
  }, [state.values]);

  function updateTextField(
    field:
      | "title"
      | "shortDescription"
      | "description"
      | "priceEuro"
      | "categoryId",
    value: string,
  ) {
    setValues((previousValues) => ({
      ...previousValues,
      [field]: value,
    }));
  }

  function updateFeature(index: number, value: string) {
    setValues((previousValues) => ({
      ...previousValues,
      features: previousValues.features.map((feature, featureIndex) =>
        featureIndex === index ? value : feature,
      ),
    }));
  }

  function toggleBadge(badgeId: string, checked: boolean) {
    setValues((previousValues) => {
      const alreadySelected = previousValues.badgeIds.includes(badgeId);

      if (checked && !alreadySelected) {
        return {
          ...previousValues,
          badgeIds: [...previousValues.badgeIds, badgeId],
        };
      }

      if (!checked && alreadySelected) {
        return {
          ...previousValues,
          badgeIds: previousValues.badgeIds.filter(
            (selectedBadgeId) => selectedBadgeId !== badgeId,
          ),
        };
      }

      return previousValues;
    });
  }

  return (
    <div className="space-y-6">
      <form
        id={productDraftFormId}
        action={formAction}
        className="space-y-6"
        noValidate
      >
        <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="premium-kicker">1. Product identity</p>
              <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
                Name, category and price.
              </h2>
            </div>

            <div className="premium-chip rounded-full px-4 py-2 text-sm font-black text-slate-600">
              Required: name and price
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            <div className="space-y-2.5">
              <label
                htmlFor="title"
                className="block text-sm font-black text-slate-900"
              >
                Product name *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={values.title}
                onChange={(event) =>
                  updateTextField("title", event.target.value)
                }
                placeholder="Example: SmartBottle Campus"
                className="h-13 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-2.5">
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-black text-slate-900"
                >
                  Category
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={values.categoryId}
                  onChange={(event) =>
                    updateTextField("categoryId", event.target.value)
                  }
                  className="h-13 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">No category selected</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="priceEuro"
                  className="block text-sm font-black text-slate-900"
                >
                  Price *
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base font-black text-slate-500">
                    €
                  </span>
                  <input
                    id="priceEuro"
                    name="priceEuro"
                    type="text"
                    inputMode="decimal"
                    required
                    value={values.priceEuro}
                    onChange={(event) =>
                      updateTextField("priceEuro", event.target.value)
                    }
                    placeholder="29,90"
                    className="h-13 w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <p className="text-xs font-semibold leading-5 text-slate-500">
                  Enter numbers only, without the € symbol and without
                  thousands separators.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
          <div className="space-y-3">
            <p className="premium-kicker">2. Product presentation</p>
            <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
              Description and key features.
            </h2>
          </div>

          <div className="mt-6 grid gap-6">
            <div className="space-y-2.5">
              <label
                htmlFor="shortDescription"
                className="block text-sm font-black text-slate-900"
              >
                Short description
              </label>
              <textarea
                id="shortDescription"
                name="shortDescription"
                value={values.shortDescription}
                onChange={(event) =>
                  updateTextField("shortDescription", event.target.value)
                }
                placeholder="Optional short product summary."
                className="min-h-28 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-2.5">
              <label
                htmlFor="description"
                className="block text-sm font-black text-slate-900"
              >
                Full description
              </label>
              <textarea
                id="description"
                name="description"
                value={values.description}
                onChange={(event) =>
                  updateTextField("description", event.target.value)
                }
                placeholder="Optional detailed description of the product."
                className="min-h-48 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <fieldset className="premium-muted space-y-4 rounded-[1.8rem] p-4 sm:p-5">
              <legend className="px-1 text-sm font-black text-slate-900">
                Main features
              </legend>
              <p className="text-sm font-medium leading-6 text-slate-500">
                Optional. Add only the features that help explain the product.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {values.features.map((featureValue, index) => (
                  <div key={`feature-${index + 1}`} className="space-y-2.5">
                    <label
                      htmlFor={`feature${index + 1}`}
                      className="block text-sm font-bold text-slate-700"
                    >
                      Feature {index + 1}
                    </label>
                    <input
                      id={`feature${index + 1}`}
                      name={`feature${index + 1}`}
                      type="text"
                      value={featureValue}
                      onChange={(event) =>
                        updateFeature(index, event.target.value)
                      }
                      placeholder="Optional feature"
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        </section>

        <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
          <div className="space-y-3">
            <p className="premium-kicker">3. Optional positioning</p>
            <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
              Product badges.
            </h2>
            <p className="max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
              Select the badges that best help students understand the product
              positioning.
            </p>
          </div>

          <fieldset className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <legend className="sr-only">Selectable product badges</legend>
            {badges.map((badge) => {
              const badgeId = String(badge.id);
              const checked = values.badgeIds.includes(badgeId);

              return (
                <label
                  key={badge.id}
                  className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    checked
                      ? "border-blue-300 bg-blue-50 shadow-sm shadow-blue-900/5"
                      : "border-slate-200 bg-white/78 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="badgeIds"
                    value={badge.id}
                    checked={checked}
                    onChange={(event) =>
                      toggleBadge(badgeId, event.target.checked)
                    }
                    className="h-5 w-5 rounded border-slate-300 text-slate-950 focus:ring-blue-200"
                  />
                  <span className="text-sm font-black text-slate-800">
                    {badge.name}
                  </span>
                </label>
              );
            })}
          </fieldset>
        </section>
      </form>

      <div className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
        <div
          aria-live="polite"
          className={`min-h-7 text-sm font-black ${
            state.status === "success"
              ? "text-emerald-700"
              : state.status === "error"
                ? "text-rose-700"
                : "text-slate-500"
          }`}
        >
          {state.message ||
            "Enter the required fields and save your product draft."}
        </div>

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <p className="text-sm font-medium leading-6 text-slate-500">
            Only product name and price are required.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
            <Link
              href="/area-gruppo/media"
              className="premium-button-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
            >
              Manage images and publishing
            </Link>

            {publishedProductTitle ? (
              <GroupProductWithdrawButton productTitle={publishedProductTitle} />
            ) : null}

            <button
              type="submit"
              form={productDraftFormId}
              disabled={pending}
              className="premium-button-primary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving..." : "Save product draft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}