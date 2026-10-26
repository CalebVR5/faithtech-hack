// Conditions d'utilisation et Politique de confidentialité, français canadien.
// Traduction de courtoisie de la version anglaise (src/lib/legal/en.ts), qui
// prévaut. À faire réviser par un juriste et des locuteurs natifs avant le lancement.

import type { LegalContent } from "./document";

export const fr: LegalContent = {
  privacy: (o, f) => ({
    title: "Politique de confidentialité",
    summary: "Ce service vous aide à transformer votre histoire de baptême ou votre témoignage en une carte ou une courte vidéo que vous téléchargez et partagez vous-même. Il est conçu pour garder le moins possible : aucun compte, aucun suivi, et votre histoire est supprimée de notre serveur dès que vous téléchargez votre fichier.",
    sections: [
      {
        id: "short",
        heading: "En bref",
        blocks: [
          {
            list: [
              "Aucun compte, courriel ni numéro de téléphone. Nous ne demandons jamais votre vrai nom.",
              `Votre histoire, vos enregistrements et vos fichiers sont supprimés de notre serveur dès que vous téléchargez votre fichier final, quand vous supprimez votre histoire ou, au plus tard, ${f.storyHours} heures après le début.`,
              "Nous ne gardons pas de copie, ne publions pas votre histoire et ne la montrons à personne. Vous seul·e décidez où va votre fichier.",
              "Google fournit notre hébergement et, seulement si vous l'autorisez à l'écran, la transcription, la traduction et une voix synthétique.",
              "Aucune analyse d'audience, publicité, témoin de suivi ni enregistrement de session. Nous ne vendons ni ne partageons vos renseignements personnels.",
              "Le service est destiné aux adultes de 18 ans et plus aux États-Unis.",
            ],
          },
        ],
      },
      {
        id: "who",
        heading: "Qui nous sommes",
        blocks: [
          `${o.name} (« nous ») exploite ce service et est responsable de vos renseignements personnels. Vous pouvez nous joindre à {email} ou par la poste au ${o.address}.`,
        ],
      },
      {
        id: "collect",
        heading: "Ce que nous recueillons",
        blocks: [
          "Seulement ce que vous nous donnez pendant que vous créez votre histoire, plus l'information technique que reçoit tout site Web :",
          {
            list: [
              "Votre histoire : les mots que vous écrivez ou modifiez, et tout enregistrement vocal ou vidéo que vous faites ou téléversez.",
              "Ce que nous en tirons : une transcription provisoire et vos corrections, les traductions et l'audio synthétique si vous les choisissez, et la carte ou la vidéo que nous créons.",
              "Vos choix : histoire de baptême ou témoignage, vos langues, un nom d'affichage facultatif, le passage choisi, la zone de votre visage à flouter et votre approbation de la version finale.",
              "Votre réponse indiquant que vous avez 18 ans ou plus. Nous ne demandons pas votre date de naissance.",
              "Un témoin (cookie) essentiel contenant un code de session aléatoire, pour que le serveur sache quelle histoire est la vôtre. Il ne contient rien sur vous.",
              "De l'information technique : votre adresse IP, le type de navigateur et d'appareil, et l'heure de chaque requête, que notre hébergeur consigne dans les journaux du serveur.",
            ],
          },
          "Nous ne recueillons ni votre nom (sauf si vous l'écrivez dans votre histoire), ni vos contacts, ni votre position précise, ni d'identifiant publicitaire.",
        ],
      },
      {
        id: "sensitive",
        heading: "Renseignements sensibles",
        blocks: [
          "Une histoire de baptême ou un témoignage révèle vos croyances religieuses, et un enregistrement contient votre voix et peut-être votre visage. Nous traitons tout cela comme sensible. Nous l'utilisons seulement pour créer le fichier que vous demandez, seulement après que vous avez choisi de commencer une histoire, et nous le supprimons comme décrit ci-dessous.",
          "Pour flouter votre visage, la détection de visage se fait sur votre propre appareil; notre serveur reçoit seulement la position du cadre à flouter. Nous n'utilisons pas la reconnaissance faciale et ne créons ni empreinte vocale, ni modèle facial, ni aucun autre identifiant biométrique.",
          "Votre histoire peut mentionner d'autres personnes. N'incluez que ce qu'elles accepteraient; notre écran de révision signale les noms, les lieux et les membres de la famille pour vous aider à vérifier.",
        ],
      },
      {
        id: "use",
        heading: "Comment nous les utilisons",
        blocks: [
          {
            list: [
              "Pour créer la carte ou la vidéo que vous demandez, vous en montrer un aperçu et vous remettre le fichier final.",
              "Pour assurer la sécurité et le bon fonctionnement du service, par exemple pour bloquer les abus et corriger les erreurs, à l'aide de l'information technique des journaux du serveur.",
              "Pour respecter nos obligations légales.",
            ],
          },
          "Nous n'utilisons pas votre histoire à des fins de marketing, de publicité ou de profilage, ni pour entraîner des modèles d'intelligence artificielle.",
        ],
      },
      {
        id: "retention",
        heading: "Durée de conservation",
        blocks: [
          {
            list: [
              `Votre histoire, vos choix et vos approbations : supprimés quand vous téléchargez votre fichier final, quand vous touchez « Supprimer mon histoire » ou ${f.storyHours} heures après le début, selon ce qui arrive en premier.`,
              `Enregistrements, vidéos, audio et fichiers créés : supprimés aux mêmes moments et, dans tous les cas, ${f.mediaHours} ${f.mediaHours === 1 ? "heure" : "heures"} après leur création.`,
              `Le témoin de session : expire après ${f.storyHours} heures.`,
              `Journaux du serveur : conservés par notre hébergeur pendant au plus ${f.logDays} jours, puis supprimés.`,
            ],
          },
          "Les histoires sont gardées seulement dans la mémoire de travail du serveur et dans des fichiers temporaires, jamais dans une base de données ni une sauvegarde; un redémarrage du serveur les supprime donc aussi. Une fois supprimées, nous ne pouvons pas les récupérer. Le fichier que vous téléchargez reste sur votre appareil, sous votre contrôle.",
        ],
      },
      {
        id: "sharing",
        heading: "Qui les reçoit",
        blocks: [
          "Google LLC, par l'intermédiaire de Google Cloud, est notre fournisseur de services. Il héberge le service et, seulement pour les fonctions que vous autorisez à l'écran, transforme les enregistrements en texte (seul le son d'une vidéo est envoyé), traduit des mots et lit du texte avec une voix synthétique. Google traite ces renseignements pour notre compte selon les conditions de traitement des données de Google Cloud, qui limitent leur utilisation à la prestation de ces services.",
          "Nous ne vendons pas vos renseignements personnels, ne les partageons pas à des fins de publicité ciblée et ne les donnons pas à des églises, des ministères ni d'autres organisations. Nous ne communiquerions des renseignements que si la loi l'exige et, comme nous supprimons les histoires très vite, il n'y a habituellement rien à communiquer.",
          "Quand vous partagez votre fichier par WhatsApp, Instagram ou toute autre application, la politique de confidentialité de cette application s'applique, et les personnes qui le reçoivent peuvent le copier ou le transférer. Nous ne pouvons pas rappeler un fichier une fois partagé.",
        ],
      },
      {
        id: "rights",
        heading: "Vos choix et vos droits",
        blocks: [
          "Vous gardez le contrôle pendant que vous utilisez le service : vous pouvez écrire au lieu d'enregistrer, choisir « sans voix », garder la langue de votre histoire pour que rien ne soit traduit, refuser les fonctions linguistiques de Google et supprimer votre histoire en tout temps.",
          `Selon l'endroit où vous vivez, vous pourriez avoir le droit de savoir quels renseignements personnels nous détenons sur vous, d'en obtenir une copie, de les corriger, de les supprimer et de vous opposer à leur vente, à la publicité ciblée ou au profilage. Nous offrons ces droits à toute personne aux États-Unis. Comme nous ne gardons ni histoires ni comptes, nous ne détenons habituellement rien qui puisse être lié à vous, mais vous pouvez en faire la demande à {email}. Nous répondrons dans un délai de ${f.responseDays} jours et, si nous refusons une demande, vous pouvez faire appel en répondant à notre réponse.`,
          "Nous ne vendons ni ne partageons de renseignements personnels, il n'y a donc rien à refuser, et nous respectons tout de même les signaux Global Privacy Control. Nous ne vous traiterons pas différemment parce que vous exercez l'un de ces droits.",
        ],
      },
      {
        id: "children",
        heading: "Réservé aux adultes",
        blocks: [
          "Le service est destiné aux adultes de 18 ans et plus. Si vous répondez avoir moins de 18 ans, aucune histoire n'est créée et rien n'est envoyé. Il ne s'adresse pas aux enfants, et nous ne recueillons pas sciemment de renseignements auprès de personnes de moins de 18 ans. Si vous croyez qu'un enfant l'a utilisé, écrivez-nous et nous supprimerons tout ce que nous détenons.",
        ],
      },
      {
        id: "security",
        heading: "Sécurité",
        blocks: [
          "Le service utilise une connexion chiffrée (HTTPS). Chaque histoire ne peut être ouverte que depuis la session de navigateur qui l'a créée, nous n'avons aucun écran ni outil pour consulter les histoires, et garder les données quelques heures plutôt que des années est notre meilleure protection. Aucun système n'est parfaitement sûr; n'incluez donc rien qui pourrait vous nuire s'il était exposé.",
        ],
      },
      {
        id: "location",
        heading: "Lieu de traitement",
        blocks: [
          "Nous exploitons le service sur des serveurs de Google Cloud aux États-Unis. Google peut traiter les fonctions linguistiques dans d'autres pays où il exerce ses activités, selon les mêmes conditions.",
        ],
      },
      {
        id: "changes",
        heading: "Modifications de cette politique",
        blocks: [
          "Si nous modifions cette politique, nous publierons la nouvelle version ici avec une nouvelle date d'entrée en vigueur. Comme nous ne gardons rien d'une visite à l'autre, une modification s'applique aux histoires commencées après son entrée en vigueur.",
        ],
      },
      {
        id: "contact",
        heading: "Nous joindre",
        blocks: [`Questions ou demandes : {email}, ou ${o.name}, ${o.address}.`],
      },
    ],
  }),

  terms: (o, f) => ({
    title: "Conditions d'utilisation",
    summary: `Ces conditions constituent une entente entre vous et ${o.name}. En commençant une histoire, vous les acceptez. Veuillez aussi lire notre {privacy}.`,
    sections: [
      {
        id: "service",
        heading: "Le service",
        blocks: [
          `Le service vous aide à raconter votre histoire de baptême ou votre témoignage avec vos mots et à en faire une carte ou une courte vidéo que vous téléchargez. Il est gratuit et ne nécessite aucun compte. Nous supprimons votre histoire et tout ce qui en est tiré quand vous téléchargez votre fichier, quand vous la supprimez ou ${f.storyHours} heures après le début, et une histoire supprimée ne peut pas être récupérée.`,
        ],
      },
      {
        id: "eligibility",
        heading: "Qui peut l'utiliser",
        blocks: [
          "Vous devez avoir 18 ans ou plus. Le service est destiné aux personnes aux États-Unis. Utilisez-le seulement pour votre propre histoire.",
        ],
      },
      {
        id: "content",
        heading: "Votre histoire reste la vôtre",
        blocks: [
          "Votre histoire et les fichiers qui en sont tirés vous appartiennent. Vous nous accordez seulement la permission nécessaire pour vous offrir le service : conserver temporairement votre histoire, la transcrire, la traduire ou la lire à voix haute quand vous le demandez, et créer votre fichier. Cette permission prend fin quand votre histoire est supprimée. Nous ne publions pas votre histoire et ne l'utilisons à aucune autre fin.",
        ],
      },
      {
        id: "responsibilities",
        heading: "Vos responsabilités",
        blocks: [
          "En utilisant le service, vous acceptez :",
          {
            list: [
              "de partager seulement du contenu que vous avez le droit de partager, et d'obtenir la permission avant d'inclure les détails privés, le visage ou la voix d'autres personnes;",
              "de ne pas l'utiliser à des fins illégales, menaçantes, harcelantes, haineuses ou sexuellement explicites, ni pour quoi que ce soit qui exploite ou met en danger un enfant;",
              "de ne pas vous faire passer pour quelqu'un d'autre ni présenter l'histoire d'une autre personne comme la vôtre;",
              "de ne pas nuire au service, par exemple en le surchargeant, en contournant ses limites ou en tentant d'accéder aux histoires d'autres personnes.",
            ],
          },
          "Nous pouvons bloquer toute personne qui fait un mauvais usage du service.",
        ],
      },
      {
        id: "automation",
        heading: "Les fonctions automatiques peuvent se tromper",
        blocks: [
          "Les transcriptions, traductions, voix synthétiques et le floutage du visage sont automatiques et peuvent comporter des erreurs. Les traductions sont indiquées comme automatiques, et la narration synthétique est aussi indiquée. Flouter votre visage aide, mais ce n'est pas une garantie : votre voix, votre corps et votre environnement peuvent encore vous identifier. Vérifiez votre fichier attentivement avant de l'approuver; vous êtes responsable de ce que vous choisissez de partager.",
        ],
      },
      {
        id: "sharing",
        heading: "Le partage vous appartient",
        blocks: [
          "Une fois que vous téléchargez ou partagez votre fichier, il échappe à notre contrôle. WhatsApp, Instagram et les autres applications ont leurs propres conditions, et les personnes qui reçoivent votre fichier peuvent le copier ou le transférer.",
        ],
      },
      {
        id: "advice",
        heading: "Pas un conseil, et de l'aide au besoin",
        blocks: [
          "Le service est un outil pour raconter son histoire. Il ne fournit aucun conseil pastoral, médical, juridique ou professionnel. Si raconter votre histoire fait remonter quelque chose de douloureux ou si vous pensez à vous faire du mal, appelez ou textez le 988 (la ligne d'aide Suicide & Crisis Lifeline) aux États-Unis, ou le 911 en cas d'urgence.",
        ],
      },
      {
        id: "affiliation",
        heading: "Indépendance",
        blocks: [
          `Le service est exploité par ${o.name} et n'est affilié à aucune église ni autre organisation, ni approuvé par elles, sauf indication contraire ici. WhatsApp et Instagram sont des marques de leurs propriétaires.`,
        ],
      },
      {
        id: "changes",
        heading: "Modifications du service et de ces conditions",
        blocks: [
          "Nous pouvons modifier, suspendre ou arrêter le service à tout moment. Si nous modifions ces conditions, nous publierons la nouvelle version ici avec une nouvelle date d'entrée en vigueur; elle s'applique aux histoires commencées après cette date.",
        ],
      },
      {
        id: "disclaimers",
        heading: "Exclusions et limites",
        blocks: [
          "Le service est offert gratuitement et « tel quel », sans garantie d'aucune sorte, dans la mesure permise par la loi. Dans la mesure permise par la loi, nous ne sommes pas responsables des dommages indirects, accessoires ou consécutifs, et notre responsabilité totale pour toute réclamation concernant le service est limitée à 50 $ US. Certains endroits n'autorisent pas ces limites; elles pourraient donc ne pas s'appliquer à vous.",
        ],
      },
      {
        id: "law",
        heading: "Droit applicable",
        blocks: [
          `Ces conditions sont régies par les lois de l'État de ${o.state} et des États-Unis. Tout différend sera soumis aux tribunaux d'État ou fédéraux situés dans l'État de ${o.state}, sauf si la loi de l'endroit où vous vivez vous permet de le porter ailleurs.`,
        ],
      },
      {
        id: "contact",
        heading: "Nous joindre",
        blocks: [`Questions sur ces conditions : {email}, ou ${o.name}, ${o.address}.`],
      },
    ],
  }),
};
