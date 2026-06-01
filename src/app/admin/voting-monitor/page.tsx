import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getActiveCourseEdition } from "@/lib/active-edition";

type VotingMonitorFilter =
  | "all"
  | "incomplete"
  | "missing-group-vote"
  | "missing-members";

type AdminVotingMonitorPageProps = {
  searchParams?: Promise<{
    filter?: string | string[];
  }>;
};

function parseFilter(value: string | string[] | undefined): VotingMonitorFilter {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (
    normalizedValue === "incomplete" ||
    normalizedValue === "missing-group-vote" ||
    normalizedValue === "missing-members"
  ) {
    return normalizedValue;
  }

  return "all";
}

function formatDateTime(date: Date | null | undefined): string {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPercentage(completed: number, total: number): string {
  if (total <= 0) {
    return "0%";
  }

  return (
    new Intl.NumberFormat("en-GB", {
      maximumFractionDigits: 1,
    }).format((completed / total) * 100) + "%"
  );
}

function getCompletionBadgeClasses(isComplete: boolean): string {
  return isComplete
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
}

function getMemberBadgeClasses(hasVoted: boolean): string {
  return hasVoted
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-rose-200 bg-rose-50 text-rose-800";
}

function getFilterHref(filter: VotingMonitorFilter): string {
  return `/admin/voting-monitor?filter=${filter}`;
}

export default async function AdminVotingMonitorPage({
  searchParams,
}: AdminVotingMonitorPageProps) {
  const [adminSession, activeEdition] = await Promise.all([
    getCurrentAdminSession(),
    getActiveCourseEdition(),
  ]);

  if (!adminSession) {
    redirect("/admin");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedFilter = parseFilter(resolvedSearchParams?.filter);

  if (!activeEdition) {
    return (
      <main className="premium-page min-h-screen text-slate-950">
        <section className="premium-shell space-y-6 py-8 sm:py-10 lg:py-12">
          <Link
            href="/admin"
            className="premium-button-secondary inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
          >
            Back to admin dashboard
          </Link>

          <div className="rounded-[2.2rem] border border-rose-200 bg-rose-50/92 p-6 shadow-sm shadow-rose-900/5 sm:p-8">
            <p className="premium-kicker text-rose-700">
              Configuration required
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl">
              No active course edition is configured.
            </h1>
            <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-slate-700">
              The voting monitor is available only when a course edition is
              active.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const groups = await prisma.group.findMany({
    where: {
      editionId: activeEdition.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      product: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      purchaseInterestsCast: {
        select: {
          id: true,
          decision: true,
          reason: true,
          createdAt: true,
          updatedAt: true,
          member: {
            select: {
              studentNumber: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
              group: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          {
            updatedAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
      members: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          studentNumber: true,
          featureRatings: {
            select: {
              id: true,
              rating: true,
              updatedAt: true,
              feature: {
                select: {
                  text: true,
                  product: {
                    select: {
                      id: true,
                      title: true,
                      group: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
          productQuestionRatings: {
            select: {
              id: true,
              rating: true,
              updatedAt: true,
              question: {
                select: {
                  key: true,
                  prompt: true,
                },
              },
              product: {
                select: {
                  id: true,
                  title: true,
                  group: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
        orderBy: {
          studentNumber: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const monitoredGroups = groups.map((group) => {
    const members = group.members.map((member) => {
      const featureRatingsCount = member.featureRatings.length;
      const evaluationRatingsCount = member.productQuestionRatings.length;
      const totalIndividualVotes =
        featureRatingsCount + evaluationRatingsCount;

      return {
        ...member,
        featureRatingsCount,
        evaluationRatingsCount,
        totalIndividualVotes,
        hasIndividualVote: totalIndividualVotes > 0,
      };
    });

    const membersWhoVoted = members.filter(
      (member) => member.hasIndividualVote,
    ).length;

    const missingMembers = members.length - membersWhoVoted;
    const hasGroupVote = group.purchaseInterestsCast.length > 0;

    return {
      ...group,
      members,
      hasGroupVote,
      membersWhoVoted,
      missingMembers,
      individualCompletionRate: formatPercentage(membersWhoVoted, members.length),
      isComplete: hasGroupVote && missingMembers === 0,
    };
  });

  const totalGroups = monitoredGroups.length;
  const groupsWithGroupVote = monitoredGroups.filter(
    (group) => group.hasGroupVote,
  ).length;
  const groupsMissingGroupVote = totalGroups - groupsWithGroupVote;
  const totalMembers = monitoredGroups.reduce(
    (sum, group) => sum + group.members.length,
    0,
  );
  const membersWhoVoted = monitoredGroups.reduce(
    (sum, group) => sum + group.membersWhoVoted,
    0,
  );
  const membersMissing = totalMembers - membersWhoVoted;

  const filteredGroups = monitoredGroups.filter((group) => {
    if (selectedFilter === "incomplete") {
      return !group.isComplete;
    }

    if (selectedFilter === "missing-group-vote") {
      return !group.hasGroupVote;
    }

    if (selectedFilter === "missing-members") {
      return group.missingMembers > 0;
    }

    return true;
  });

  const filterOptions: Array<{
    key: VotingMonitorFilter;
    label: string;
    description: string;
  }> = [
    {
      key: "all",
      label: "Show all",
      description: "All active groups",
    },
    {
      key: "incomplete",
      label: "Only incomplete groups",
      description: "Missing group vote or individual votes",
    },
    {
      key: "missing-group-vote",
      label: "Missing group vote",
      description: "Groups without Yes/No group vote",
    },
    {
      key: "missing-members",
      label: "Missing individual votes",
      description: "Groups with at least one member missing",
    },
  ];

  return (
    <main className="premium-page min-h-screen text-slate-950">
      <section className="premium-shell space-y-8 py-8 sm:py-10 lg:py-12">
        <div className="premium-hero rounded-[2.4rem] px-5 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/admin"
                  className="premium-button-secondary inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
                >
                  Back to admin dashboard
                </Link>

                <span className="premium-chip inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-slate-700">
                  {activeEdition.name}
                </span>
              </div>

              <p className="premium-kicker">Voting monitor</p>
              <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                Operational voting progress by group.
              </h1>
              <p className="max-w-3xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                Monitor which groups have already submitted their shared
                Yes/No product votes and which individual members have submitted
                at least one star rating.
              </p>
            </div>

            <Link
              href="/admin/voting-monitor"
              className="premium-button-primary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80"
            >
              Refresh monitor
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <article className="premium-stat-card rounded-[1.8rem] p-5">
            <p className="relative z-10 text-sm font-bold text-slate-500">
              Total groups
            </p>
            <p className="relative z-10 mt-4 text-3xl font-black tracking-tight text-slate-950">
              {totalGroups}
            </p>
          </article>

          <article className="premium-stat-card rounded-[1.8rem] p-5">
            <p className="relative z-10 text-sm font-bold text-slate-500">
              Group vote completed
            </p>
            <p className="relative z-10 mt-4 text-3xl font-black tracking-tight text-emerald-700">
              {groupsWithGroupVote}
            </p>
          </article>

          <article className="premium-stat-card rounded-[1.8rem] p-5">
            <p className="relative z-10 text-sm font-bold text-slate-500">
              Group vote missing
            </p>
            <p className="relative z-10 mt-4 text-3xl font-black tracking-tight text-amber-700">
              {groupsMissingGroupVote}
            </p>
          </article>

          <article className="premium-stat-card rounded-[1.8rem] p-5">
            <p className="relative z-10 text-sm font-bold text-slate-500">
              Total members
            </p>
            <p className="relative z-10 mt-4 text-3xl font-black tracking-tight text-slate-950">
              {totalMembers}
            </p>
          </article>

          <article className="premium-stat-card rounded-[1.8rem] p-5">
            <p className="relative z-10 text-sm font-bold text-slate-500">
              Members voted
            </p>
            <p className="relative z-10 mt-4 text-3xl font-black tracking-tight text-emerald-700">
              {membersWhoVoted}
            </p>
          </article>

          <article className="premium-stat-card rounded-[1.8rem] p-5">
            <p className="relative z-10 text-sm font-bold text-slate-500">
              Members missing
            </p>
            <p className="relative z-10 mt-4 text-3xl font-black tracking-tight text-rose-700">
              {membersMissing}
            </p>
          </article>
        </section>

        <section className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8">
          <div className="space-y-3">
            <p className="premium-kicker">Filters</p>
            <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
              Focus the monitor view.
            </h2>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {filterOptions.map((option) => {
              const selected = option.key === selectedFilter;

              return (
                <Link
                  key={option.key}
                  href={getFilterHref(option.key)}
                  className={`rounded-[1.5rem] border p-4 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/80 ${
                    selected
                      ? "border-blue-300 bg-blue-50 shadow-sm shadow-blue-900/10"
                      : "border-slate-200 bg-white/78 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <p className="text-sm font-black text-slate-950">
                    {option.label}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {option.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-5">
          {filteredGroups.length === 0 ? (
            <div className="premium-surface-strong rounded-[2.2rem] p-6 text-center sm:p-10">
              <p className="premium-kicker justify-center">No results</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-slate-950">
                No groups match this filter.
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Try selecting “Show all” to inspect the full active edition.
              </p>
            </div>
          ) : (
            filteredGroups.map((group) => {
              return (
                <details
                  key={group.id}
                  open={selectedFilter !== "all" || !group.isComplete}
                  className="premium-surface-strong rounded-[2.2rem] p-5 sm:p-7 lg:p-8"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="premium-kicker">
                            Group monitor
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getCompletionBadgeClasses(
                              group.hasGroupVote,
                            )}`}
                          >
                            Group vote{" "}
                            {group.hasGroupVote ? "completed" : "missing"}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getCompletionBadgeClasses(
                              group.missingMembers === 0,
                            )}`}
                          >
                            Individual votes{" "}
                            {group.missingMembers === 0
                              ? "completed"
                              : "missing"}
                          </span>
                        </div>

                        <h2 className="text-3xl font-black tracking-[-0.045em] text-slate-950">
                          {group.name}
                        </h2>

                        <p className="text-sm font-semibold leading-7 text-slate-600">
                          Product:{" "}
                          <span className="font-black text-slate-900">
                            {group.product?.title ?? "No product created yet"}
                          </span>
                          {group.product ? (
                            <>
                              {" "}
                              · Status:{" "}
                              <span className="font-black text-slate-900">
                                {group.product.status}
                              </span>
                            </>
                          ) : null}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[34rem]">
                        <div className="premium-muted rounded-[1.3rem] p-4">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Members
                          </p>
                          <p className="mt-2 text-2xl font-black text-slate-950">
                            {group.members.length}
                          </p>
                        </div>

                        <div className="premium-muted rounded-[1.3rem] p-4">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Voted
                          </p>
                          <p className="mt-2 text-2xl font-black text-emerald-700">
                            {group.membersWhoVoted}
                          </p>
                        </div>

                        <div className="premium-muted rounded-[1.3rem] p-4">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Missing
                          </p>
                          <p className="mt-2 text-2xl font-black text-rose-700">
                            {group.missingMembers}
                          </p>
                        </div>

                        <div className="premium-muted rounded-[1.3rem] p-4">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Completion
                          </p>
                          <p className="mt-2 text-2xl font-black text-slate-950">
                            {group.individualCompletionRate}
                          </p>
                        </div>
                      </div>
                    </div>
                  </summary>

                  <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <section className="premium-muted rounded-[1.8rem] p-5">
                      <div className="space-y-3">
                        <p className="premium-kicker">Group votes</p>
                        <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                          Shared Yes/No votes registered by this group.
                        </h3>
                      </div>

                      {group.purchaseInterestsCast.length === 0 ? (
                        <div className="mt-5 rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900">
                          No group Yes/No vote has been registered yet.
                        </div>
                      ) : (
                        <div className="mt-5 overflow-x-auto">
                          <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                            <thead>
                              <tr className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                <th className="px-3 py-2">Product</th>
                                <th className="px-3 py-2">Decision</th>
                                <th className="px-3 py-2">Last edited by</th>
                                <th className="px-3 py-2">Updated</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.purchaseInterestsCast.map((vote) => (
                                <tr
                                  key={vote.id}
                                  className="rounded-2xl bg-white/80 shadow-sm shadow-slate-900/5"
                                >
                                  <td className="rounded-l-2xl px-3 py-3 font-bold text-slate-900">
                                    <div>{vote.product.title}</div>
                                    <div className="mt-1 text-xs font-semibold text-slate-500">
                                      Product group: {vote.product.group.name}
                                    </div>
                                    {vote.reason?.trim() ? (
                                      <div className="mt-2 text-xs font-medium leading-5 text-slate-600">
                                        Reason: {vote.reason}
                                      </div>
                                    ) : null}
                                  </td>
                                  <td className="px-3 py-3">
                                    <span
                                      className={`rounded-full border px-3 py-1 text-xs font-black ${
                                        vote.decision === "YES"
                                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                          : "border-rose-200 bg-rose-50 text-rose-800"
                                      }`}
                                    >
                                      {vote.decision}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 font-semibold text-slate-700">
                                    {vote.member?.studentNumber ??
                                      "Not available"}
                                  </td>
                                  <td className="rounded-r-2xl px-3 py-3 font-semibold text-slate-600">
                                    {formatDateTime(vote.updatedAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>

                    <section className="premium-muted rounded-[1.8rem] p-5">
                      <div className="space-y-3">
                        <p className="premium-kicker">Member votes</p>
                        <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                          Individual star-rating activity.
                        </h3>
                      </div>

                      {group.members.length === 0 ? (
                        <div className="mt-5 rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900">
                          No active members are currently assigned to this group.
                        </div>
                      ) : (
                        <div className="mt-5 overflow-x-auto">
                          <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                            <thead>
                              <tr className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                <th className="px-3 py-2">Member</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Votes</th>
                                <th className="px-3 py-2">Detail</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.members.map((member) => (
                                <tr
                                  key={member.id}
                                  className="rounded-2xl bg-white/80 shadow-sm shadow-slate-900/5"
                                >
                                  <td className="rounded-l-2xl px-3 py-3">
                                    <div className="font-black text-slate-950">
                                      {member.studentNumber}
                                    </div>
                                    <div className="mt-1 text-xs font-semibold text-slate-500">
                                      Student ID
                                    </div>
                                  </td>
                                  <td className="px-3 py-3">
                                    <span
                                      className={`rounded-full border px-3 py-1 text-xs font-black ${getMemberBadgeClasses(
                                        member.hasIndividualVote,
                                      )}`}
                                    >
                                      {member.hasIndividualVote
                                        ? "Has voted"
                                        : "Not voted"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 font-semibold text-slate-700">
                                    <div>
                                      Feature ratings:{" "}
                                      <span className="font-black">
                                        {member.featureRatingsCount}
                                      </span>
                                    </div>
                                    <div>
                                      Evaluation ratings:{" "}
                                      <span className="font-black">
                                        {member.evaluationRatingsCount}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="rounded-r-2xl px-3 py-3">
                                    {member.hasIndividualVote ? (
                                      <div className="space-y-3 text-xs leading-5 text-slate-700">
                                        {member.featureRatings.length > 0 ? (
                                          <div>
                                            <p className="font-black text-slate-900">
                                              Feature ratings
                                            </p>
                                            <ul className="mt-1 space-y-1">
                                              {member.featureRatings.map(
                                                (rating) => (
                                                  <li key={rating.id}>
                                                    {rating.feature.product.title}{" "}
                                                    · {rating.feature.text} ·{" "}
                                                    <span className="font-black">
                                                      {rating.rating}/5
                                                    </span>
                                                  </li>
                                                ),
                                              )}
                                            </ul>
                                          </div>
                                        ) : null}

                                        {member.productQuestionRatings.length >
                                        0 ? (
                                          <div>
                                            <p className="font-black text-slate-900">
                                              Evaluation ratings
                                            </p>
                                            <ul className="mt-1 space-y-1">
                                              {member.productQuestionRatings.map(
                                                (rating) => (
                                                  <li key={rating.id}>
                                                    {rating.product.title} ·{" "}
                                                    {rating.question.prompt} ·{" "}
                                                    <span className="font-black">
                                                      {rating.rating}/5
                                                    </span>
                                                  </li>
                                                ),
                                              )}
                                            </ul>
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : (
                                      <span className="text-xs font-semibold text-slate-500">
                                        No individual star rating has been
                                        recorded for this member.
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  </div>
                </details>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}