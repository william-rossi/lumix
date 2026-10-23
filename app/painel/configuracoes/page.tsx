import { connection } from "next/server";
import { notFound } from "next/navigation";
import { agencies } from "@/data/seed";
import { getAgencyById } from "@/lib/db/repository";
import { AgencySettingsForm } from "@/components/dashboard/agency-settings-form";

export const instant = false;

export default async function SettingsPage() {
  await connection();
  const agency = await getAgencyById(agencies[0].id);
  if (!agency) notFound();

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="border-b border-line pb-6">
        <div className="flex items-center gap-2.5">
          <span className="eyebrow text-muted">Conta</span>
          <span className="h-px w-7 bg-line-strong" />
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted/60">
            Conta demonstrativa
          </span>
        </div>
        <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-none text-ink">
          Configurações.
        </h1>
        <p className="mt-2 max-w-lg text-[12.5px] leading-relaxed text-muted">
          Dados da imobiliária, contato e endereço. Essas informações aparecem
          no perfil público e no rodapé de cada empreendimento.
        </p>
      </div>

      <div className="mt-6">
        <AgencySettingsForm agency={agency} />
      </div>
    </div>
  );
}
