// Termos de Uso e Política de Privacidade, português do Brasil. Tradução de
// cortesia da versão em inglês (src/lib/legal/en.ts), que prevalece. Precisa
// de revisão jurídica e de falantes nativos antes do lançamento.

import type { LegalContent } from "./document";

export const ptBR: LegalContent = {
  privacy: (o, f) => ({
    title: "Política de Privacidade",
    summary: "Este serviço ajuda você a transformar sua história de batismo ou seu testemunho em um cartão ou vídeo curto que você mesmo(a) baixa e compartilha. Ele foi feito para guardar o mínimo possível: sem contas, sem rastreamento, e sua história é apagada do nosso servidor assim que você baixa o seu arquivo.",
    sections: [
      {
        id: "short",
        heading: "Resumo",
        blocks: [
          {
            list: [
              "Sem conta, e-mail ou número de telefone. Nunca pedimos o seu nome verdadeiro.",
              `Sua história, suas gravações e seus arquivos são apagados do nosso servidor assim que você baixa o arquivo pronto, quando você apaga a história ou, no máximo, ${f.storyHours} horas depois de começar.`,
              "Não guardamos cópia, não publicamos sua história e não a mostramos a ninguém. Só você decide para onde o seu arquivo vai.",
              "O Google fornece a nossa hospedagem e, só se você permitir na tela, a transcrição, a tradução e uma voz sintética.",
              "Sem análise de audiência, publicidade, cookies de rastreamento ou gravação de sessão. Não vendemos nem compartilhamos suas informações pessoais.",
              "O serviço é para adultos de 18 anos ou mais nos Estados Unidos.",
            ],
          },
        ],
      },
      {
        id: "who",
        heading: "Quem somos",
        blocks: [
          `${o.name} ("nós") opera este serviço e é responsável pelas suas informações pessoais. Você pode falar conosco pelo e-mail {email} ou pelo correio no endereço ${o.address}.`,
        ],
      },
      {
        id: "collect",
        heading: "O que coletamos",
        blocks: [
          "Só o que você nos dá enquanto cria a sua história, além das informações técnicas que qualquer site recebe:",
          {
            list: [
              "Sua história: as palavras que você escreve ou edita, e qualquer gravação de voz ou vídeo que você faça ou envie.",
              "O que criamos a partir dela: uma transcrição em rascunho e suas correções, traduções e áudio sintético se você escolher, e o cartão ou vídeo que geramos.",
              "Suas escolhas: se é uma história de batismo ou um testemunho, seus idiomas, um nome opcional para exibir, o trecho escolhido, onde desfocar o seu rosto e a sua aprovação da versão final.",
              "Sua resposta de que tem 18 anos ou mais. Não pedimos sua data de nascimento.",
              "Um cookie essencial com um código de sessão aleatório, para o servidor saber qual história é sua. Ele não contém nada sobre você.",
              "Informações técnicas: seu endereço IP, o tipo de navegador e de aparelho, e o horário de cada solicitação, que o nosso provedor de hospedagem registra nos registros do servidor.",
            ],
          },
          "Não coletamos o seu nome (a menos que você o escreva na sua história), seus contatos, sua localização precisa nem identificadores de publicidade.",
        ],
      },
      {
        id: "sensitive",
        heading: "Informações sensíveis",
        blocks: [
          "Uma história de batismo ou um testemunho revela suas crenças religiosas, e uma gravação contém sua voz e talvez o seu rosto. Tratamos tudo isso como sensível. Usamos só para criar o arquivo que você pede, só depois que você decide começar uma história, e apagamos como explicado abaixo.",
          "Para desfocar o seu rosto, a detecção de rosto acontece no seu próprio aparelho; nosso servidor recebe só a posição da caixa a desfocar. Não usamos reconhecimento facial e não criamos impressões de voz, modelos faciais nem qualquer outro identificador biométrico.",
          "Sua história pode mencionar outras pessoas. Inclua só o que elas aceitariam; nossa tela de revisão aponta nomes, lugares e familiares para ajudar você a conferir.",
        ],
      },
      {
        id: "use",
        heading: "Como usamos",
        blocks: [
          {
            list: [
              "Para criar o cartão ou vídeo que você pede, mostrar uma prévia e entregar o arquivo pronto.",
              "Para manter o serviço seguro e funcionando, por exemplo para impedir abusos e corrigir erros, usando as informações técnicas dos registros do servidor.",
              "Para cumprir obrigações legais.",
            ],
          },
          "Não usamos sua história para marketing, publicidade ou criação de perfis, nem para treinar modelos de inteligência artificial.",
        ],
      },
      {
        id: "retention",
        heading: "Por quanto tempo guardamos",
        blocks: [
          {
            list: [
              `Sua história, suas escolhas e aprovações: apagadas quando você baixa o arquivo pronto, quando toca em "Apagar minha história" ou ${f.storyHours} horas depois de começar, o que acontecer primeiro.`,
              `Gravações, vídeos, áudio e arquivos gerados: apagados nesses mesmos momentos e, em qualquer caso, ${f.mediaHours} ${f.mediaHours === 1 ? "hora" : "horas"} depois de criados.`,
              `O cookie de sessão: expira depois de ${f.storyHours} horas.`,
              `Registros do servidor: guardados pelo nosso provedor de hospedagem por até ${f.logDays} dias e depois apagados.`,
            ],
          },
          "As histórias ficam só na memória de trabalho do servidor e em arquivos temporários, nunca em um banco de dados ou backup; por isso, reiniciar o servidor também as apaga. Depois de apagadas, não conseguimos recuperá-las. O arquivo que você baixa fica no seu aparelho, sob o seu controle.",
        ],
      },
      {
        id: "sharing",
        heading: "Quem recebe",
        blocks: [
          "O Google LLC, por meio do Google Cloud, é o nosso prestador de serviços. Ele hospeda o serviço e, só para as funções que você permite na tela, transforma gravações em texto (de um vídeo, só o som é enviado), traduz palavras e lê texto com uma voz sintética. O Google trata essas informações em nosso nome, de acordo com os termos de tratamento de dados do Google Cloud, que limitam o uso à prestação desses serviços para nós.",
          "Não vendemos suas informações pessoais nem as compartilhamos para publicidade direcionada, e não as entregamos a igrejas, ministérios ou outras organizações. Só divulgaríamos informações se a lei exigir e, como apagamos as histórias tão rápido, normalmente não há nada a divulgar.",
          "Quando você compartilha o seu arquivo pelo WhatsApp, Instagram ou outro aplicativo, vale a política de privacidade desse aplicativo, e quem receber pode copiar ou encaminhar. Não conseguimos recuperar um arquivo depois que você o compartilha.",
        ],
      },
      {
        id: "rights",
        heading: "Suas escolhas e direitos",
        blocks: [
          "Você tem o controle enquanto usa o serviço: pode escrever em vez de gravar, escolher sem voz, manter o idioma da sua história para nada ser traduzido, recusar as funções de idioma do Google e apagar a sua história a qualquer momento.",
          `Dependendo de onde você mora, você pode ter o direito de saber quais informações pessoais temos sobre você, obter uma cópia, corrigir, apagar e recusar a venda, a publicidade direcionada ou a criação de perfis. Oferecemos esses direitos a todas as pessoas nos Estados Unidos. Como não guardamos histórias nem contas, normalmente não temos nada que possa ser ligado a você, mas você pode pedir pelo e-mail {email}. Responderemos em até ${f.responseDays} dias e, se recusarmos um pedido, você pode recorrer respondendo à nossa resposta.`,
          "Não vendemos nem compartilhamos informações pessoais, então não há nada a recusar, e mesmo assim respeitamos os sinais do Global Privacy Control. Não trataremos você de forma diferente por usar qualquer um desses direitos.",
        ],
      },
      {
        id: "children",
        heading: "Só para adultos",
        blocks: [
          "O serviço é para adultos de 18 anos ou mais. Se você responder que tem menos de 18 anos, nenhuma história é criada e nada é enviado. Ele não é voltado a crianças ou adolescentes, e não coletamos intencionalmente informações de menores de 18 anos. Se você acha que um menor usou o serviço, fale conosco e apagaremos o que tivermos.",
        ],
      },
      {
        id: "security",
        heading: "Segurança",
        blocks: [
          "O serviço funciona com conexão criptografada (HTTPS). Cada história só pode ser aberta pela sessão do navegador que a criou, não temos nenhuma tela ou ferramenta para ver histórias, e guardar os dados por horas em vez de anos é a nossa melhor proteção. Nenhum sistema é perfeitamente seguro, então não inclua nada que possa prejudicar você se for exposto.",
        ],
      },
      {
        id: "location",
        heading: "Onde é processado",
        blocks: [
          "Executamos o serviço em servidores do Google Cloud nos Estados Unidos. O Google pode processar as funções de idioma em outros países onde atua, nos mesmos termos.",
        ],
      },
      {
        id: "changes",
        heading: "Mudanças nesta política",
        blocks: [
          "Se mudarmos esta política, publicaremos a nova versão aqui com uma nova data de vigência. Como não guardamos nada entre uma visita e outra, uma mudança vale para histórias começadas depois que ela entrar em vigor.",
        ],
      },
      {
        id: "contact",
        heading: "Contato",
        blocks: [`Dúvidas ou pedidos: {email}, ou ${o.name}, ${o.address}.`],
      },
    ],
  }),

  terms: (o, f) => ({
    title: "Termos de Uso",
    summary: `Estes termos são um acordo entre você e ${o.name}. Ao começar uma história, você os aceita. Leia também a nossa {privacy}.`,
    sections: [
      {
        id: "service",
        heading: "O serviço",
        blocks: [
          `O serviço ajuda você a contar sua história de batismo ou seu testemunho com as suas palavras e transformá-lo em um cartão ou vídeo curto que você baixa. É gratuito e não precisa de conta. Apagamos sua história e tudo o que foi criado a partir dela quando você baixa o arquivo, quando você a apaga ou ${f.storyHours} horas depois de começar, e histórias apagadas não podem ser recuperadas.`,
        ],
      },
      {
        id: "eligibility",
        heading: "Quem pode usar",
        blocks: [
          "Você precisa ter 18 anos ou mais. O serviço é destinado a pessoas nos Estados Unidos. Use-o só para a sua própria história.",
        ],
      },
      {
        id: "content",
        heading: "Sua história continua sendo sua",
        blocks: [
          "Sua história e os arquivos criados a partir dela pertencem a você. Você nos dá só a permissão necessária para prestar o serviço: guardar sua história temporariamente, transcrever, traduzir ou ler em voz alta quando você pedir, e gerar o seu arquivo. Essa permissão termina quando sua história é apagada. Não publicamos sua história nem a usamos para mais nada.",
        ],
      },
      {
        id: "responsibilities",
        heading: "Suas responsabilidades",
        blocks: [
          "Ao usar o serviço, você concorda em:",
          {
            list: [
              "compartilhar só conteúdo que você tem o direito de compartilhar, e pedir permissão antes de incluir detalhes particulares, rostos ou vozes de outras pessoas;",
              "não usá-lo para nada ilegal, ameaçador, de assédio, de ódio ou sexualmente explícito, nem para nada que explore ou coloque uma criança em perigo;",
              "não se passar por outra pessoa nem apresentar a história de outra pessoa como sua;",
              "não interferir no serviço, por exemplo sobrecarregando-o, burlando seus limites ou tentando acessar histórias de outras pessoas.",
            ],
          },
          "Podemos bloquear quem fizer mau uso do serviço.",
        ],
      },
      {
        id: "automation",
        heading: "Funções automáticas podem errar",
        blocks: [
          "Transcrições, traduções, vozes sintéticas e o desfoque do rosto são automáticos e podem ter erros. As traduções são marcadas como tradução automática, e a narração sintética também é marcada. Desfocar o rosto ajuda, mas não é garantia: sua voz, seu corpo e o ambiente ainda podem identificar você. Confira o seu arquivo com cuidado antes de aprovar; você é responsável pelo que decide compartilhar.",
        ],
      },
      {
        id: "sharing",
        heading: "Compartilhar é decisão sua",
        blocks: [
          "Depois que você baixa ou compartilha o seu arquivo, ele fica fora do nosso controle. WhatsApp, Instagram e outros aplicativos têm os próprios termos, e quem receber o seu arquivo pode copiar ou encaminhar.",
        ],
      },
      {
        id: "advice",
        heading: "Não é aconselhamento, e ajuda se você precisar",
        blocks: [
          "O serviço é uma ferramenta para contar histórias. Ele não oferece aconselhamento pastoral, médico, jurídico ou de outro profissional. Se contar a sua história trouxer algo doloroso ou se você estiver pensando em se machucar, ligue ou mande mensagem para o 988 (a Suicide & Crisis Lifeline) nos Estados Unidos, ou para o 911 em uma emergência.",
        ],
      },
      {
        id: "affiliation",
        heading: "Independência",
        blocks: [
          `O serviço é operado por ${o.name} e não é afiliado a nenhuma igreja ou outra organização, nem endossado por elas, a menos que digamos aqui. WhatsApp e Instagram são marcas de seus respectivos donos.`,
        ],
      },
      {
        id: "changes",
        heading: "Mudanças no serviço e nestes termos",
        blocks: [
          "Podemos mudar, pausar ou encerrar o serviço a qualquer momento. Se mudarmos estes termos, publicaremos a nova versão aqui com uma nova data de vigência; ela vale para histórias começadas depois dessa data.",
        ],
      },
      {
        id: "disclaimers",
        heading: "Isenções e limites",
        blocks: [
          'O serviço é oferecido de graça e "no estado em que se encontra", sem garantias de qualquer tipo, na medida permitida por lei. Na medida permitida por lei, não somos responsáveis por danos indiretos, incidentais ou consequentes, e nossa responsabilidade total por qualquer reclamação sobre o serviço é limitada a US$ 50. Alguns lugares não permitem esses limites, então eles podem não se aplicar a você.',
        ],
      },
      {
        id: "law",
        heading: "Lei aplicável",
        blocks: [
          `Estes termos são regidos pelas leis do estado de ${o.state} e dos Estados Unidos. Qualquer disputa será resolvida nos tribunais estaduais ou federais localizados em ${o.state}, a menos que a lei do lugar onde você mora dê o direito de levá-la a outro lugar.`,
        ],
      },
      {
        id: "contact",
        heading: "Contato",
        blocks: [`Dúvidas sobre estes termos: {email}, ou ${o.name}, ${o.address}.`],
      },
    ],
  }),
};
