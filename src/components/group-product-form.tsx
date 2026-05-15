'use client';

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  saveGroupProduct,
  type ProductFormState,
  type ProductFormValues,
} from "@/app/actions/save-group-product";

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
  priceCents: number;
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
};

function priceCentsToInputValue(priceCents: number | undefined): string {
  if (!priceCents) {
    return "";
  }

  return (priceCents / 100).toFixed(2).replace(".", ",");
}

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
    <form action={formAction} className="space-y-8" noValidate>
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
            1. Product identity
          </p>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Name and price
          </h2>
        </div>

        <div className="mt-6 grid gap-5">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-bold text-slate-900">
              Product name *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={values.title}
              onChange={(event) => updateTextField("title", event.target.value)}
              placeholder="Example: SmartBottle Campus"
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
            <div className="space-y-2">
              <label htmlFor="categoryId" className="block text-sm font-bold text-slate-900">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={values.categoryId}
                onChange={(event) =>
                  updateTextField("categoryId", event.target.value)
                }
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
              >
                <option value="">No category selected</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="priceEuro" className="block text-sm font-bold text-slate-900">
                Price *
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base font-bold text-slate-500">
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
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
            2. Optional presentation
          </p>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Description and features
          </h2>
        </div>

        <div className="mt-6 grid gap-6">
          <div className="space-y-2">
            <label
              htmlFor="shortDescription"
              className="block text-sm font-bold text-slate-900"
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
              className="min-h-28 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-bold text-slate-900">
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
              className="min-h-48 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
            />
          </div>

          <fieldset className="space-y-4">
            <legend className="text-sm font-bold text-slate-900">
              Main features
            </legend>
            <p className="text-sm leading-6 text-slate-500">
              Optional. Add only the features that help explain the product.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {values.features.map((featureValue, index) => (
                <div key={`feature-${index + 1}`} className="space-y-2">
                  <label
                    htmlFor={`feature${index + 1}`}
                    className="block text-sm font-semibold text-slate-700"
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
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  />
                </div>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
            3. Optional positioning
          </p>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Product badges
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            Select any badges that help describe the product.
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
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white"
              >
                <input
                  type="checkbox"
                  name="badgeIds"
                  value={badge.id}
                  checked={checked}
                  onChange={(event) =>
                    toggleBadge(badgeId, event.target.checked)
                  }
                  className="h-5 w-5 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
                />
                <span className="text-sm font-bold text-slate-800">
                  {badge.name}
                </span>
              </label>
            );
          })}
        </fieldset>
      </section>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div
          aria-live="polite"
          className={`min-h-7 text-sm font-bold ${
            state.status === "success"
              ? "text-emerald-700"
              : state.status === "error"
                ? "text-rose-700"
                : "text-slate-500"
          }`}
        >
          {state.message || "Enter the required fields and save your product draft."}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-500">
            Only product name and price are required.
          </p>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {pending ? "Saving..." : "Save product draft"}
          </button>
        </div>
      </div>
    </form>
  );
}