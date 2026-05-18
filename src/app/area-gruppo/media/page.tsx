import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductMediaManager } from "@/components/product-media-manager";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";
import { getCurrentStudentSession } from "@/lib/student-session";

export default async function GroupMediaPage() {
  const currentSession = await getCurrentStudentSession();

  if (!currentSession) {
    redirect("/");
  }

  const product = await prisma.product.findUnique({
    where: {
      groupId: currentSession.member.groupId,
    },
    select: {
      title: true,
      status: true,
      images: {
        select: {
          id: true,
          imageUrl: true,
          altText: true,
          isCover: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  return (
    <div className="premium-page min-h-screen text-slate-950">
      <SiteHeader />

      <main className="premium-shell py-8 sm:py-10 lg:py-12">
        <section className="space-y-8">
          <div className="flex flex-col gap-5">
            <Link
              href="/area-gruppo"
              className="premium-button-secondary inline-flex h-11 w-fit items-center justify-center rounded-full px-5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
            >
              Back to group area
            </Link>

            <div className="premium-hero rounded-[2.4rem] px-5 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
              <div className="relative z-10 max-w-4xl space-y-4">
                <p className="premium-kicker">Group area · media and publishing</p>

                <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Manage images and catalog publication.
                </h1>

                <p className="max-w-3xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                  Upload product visuals, choose the cover image and decide whether the product should appear in the shared catalog.
                </p>
              </div>
            </div>
          </div>

          {!product ? (
            <div className="premium-surface-strong rounded-[2.2rem] p-6 sm:p-10 lg:p-12">
              <div className="max-w-3xl space-y-5">
                <p className="premium-kicker">Product draft required</p>
                <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
                  Save a product draft before managing images or publishing.
                </h2>
                <p className="text-base font-medium leading-8 text-slate-600">
                  The platform needs at least the product name and price before images and publication can be linked to your group.
                </p>
                <Link
                  href="/area-gruppo"
                  className="premium-button-primary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                >
                  Go to group area
                </Link>
              </div>
            </div>
          ) : (
            <ProductMediaManager
              productTitle={product.title}
              productStatus={product.status}
              images={product.images}
            />
          )}
        </section>
      </main>
    </div>
  );
}
