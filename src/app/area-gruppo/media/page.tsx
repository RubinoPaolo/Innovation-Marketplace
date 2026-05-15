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
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-12">
        <section className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
              Group area · media and publishing
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Manage images and catalog publication
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Upload product visuals and decide whether the product should appear in the shared catalog.
            </p>
          </div>

          {!product ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 shadow-sm sm:p-12">
              <div className="max-w-3xl space-y-4">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                  Product draft required
                </p>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">
                  Save a product draft before managing images or publishing
                </h2>
                <p className="text-base leading-8 text-slate-600">
                  The platform needs at least the product name and price before images and publication can be linked to your group.
                </p>
                <Link
                  href="/area-gruppo"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
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
