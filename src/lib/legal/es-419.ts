// Términos de uso y Política de privacidad, español latinoamericano. Traducción
// de cortesía de la versión en inglés (src/lib/legal/en.ts), que es la que rige.
// Necesita revisión de un abogado y de hablantes nativos antes del lanzamiento.

import type { LegalContent } from "./document";

export const esLatam: LegalContent = {
  privacy: (o, f) => ({
    title: "Política de privacidad",
    summary: "Este servicio te ayuda a convertir tu historia de bautismo o tu testimonio en una tarjeta o un video corto que descargas y compartes tú. Está hecho para guardar lo mínimo posible: sin cuentas, sin rastreo, y tu historia se borra de nuestro servidor en cuanto descargas tu archivo.",
    sections: [
      {
        id: "short",
        heading: "En resumen",
        blocks: [
          {
            list: [
              "Sin cuenta, correo electrónico ni número de teléfono. Nunca te pedimos tu nombre real.",
              `Tu historia, tus grabaciones y tus archivos se borran de nuestro servidor en cuanto descargas tu archivo terminado, cuando borras tu historia o, a más tardar, ${f.storyHours} horas después de empezar.`,
              "No guardamos una copia, no publicamos tu historia ni se la mostramos a nadie. Solo tú decides adónde va tu archivo.",
              "Google nos da el alojamiento y, solo si lo permites en pantalla, la transcripción, la traducción y una voz sintética.",
              "Sin analítica, publicidad, cookies de rastreo ni grabación de sesiones. No vendemos ni compartimos tu información personal.",
              "El servicio es para adultos de 18 años o más en los Estados Unidos.",
            ],
          },
        ],
      },
      {
        id: "who",
        heading: "Quiénes somos",
        blocks: [
          `${o.name} ("nosotros") opera este servicio y es responsable de tu información personal. Puedes escribirnos a {email} o por correo postal a ${o.address}.`,
        ],
      },
      {
        id: "collect",
        heading: "Qué recopilamos",
        blocks: [
          "Solo lo que nos das mientras creas tu historia, más la información técnica que recibe cualquier sitio web:",
          {
            list: [
              "Tu historia: las palabras que escribes o editas, y cualquier grabación de voz o video que hagas o subas.",
              "Lo que creamos a partir de ella: una transcripción en borrador y tus correcciones, traducciones y audio sintético si los eliges, y la tarjeta o el video que generamos.",
              "Tus decisiones: si es una historia de bautismo o un testimonio, tus idiomas, un nombre opcional para mostrar, el fragmento que eliges, dónde difuminar tu cara y tu aprobación de la versión final.",
              "Tu respuesta de que tienes 18 años o más. No pedimos tu fecha de nacimiento.",
              "Una cookie esencial con un código de sesión aleatorio, para que el servidor sepa cuál historia es tuya. No contiene nada sobre ti.",
              "Información técnica: tu dirección IP, el tipo de navegador y de dispositivo, y la hora de cada solicitud, que nuestro proveedor de alojamiento registra en los registros del servidor.",
            ],
          },
          "No recopilamos tu nombre (a menos que lo escribas en tu historia), tus contactos, tu ubicación precisa ni identificadores publicitarios.",
        ],
      },
      {
        id: "sensitive",
        heading: "Información sensible",
        blocks: [
          "Una historia de bautismo o un testimonio revela tus creencias religiosas, y una grabación contiene tu voz y quizás tu cara. Tratamos todo eso como información sensible. Lo usamos solo para crear el archivo que pides, solo después de que decides empezar una historia, y lo borramos como se explica abajo.",
          "Para difuminar tu cara, la detección de rostros se hace en tu propio dispositivo; nuestro servidor solo recibe la posición del recuadro que hay que difuminar. No usamos reconocimiento facial y no creamos huellas de voz, plantillas faciales ni ningún otro identificador biométrico.",
          "Tu historia puede mencionar a otras personas. Incluye solo lo que a ellas les parecería bien; nuestra pantalla de revisión señala nombres, lugares y familiares para ayudarte a revisar.",
        ],
      },
      {
        id: "use",
        heading: "Cómo la usamos",
        blocks: [
          {
            list: [
              "Para crear la tarjeta o el video que pides, mostrarte una vista previa y entregarte el archivo terminado.",
              "Para mantener el servicio seguro y funcionando, por ejemplo para detener abusos y corregir errores, con la información técnica de los registros del servidor.",
              "Para cumplir obligaciones legales.",
            ],
          },
          "No usamos tu historia para mercadeo, publicidad ni elaboración de perfiles, ni para entrenar modelos de inteligencia artificial.",
        ],
      },
      {
        id: "retention",
        heading: "Cuánto tiempo la guardamos",
        blocks: [
          {
            list: [
              `Tu historia, tus decisiones y tus aprobaciones: se borran cuando descargas tu archivo terminado, cuando tocas "Borrar mi historia" o ${f.storyHours} horas después de empezar, lo que ocurra primero.`,
              `Grabaciones, videos, audio y archivos generados: se borran en esos mismos momentos y, en todo caso, ${f.mediaHours} ${f.mediaHours === 1 ? "hora" : "horas"} después de crearse.`,
              `La cookie de sesión: vence después de ${f.storyHours} horas.`,
              `Registros del servidor: nuestro proveedor de alojamiento los guarda hasta ${f.logDays} días y luego los borra.`,
            ],
          },
          "Las historias se guardan solo en la memoria de trabajo del servidor y en archivos temporales, nunca en una base de datos ni en copias de seguridad, así que reiniciar el servidor también las borra. Una vez borradas, no podemos recuperarlas. El archivo que descargas queda en tu dispositivo, bajo tu control.",
        ],
      },
      {
        id: "sharing",
        heading: "Quién la recibe",
        blocks: [
          "Google LLC, a través de Google Cloud, es nuestro proveedor de servicios. Aloja el servicio y, solo para las funciones que permites en pantalla, convierte grabaciones en texto (de un video solo se envía el sonido), traduce palabras y lee texto con una voz sintética. Google procesa esta información en nuestro nombre según los términos de tratamiento de datos de Google Cloud, que limitan su uso a prestarnos estos servicios.",
          "No vendemos tu información personal ni la compartimos para publicidad dirigida, y no se la damos a iglesias, ministerios ni otras organizaciones. Solo revelaríamos información si la ley lo exige y, como borramos las historias tan rápido, normalmente no hay nada que revelar.",
          "Cuando compartes tu archivo por WhatsApp, Instagram u otra aplicación, se aplica la política de privacidad de esa aplicación, y quienes lo reciban pueden copiarlo o reenviarlo. No podemos recuperar un archivo una vez que lo compartiste.",
        ],
      },
      {
        id: "rights",
        heading: "Tus opciones y derechos",
        blocks: [
          "Tú tienes el control mientras usas el servicio: puedes escribir en vez de grabar, elegir sin voz, mantener el idioma de tu historia para que nada se traduzca, rechazar las funciones de idiomas de Google y borrar tu historia en cualquier momento.",
          `Según dónde vivas, puedes tener derecho a saber qué información personal tenemos sobre ti, obtener una copia, corregirla, borrarla y oponerte a su venta, a la publicidad dirigida o a la elaboración de perfiles. Ofrecemos estos derechos a todas las personas en los Estados Unidos. Como no guardamos historias ni cuentas, normalmente no tenemos nada que pueda vincularse contigo, pero puedes pedirlo en {email}. Responderemos en un plazo de ${f.responseDays} días y, si rechazamos una solicitud, puedes apelar respondiendo a nuestra respuesta.`,
          "No vendemos ni compartimos información personal, así que no hay nada de qué excluirse, y aun así respetamos las señales de Global Privacy Control. No te trataremos de forma diferente por ejercer ninguno de estos derechos.",
        ],
      },
      {
        id: "children",
        heading: "Solo para adultos",
        blocks: [
          "El servicio es para adultos de 18 años o más. Si respondes que tienes menos de 18, no se crea ninguna historia y no se envía nada. No está dirigido a niños ni a adolescentes, y no recopilamos a sabiendas información de menores de 18 años. Si crees que un menor lo usó, escríbenos y borraremos lo que tengamos.",
        ],
      },
      {
        id: "security",
        heading: "Seguridad",
        blocks: [
          "El servicio funciona con una conexión cifrada (HTTPS). Cada historia solo puede abrirse desde la sesión del navegador que la creó, no tenemos ninguna pantalla ni herramienta para ver historias, y guardar los datos horas en vez de años es nuestra mejor protección. Ningún sistema es perfectamente seguro, así que no incluyas nada que pudiera perjudicarte si se expusiera.",
        ],
      },
      {
        id: "location",
        heading: "Dónde se procesa",
        blocks: [
          "Ejecutamos el servicio en servidores de Google Cloud en los Estados Unidos. Google puede procesar las funciones de idiomas en otros países donde opera, bajo los mismos términos.",
        ],
      },
      {
        id: "changes",
        heading: "Cambios a esta política",
        blocks: [
          "Si cambiamos esta política, publicaremos la nueva versión aquí con una nueva fecha de vigencia. Como no guardamos nada entre visitas, un cambio se aplica a las historias que se empiecen después de que entre en vigor.",
        ],
      },
      {
        id: "contact",
        heading: "Contacto",
        blocks: [`Preguntas o solicitudes: {email}, o ${o.name}, ${o.address}.`],
      },
    ],
  }),

  terms: (o, f) => ({
    title: "Términos de uso",
    summary: `Estos términos son un acuerdo entre tú y ${o.name}. Al empezar una historia, los aceptas. Lee también nuestra {privacy}.`,
    sections: [
      {
        id: "service",
        heading: "El servicio",
        blocks: [
          `El servicio te ayuda a contar tu historia de bautismo o tu testimonio con tus propias palabras y convertirlo en una tarjeta o un video corto que descargas. Es gratuito y no necesita cuenta. Borramos tu historia y todo lo que se creó a partir de ella cuando descargas tu archivo, cuando la borras o ${f.storyHours} horas después de empezar, y las historias borradas no se pueden recuperar.`,
        ],
      },
      {
        id: "eligibility",
        heading: "Quién puede usarlo",
        blocks: [
          "Debes tener 18 años o más. El servicio está pensado para personas en los Estados Unidos. Úsalo solo para tu propia historia.",
        ],
      },
      {
        id: "content",
        heading: "Tu historia sigue siendo tuya",
        blocks: [
          "Tú eres dueño o dueña de tu historia y de los archivos creados a partir de ella. Solo nos das el permiso que necesitamos para prestarte el servicio: guardar tu historia temporalmente, transcribirla, traducirla o leerla en voz alta cuando lo pidas, y generar tu archivo. Ese permiso termina cuando se borra tu historia. No publicamos tu historia ni la usamos para nada más.",
        ],
      },
      {
        id: "responsibilities",
        heading: "Tus responsabilidades",
        blocks: [
          "Al usar el servicio, aceptas:",
          {
            list: [
              "compartir solo contenido que tienes derecho a compartir, y pedir permiso antes de incluir detalles privados, caras o voces de otras personas;",
              "no usarlo para nada ilegal, amenazante, acosador, de odio o sexualmente explícito, ni para nada que explote o ponga en peligro a un menor;",
              "no hacerte pasar por otra persona ni presentar la historia de otra persona como tuya;",
              "no interferir con el servicio, por ejemplo sobrecargándolo, evadiendo sus límites o intentando acceder a las historias de otras personas.",
            ],
          },
          "Podemos detener a cualquiera que haga mal uso del servicio.",
        ],
      },
      {
        id: "automation",
        heading: "Las funciones automáticas pueden equivocarse",
        blocks: [
          "Las transcripciones, traducciones, voces sintéticas y el difuminado de la cara son automáticos y pueden tener errores. Las traducciones se marcan como traducción automática, y la narración sintética también se marca. Difuminar tu cara ayuda, pero no es una garantía: tu voz, tu cuerpo y tu entorno todavía pueden identificarte. Revisa tu archivo con cuidado antes de aprobarlo; tú eres responsable de lo que decides compartir.",
        ],
      },
      {
        id: "sharing",
        heading: "Compartir depende de ti",
        blocks: [
          "Una vez que descargas o compartes tu archivo, queda fuera de nuestro control. WhatsApp, Instagram y otras aplicaciones tienen sus propios términos, y quienes reciban tu archivo pueden copiarlo o reenviarlo.",
        ],
      },
      {
        id: "advice",
        heading: "No es consejería, y ayuda si la necesitas",
        blocks: [
          "El servicio es una herramienta para contar historias. No ofrece consejo pastoral, médico, legal ni de otro profesional. Si contar tu historia te trae algo doloroso o estás pensando en hacerte daño, llama o envía un mensaje de texto al 988 (la Línea de Prevención del Suicidio y Crisis, con atención en español) en los Estados Unidos, o al 911 en una emergencia.",
        ],
      },
      {
        id: "affiliation",
        heading: "Independencia",
        blocks: [
          `El servicio lo opera ${o.name} y no está afiliado a ninguna iglesia u otra organización ni respaldado por ellas, salvo que lo indiquemos aquí. WhatsApp e Instagram son marcas de sus respectivos dueños.`,
        ],
      },
      {
        id: "changes",
        heading: "Cambios al servicio y a estos términos",
        blocks: [
          "Podemos cambiar, pausar o terminar el servicio en cualquier momento. Si cambiamos estos términos, publicaremos la nueva versión aquí con una nueva fecha de vigencia; se aplica a las historias que se empiecen después de esa fecha.",
        ],
      },
      {
        id: "disclaimers",
        heading: "Exenciones y límites",
        blocks: [
          'El servicio se ofrece gratis y "tal cual", sin garantías de ningún tipo, en la medida en que la ley lo permita. En la medida en que la ley lo permita, no somos responsables de daños indirectos, incidentales ni consecuentes, y nuestra responsabilidad total por cualquier reclamo sobre el servicio se limita a 50 dólares. Algunos lugares no permiten estos límites, así que puede que no se apliquen a ti.',
        ],
      },
      {
        id: "law",
        heading: "Ley aplicable",
        blocks: [
          `Estos términos se rigen por las leyes del estado de ${o.state} y de los Estados Unidos. Cualquier disputa se resolverá en los tribunales estatales o federales ubicados en ${o.state}, salvo que la ley del lugar donde vives te dé derecho a presentarla en otro lugar.`,
        ],
      },
      {
        id: "contact",
        heading: "Contacto",
        blocks: [`Preguntas sobre estos términos: {email}, o ${o.name}, ${o.address}.`],
      },
    ],
  }),
};
