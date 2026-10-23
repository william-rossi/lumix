import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Condições de uso da plataforma Lumix para visitantes e imobiliárias, incluindo maquetes 3D, anúncios, leads e responsabilidades.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Termos"
      title="Regras claras para uma experiência imobiliária melhor."
      intro="Estes termos regem o uso da plataforma Lumix por visitantes, compradores e imobiliárias. Ao navegar ou cadastrar um empreendimento, você concorda com as condições abaixo."
      updatedAt="outubro de 2026"
      sections={[
        {
          title: "A plataforma",
          paragraphs: [
            "A Lumix é uma plataforma de apresentação e descoberta de empreendimentos imobiliários, com maquetes 3D interativas, diretório público e painel para imobiliárias.",
            "A Lumix não é corretora, não intermedeia compra e venda e não recebe valores de unidades. Negociações, propostas, contratos e pagamentos ocorrem diretamente entre comprador e imobiliária ou incorporadora responsável.",
            "Informações de preço, disponibilidade, metragem e prazo são fornecidas pela imobiliária e podem mudar sem aviso. Confirme os dados com o corretor antes de tomar qualquer decisão.",
          ],
        },
        {
          title: "Conta de imobiliária",
          paragraphs: [
            "A imobiliária é responsável pela veracidade dos dados cadastrais, do CRECI, dos empreendimentos, das unidades e das mídias publicadas. É necessário ter autorização para anunciar cada projeto.",
            "O titular da conta deve manter credenciais seguras e responder por ações realizadas em sua conta. Em caso de uso não autorizado, comunique imediatamente suporte@lumix.com.br.",
            "Podemos solicitar documentos para verificar a regularidade da imobiliária e suspender anúncios que não atendam às exigências legais ou a estes termos.",
          ],
        },
        {
          title: "Maquetes e conteúdo 3D",
          paragraphs: [
            "A imobiliária declara possuir direitos ou licenças sobre os arquivos GLTF/GLB, imagens, plantas e textos enviados. A Lumix armazena esses arquivos para exibição na plataforma.",
            "Maquetes são representações ilustrativas. Acabamentos, mobiliário, paisagismo e proporções podem variar em relação à entrega final. A planta e o memorial descritivo registrados são os documentos vinculantes.",
            "É proibido enviar arquivos maliciosos, conteúdos de terceiros sem autorização ou modelos que exponham dados pessoais de forma indevida.",
          ],
        },
        {
          title: "Uso aceitável",
          paragraphs: [
            "Você concorda em não raspar, automatizar acessos, sobrecarregar a infraestrutura, burlar limites de upload, tentar acessar áreas restritas ou reproduzir a plataforma sem autorização.",
            "É vedado usar os canais de contato para spam, assédio, discriminação ou oferta de produtos não relacionados ao empreendimento consultado.",
            "Podemos remover conteúdo, limitar acessos e encerrar contas que violem estes termos ou a legislação aplicável.",
          ],
        },
        {
          title: "Leads e comunicação",
          paragraphs: [
            "Ao enviar um formulário, você autoriza o contato da imobiliária responsável sobre o empreendimento e a unidade de interesse. O atendimento pode ocorrer por e-mail, telefone ou WhatsApp.",
            "A imobiliária deve usar os dados do lead apenas para o atendimento relacionado ao interesse manifestado e cumprir a LGPD. A Lumix não autoriza revenda ou uso dos leads fora desse contexto.",
          ],
        },
        {
          title: "Planos e pagamentos",
          paragraphs: [
            "Recursos pagos, limites de armazenamento e quantidade de projetos são definidos no plano contratado. No ambiente de demonstração, não há cobrança e os limites exibidos são ilustrativos.",
            "Valores, renovação e cancelamento seguem a proposta comercial vigente. Falhas de pagamento podem suspender a publicação de empreendimentos, sem apagar dados imediatamente.",
          ],
        },
        {
          title: "Limitação de responsabilidade",
          paragraphs: [
            "A Lumix emprega esforços razoáveis para manter a plataforma disponível e segura, mas não garante operação ininterrupta ou ausência de erros. Manutenções programadas podem ocorrer.",
            "Na máxima extensão permitida pela lei, a Lumix não responde por negociações, informações incorretas fornecidas por imobiliárias, indisponibilidade de terceiros ou danos indiretos decorrentes do uso da plataforma.",
          ],
        },
        {
          title: "Legislação e foro",
          paragraphs: [
            "Estes termos são regidos pelas leis brasileiras. Eventuais controvérsias serão submetidas ao foro da comarca de São Paulo/SP, ressalvadas regras de proteção ao consumidor.",
            "Dúvidas sobre estes termos podem ser enviadas para juridico@lumix.com.br. A versão vigente é sempre a publicada nesta página.",
          ],
        },
      ]}
    />
  );
}
