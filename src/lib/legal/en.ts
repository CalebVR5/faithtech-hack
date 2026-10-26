// Terms of Use and Privacy Policy, English. This is the controlling version.
// Drafted from what the app actually does; it needs review by a lawyer before
// launch, and again whenever the app's data handling changes.

import type { LegalContent } from "./document";

export const en: LegalContent = {
  privacy: (o, f) => ({
    title: "Privacy Policy",
    summary: `This service helps you turn your baptism story or testimony into a card or short video that you download and share yourself. It is built to keep as little as possible: no accounts, no tracking, and your story is deleted from our server as soon as you download your file.`,
    sections: [
      {
        id: "short",
        heading: "The short version",
        blocks: [
          {
            list: [
              "No account, email address or phone number. We never ask for your real name.",
              `Your story, recordings and files are deleted from our server as soon as you download your finished file, when you delete your story, or at the latest ${f.storyHours} hours after you started.`,
              "We don't keep a copy, publish your story, or show it to anyone. Only you decide where your file goes.",
              "Google provides our hosting and, only if you allow it on screen, transcription, translation and a synthetic voice.",
              "No analytics, advertising, tracking cookies or session recording. We don't sell or share your personal information.",
              "The service is for adults 18 and older in the United States.",
            ],
          },
        ],
      },
      {
        id: "who",
        heading: "Who we are",
        blocks: [
          `${o.name} ("we", "us") operates this service and is responsible for your personal information. You can reach us at {email} or by mail at ${o.address}.`,
        ],
      },
      {
        id: "collect",
        heading: "What we collect",
        blocks: [
          "Only what you give us while you make your story, plus the technical information every website receives:",
          {
            list: [
              "Your story: the words you type or edit, and any voice recording or video you make or upload.",
              "What we make from it: a draft transcript and your corrections, translations and synthetic audio if you choose them, and the card or video we render.",
              "Your choices: whether it's a baptism story or a testimony, your languages, an optional display name, the passage you pick, where to blur your face, and your approval of the final version.",
              "Your answer that you're 18 or older. We don't ask for your date of birth.",
              "One essential cookie holding a random session code, so the server knows which story is yours. It contains nothing about you.",
              "Technical information: your IP address, browser and device type, and the time of each request, which our hosting provider records in server logs.",
            ],
          },
          "We don't collect your name (unless you type one into your story), contacts, precise location or advertising identifiers.",
        ],
      },
      {
        id: "sensitive",
        heading: "Sensitive information",
        blocks: [
          "A baptism story or testimony reveals your religious beliefs, and a recording contains your voice and possibly your face. We treat all of it as sensitive. We use it only to make the file you ask for, only after you choose to start a story, and we delete it as described below.",
          "To blur your face, face detection runs on your own device; our server receives only the position of the box to blur. We don't use facial recognition, and we don't create voiceprints, face templates or any other biometric identifiers.",
          "Your story may mention other people. Please include only what they'd be comfortable with; our review screen points out names, places and family members to help you check.",
        ],
      },
      {
        id: "use",
        heading: "How we use it",
        blocks: [
          {
            list: [
              "To make the card or video you ask for, show you a preview, and hand you the finished file.",
              "To keep the service secure and working, for example to stop abuse and fix errors, using the technical information in server logs.",
              "To meet legal obligations.",
            ],
          },
          "We don't use your story for marketing, advertising or profiling, and we don't use it to train AI models.",
        ],
      },
      {
        id: "retention",
        heading: "How long we keep it",
        blocks: [
          {
            list: [
              `Your story, choices and approvals: deleted when you download your finished file, when you tap "Delete my story", or ${f.storyHours} hours after you started, whichever comes first.`,
              `Recordings, videos, audio and rendered files: deleted at the same moments, and in any case ${f.mediaHours} ${f.mediaHours === 1 ? "hour" : "hours"} after they were made.`,
              `The session cookie: expires after ${f.storyHours} hours.`,
              `Server logs: kept by our hosting provider for up to ${f.logDays} days, then deleted.`,
            ],
          },
          "Stories are held only in the server's working memory and temporary files, never in a database or backup, so a server restart also deletes them. Once deleted, we can't recover them. The file you download stays on your device under your control.",
        ],
      },
      {
        id: "sharing",
        heading: "Who receives it",
        blocks: [
          "Google LLC, through Google Cloud, is our service provider. It hosts the service and, only for the features you allow on screen, turns recordings into text (only the sound of a video is sent), translates words, and reads text in a synthetic voice. Google processes this information on our behalf under Google Cloud's data processing terms, which limit its use to providing these services to us.",
          "We don't sell your personal information or share it for targeted advertising, and we don't give it to churches, ministries or other organizations. We'd disclose information only if the law requires it, and because we delete stories so quickly, there is usually nothing to disclose.",
          "When you share your file through WhatsApp, Instagram or any other app, that app's own privacy policy applies, and people who receive it can copy or forward it. We can't recall a file once you've shared it.",
        ],
      },
      {
        id: "rights",
        heading: "Your choices and rights",
        blocks: [
          "You stay in control while you use the service: you can type instead of recording, choose no voice, keep your story's own language so nothing is translated, decline Google's language features, and delete your story at any time.",
          `Depending on where you live, you may have the right to know what personal information we hold about you, get a copy, correct it, delete it, and opt out of its sale, targeted advertising or profiling. We offer these rights to everyone in the United States. Because we keep no stories and no accounts, we usually hold nothing that can be linked to you, but you can ask at {email}. We'll answer within ${f.responseDays} days, and if we decline a request you can appeal by replying to our answer.`,
          "We don't sell or share personal information, so there is nothing to opt out of, and we honor Global Privacy Control signals anyway. We won't treat you differently for using any of these rights.",
        ],
      },
      {
        id: "children",
        heading: "Adults only",
        blocks: [
          "The service is for adults 18 and older. If you answer that you're under 18, no story is created and nothing is sent. It isn't directed to children, and we don't knowingly collect information from anyone under 18. If you believe a child has used it, contact us and we'll delete anything we hold.",
        ],
      },
      {
        id: "security",
        heading: "Security",
        blocks: [
          "The service runs over an encrypted connection (HTTPS). Each story can be opened only from the browser session that created it, we have no screen or tool for viewing stories, and keeping data for hours rather than years is our strongest protection. No system is perfectly secure, so please don't include anything you'd be harmed by if it were exposed.",
        ],
      },
      {
        id: "location",
        heading: "Where it's processed",
        blocks: [
          "We run the service on Google Cloud servers in the United States. Google may process the language features in other countries where it operates, under the same terms.",
        ],
      },
      {
        id: "changes",
        heading: "Changes to this policy",
        blocks: [
          "If we change this policy, we'll post the new version here with a new effective date. Because we keep nothing between visits, a change applies to stories started after it takes effect.",
        ],
      },
      {
        id: "contact",
        heading: "Contact",
        blocks: [`Questions or requests: {email}, or ${o.name}, ${o.address}.`],
      },
    ],
  }),

  terms: (o, f) => ({
    title: "Terms of Use",
    summary: `These terms are an agreement between you and ${o.name}. By starting a story, you accept them. Please also read our {privacy}.`,
    sections: [
      {
        id: "service",
        heading: "The service",
        blocks: [
          `The service helps you tell your baptism story or testimony in your own words and turn it into a card or short video that you download. It's free and needs no account. We delete your story and everything made from it when you download your file, when you delete it, or ${f.storyHours} hours after you started, and deleted stories can't be recovered.`,
        ],
      },
      {
        id: "eligibility",
        heading: "Who can use it",
        blocks: [
          "You must be 18 or older. The service is intended for people in the United States. Use it only for your own story.",
        ],
      },
      {
        id: "content",
        heading: "Your story stays yours",
        blocks: [
          "You own your story and the files made from it. You give us only the permission we need to provide the service to you: to hold your story temporarily, transcribe, translate or read it aloud when you ask, and render your file. That permission ends when your story is deleted. We don't publish your story or use it for anything else.",
        ],
      },
      {
        id: "responsibilities",
        heading: "Your responsibilities",
        blocks: [
          "When you use the service, you agree:",
          {
            list: [
              "to share only content you have the right to share, and to get permission before including other people's private details, faces or voices;",
              "not to use it for anything unlawful, threatening, harassing, hateful or sexually explicit, or anything that exploits or endangers a child;",
              "not to impersonate anyone or present someone else's story as your own;",
              "not to interfere with the service, for example by overloading it, getting around its limits, or trying to reach other people's stories.",
            ],
          },
          "We may stop anyone who misuses the service.",
        ],
      },
      {
        id: "automation",
        heading: "Automatic features can make mistakes",
        blocks: [
          "Transcriptions, translations, synthetic voices and the face cover are automatic and can be wrong. Translations are labeled as machine translated, and synthetic narration is labeled too. Covering your face helps but isn't a guarantee: your voice, body and surroundings can still identify you. Check your file carefully before you approve it; you're responsible for what you choose to share.",
        ],
      },
      {
        id: "sharing",
        heading: "Sharing is up to you",
        blocks: [
          "Once you download or share your file, it's outside our control. WhatsApp, Instagram and other apps have their own terms, and people who receive your file can copy or forward it.",
        ],
      },
      {
        id: "advice",
        heading: "Not advice, and help if you need it",
        blocks: [
          "The service is a storytelling tool. It doesn't provide pastoral, medical, legal or other professional advice. If telling your story brings up something painful or you're thinking about harming yourself, call or text 988 (the Suicide & Crisis Lifeline) in the United States, or 911 in an emergency.",
        ],
      },
      {
        id: "affiliation",
        heading: "Independence",
        blocks: [
          `The service is operated by ${o.name} and isn't affiliated with or endorsed by any church or other organization unless we say so here. WhatsApp and Instagram are trademarks of their owners.`,
        ],
      },
      {
        id: "changes",
        heading: "Changes to the service and these terms",
        blocks: [
          "We may change, pause or stop the service at any time. If we change these terms, we'll post the new version here with a new effective date; it applies to stories started after that date.",
        ],
      },
      {
        id: "disclaimers",
        heading: "Disclaimers and limits",
        blocks: [
          'The service is provided free and "as is", without warranties of any kind, to the extent the law allows. To the extent the law allows, we aren\'t liable for indirect, incidental or consequential damages, and our total liability for any claim about the service is limited to $50. Some places don\'t allow these limits, so they may not apply to you.',
        ],
      },
      {
        id: "law",
        heading: "Governing law",
        blocks: [
          `These terms are governed by the laws of the State of ${o.state} and of the United States. Any dispute will be handled in the state or federal courts located in ${o.state}, unless the law where you live gives you the right to bring it elsewhere.`,
        ],
      },
      {
        id: "contact",
        heading: "Contact",
        blocks: [`Questions about these terms: {email}, or ${o.name}, ${o.address}.`],
      },
    ],
  }),
};
