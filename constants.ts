import { CertificateCategory, CertificateDefinition } from './types';

export const CERTIFICATE_DEFINITIONS: CertificateDefinition[] = [
  {
    id: 'situacao-cadastral-cnpj',
    name: 'Situação Cadastral CNPJ',
    url: 'https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/cnpjreva_solicitacao.asp',
    category: CertificateCategory.FEDERAL,
  },
  {
    id: 'crf-fgts',
    name: 'CRF do FGTS',
    url: 'https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf',
    category: CertificateCategory.FEDERAL,
  },
  {
    id: 'cnd-estadual-sp',
    name: 'CND Estadual SP (ICMS/IPVA)',
    url: 'https://www10.fazenda.sp.gov.br/CertidaoNegativaDeb/Pages/EmissaoCertidaoNegativa.aspx',
    category: CertificateCategory.ESTADUAL,
  },
  {
    id: 'certidao-conjunta-federal',
    name: 'Certidão Conjunta Federal',
    url: 'https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cnpj',
    category: CertificateCategory.FEDERAL,
  },
  {
    id: 'cndt-trabalhista',
    name: 'CNDT (Trabalhista)',
    url: 'https://cndt-certidao.tst.jus.br/inicio.faces',
    category: CertificateCategory.TRABALHISTA,
  },
  {
    id: 'cadin-estadual-sp',
    name: 'CADIN Estadual SP',
    url: 'https://www.fazenda.sp.gov.br/cadin_estadual/pages/publ/cadin.aspx',
    category: CertificateCategory.ESTADUAL,
  },
  {
    id: 'improbidade-administrativa',
    name: 'Improbidade Administrativa (CNJ)',
    url: 'https://www.cnj.jus.br/improbidade_adm/consultar_requerido.php',
    category: CertificateCategory.JUDICIAL,
  },
  {
    id: 'divida-ativa-estadual-sp',
    name: 'Dívida Ativa Estadual SP',
    url: 'https://www.dividaativa.pge.sp.gov.br/sc/pages/crda/emitirCrda.jsf',
    category: CertificateCategory.ESTADUAL,
  },
  {
    id: 'cadin-municipal-sp',
    name: 'CADIN Municipal SP',
    url: 'https://www3.prefeitura.sp.gov.br/cadin/Pesq_Deb.aspx',
    category: CertificateCategory.MUNICIPAL,
  },
  {
    id: 'falencia-concordata-tjsp',
    name: 'Certidão de Falência/Concordata (TJSP)',
    url: 'https://esaj.tjsp.jus.br/sco/abrirCadastro.do',
    category: CertificateCategory.JUDICIAL,
  },
  {
    id: 'cadesp',
    name: 'CADESP (Situação Cadastral)',
    url: 'https://www.cadesp.fazenda.sp.gov.br/(S(z4l4j03rf1q4tpsgyous2i5g))/Pages/Cadastro/Consultas/ConsultaPublica/ConsultaPublica.aspx',
    category: CertificateCategory.ESTADUAL,
  },
  {
    id: 'tributos-mobiliarios-duc',
    name: 'Certidão de Tributos Mobiliários (DUC)',
    url: 'https://duc.prefeitura.sp.gov.br/certidoes/forms_anonimo/frmConsultaEmissaoCertificado.aspx',
    category: CertificateCategory.MUNICIPAL,
  },
  {
    id: 'ficha-dados-ccm',
    name: 'Ficha de Dados Cadastrais (CCM)',
    url: 'https://ccm.prefeitura.sp.gov.br/login/contribuinte?tipo=F',
    category: CertificateCategory.MUNICIPAL,
  },
];