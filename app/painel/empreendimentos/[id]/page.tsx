import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getAgencyById,
  getDevelopmentById,
} from "@/lib/db/repository";
import { DevelopmentEditor } from "@/components/dashboard/development-editor";

export default function EditDevelopmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EditorContent params={params} />
    </Suspense>
  );
}

async function EditorContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const development = await getDevelopmentById(id);
  if (!development) notFound();

  const agency = await getAgencyById(development.agencyId);
  if (!agency) notFound();

  return <DevelopmentEditor development={development} agency={agency} />;
}

function EditorSkeleton() {
  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="skeleton h-3 w-52" />
      <div className="skeleton mt-5 h-28 w-full" />
      <div className="skeleton mt-5 h-10 w-full" />
      <div className="skeleton mt-6 h-96 w-full" />
    </div>
  );
}
