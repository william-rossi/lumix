import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a Lumix coleta, utiliza e protege dados pessoais de visitantes, compradores e imobiliárias, em conformidade com a LGPD.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacidade"
      title="Seus dados, com a mesma transparência da maquete."
      intro="Esta política descreve como a Lumix Tecnologia Ltda. trata dados pessoais na plataforma de empreendimentos em 3D, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)."
      updatedAt="outubro de 2026"
      sections={[
        {
          title: "Quais dados coletamos",
          paragraphs: [
            "Dados de navegação: páginas visitadas, empreendimentos e unidades consultados, tipo de dispositivo, navegador, endereço IP e identificadores de sessão. Usamos essas informações para operar a plataforma, medir desempenho e prevenir abusos.",
            "Dados fornecidos por você: nome, e-mail, telefone e mensagem enviados em formulários de contato ou de interesse em uma unidade. No cadastro de imobiliárias, também coletamos dados da empresa, CRECI, endereço e informações de cobrança.",
            "No ambiente de demonstração, a sessão do painel é mantida apenas no seu navegador (localStorage) e não autentica acesso a dados de terceiros.",
          ],
        },
        {
          title: "Como usamos os dados",
          paragraphs: [
            "Para conectar seu interesse à imobiliária responsável pelo empreendimento, responder solicitações, enviar atualizações sobre o projeto e cumprir obrigações legais ou regulatórias.",
            "Para melhorar a experiência de navegação 3D, entender quais recursos são utilizados e corrigir problemas técnicos. Não utilizamos dados de leads para publicidade de terceiros.",
            "A base legal varia conforme o contexto: execução de contrato ou procedimentos preliminares, consentimento, legítimo interesse na operação da plataforma e cumprimento de obrigação legal.",
          ],
        },
        {
          title: "Compartilhamento",
          paragraphs: [
            "Os dados de contato e a unidade de interesse são compartilhados com a imobiliária responsável pelo empreendimento, que passa a atuar como controladora independente para o atendimento comercial.",
            "Utilizamos provedores de infraestrutura, armazenamento e comunicação estritamente necessários à operação. Esses fornecedores tratam dados sob instruções nossas e obrigações contratuais de confidencialidade.",
            "Não vendemos dados pessoais. Divulgações adicionais ocorrem apenas por obrigação legal, ordem judicial ou proteção de direitos.",
          ],
        },
        {
          title: "Armazenamento e segurança",
          paragraphs: [
            "Metadados de empreendimentos, unidades e leads são armazenados em banco MongoDB. Arquivos de maquete 3D (GLTF/GLB) são armazenados em bucket GridFS, com limite de 8 MB por arquivo, separados dos dados cadastrais.",
            "Adotamos controles de acesso, validação de arquivos e registros de operação. Nenhum sistema é absolutamente imune a incidentes; caso ocorra um incidente relevante, comunicaremos titulares e autoridades conforme a LGPD.",
            "Dados de leads são mantidos pelo tempo necessário ao atendimento e às obrigações legais. Registros de acesso são preservados pelos prazos exigidos pelo Marco Civil da Internet.",
          ],
        },
        {
          title: "Cookies e tecnologias similares",
          paragraphs: [
            "Utilizamos cookies estritamente necessários para manter a sessão e preferências de interface. Métricas agregadas podem usar armazenamento local para evitar contagens duplicadas.",
            "Você pode bloquear cookies nas configurações do navegador. Isso pode afetar recursos de navegação 3D, formulários e preferências de visualização.",
          ],
        },
        {
          title: "Seus direitos",
          paragraphs: [
            "Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação de dados tratados com consentimento, informação sobre compartilhamentos e revisão de decisões automatizadas.",
            "Para exercer seus direitos, escreva para privacidade@lumix.com.br. Responderemos nos prazos da LGPD. O titular também pode peticionar à Autoridade Nacional de Proteção de Dados (ANPD).",
            "Se você é lead de uma imobiliária, parte dos dados pode estar sob controle dela. Nesse caso, encaminharemos sua solicitação e colaboraremos para a resposta.",
          ],
        },
        {
          title: "Alterações nesta política",
          paragraphs: [
            "Podemos atualizar esta política para refletir mudanças no produto, na legislação ou nos fornecedores. A versão vigente estará sempre nesta página, com a data de atualização indicada no topo.",
            "Mudanças materiais serão comunicadas por e-mail ou aviso na plataforma quando houver base de contato ativa.",
          ],
        },
      ]}
    />
  );
}
