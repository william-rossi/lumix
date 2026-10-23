import { connection } from "next/server";
import { agencies } from "@/data/seed";
import { listDevelopments, listLeads } from "@/lib/db/repository";
import { LeadBoard } from "@/components/dashboard/lead-board";

export const instant = false;

export default async function LeadsPage() {
  await connection();
  const agency = agencies[0];
  const agencyDevelopments = await listDevelopments({
    agencyId: agency.id,
    includeDrafts: true,
  });
  const developmentIds = new Set(
    agencyDevelopments.map((development) => development.id),
  );
  const agencyLeads = (await listLeads())
    .filter((lead) => developmentIds.has(lead.developmentId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const newLeads = agencyLeads.filter((lead) => lead.status === "new").length;
  const won = agencyLeads.filter((lead) => lead.status === "closed_won").length;
  const visits = agencyLeads.filter((lead) => lead.status === "visiting").length;

  return (
    <div className="mx-auto max-w-[1360px]">
      <div className="flex flex-col justify-between gap-5 border-b border-line pb-6 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="eyebrow text-muted">Relacionamento</span>
            <span className="h-px w-7 bg-line-strong" />
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
              {agencyLeads.length} leads
            </span>
          </div>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-none text-ink">
            Cada contato importa.
          </h1>
          <p className="mt-2 max-w-lg text-[12.5px] leading-relaxed text-muted">
            Leads capturados pela página pública, com unidade de interesse,
            mensagem e status do atendimento. Mova o funil daqui.
          </p>
        </div>

        <dl className="grid shrink-0 grid-cols-3 gap-2">
          {[
            ["Novos", newLeads],
            ["Em visita", visits],
            ["Ganhos", won],
          ].map(([label, value]) => (
            <div key={label} className="border border-line bg-paper-raised px-3 py-2.5">
              <dt className="font-mono text-[7px] uppercase tracking-[0.12em] text-muted/60">
                {label}
              </dt>
              <dd className="mt-1 font-display text-xl leading-none text-ink">
                {String(value).padStart(2, "0")}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <LeadBoard leads={agencyLeads} developments={agencyDevelopments} />
    </div>
  );
}
