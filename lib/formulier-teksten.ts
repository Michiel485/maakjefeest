import type { CardTaal } from "./cards"

// Het aanmeldformulier in de taal van de kaart.
//
// Een Engelse kaart met een Nederlands formulier eronder klopt niet: dan kan
// de gast voor wie je die kaart juist maakte het formulier niet lezen
// (Michiel, 25 september 2026). Dezelfde toon als de vaste kaartteksten in
// lib/cards.ts: je, du, tú, tu, en in het Frans vous, zoals op de Franse kaart.
//
// Wat het bruidspaar zelf typt (eigen vragen) vertalen wij niet.

export interface FormulierTeksten {
  benJeErbij: string
  aanmelden: string
  jaErbij: string
  neeNiet: string
  hoeveel: string
  jij: string
  persoon: (n: number) => string
  voornaam: string
  achternaam: string
  email: string
  telefoon: string
  adres: string
  dieet: string
  allergie: string
  kinderenMee: string
  naamKind: string
  leeftijd: string
  kindDieet: (naam: string) => string
  nogEenKind: string
  leeftijdUitleg: string
  nummer: string
  slapen: string
  ja: string
  nee: string
  berichtNee: string
  berichtJa: string
  versturen: string
  versturenBezig: string
  privacy: string
  foutKomt: string
  foutVoornaam: string
  foutVersturen: string
  bijgewerkt: string
  totDan: string
  jammerBedankt: string
  genoteerd: string
  rekening: string
  jammer: string
  tochAanpassen: string
  deadline: string
  eerderEen: string
  eerderMeer: string
  datAanpassen: string
  iemandAnders: string
  blijftStaan: string
  persoonlijk: string
  jePast: string
  tochAnders: string
  /** "Lindsey en Michiel" */
  en: string
}

export const FORMULIER_TEKST: Record<CardTaal, FormulierTeksten> = {
  nl: {
    benJeErbij: "Ben je erbij?",
    aanmelden: "Aanmelden",
    jaErbij: "Ja, ik ben erbij",
    neeNiet: "Nee, ik kan niet",
    hoeveel: "Met hoeveel volwassenen kom je?",
    jij: "Jij",
    persoon: (n) => `Persoon ${n}`,
    voornaam: "Voornaam",
    achternaam: "Achternaam",
    email: "E-mailadres",
    telefoon: "Telefoon (niet verplicht)",
    adres: "Adres voor de trouwkaart\nStraat 12, 1234 AB Plaats",
    dieet: "Dieetwens, bijv. vegetarisch",
    allergie: "Allergie, bijv. noten",
    kinderenMee: "Komen er kinderen mee?",
    naamKind: "Naam van het kind",
    leeftijd: "Leeftijd",
    kindDieet: (naam) => `Dieetwensen of allergie van ${naam} (optioneel)`,
    nogEenKind: "Nog een kind",
    leeftijdUitleg: "De leeftijd helpt bij de catering: voor kinderen geldt vaak een ander tarief.",
    nummer: "Welk nummer mag er niet ontbreken?",
    slapen: "Blijf je slapen?",
    ja: "Ja",
    nee: "Nee",
    berichtNee: "Wil je nog iets meegeven?",
    berichtJa: "Een berichtje voor het bruidspaar?",
    versturen: "Versturen",
    versturenBezig: "Versturen...",
    privacy: "Je gegevens gaan naar het bruidspaar.",
    foutKomt: "Laat even weten of je erbij bent.",
    foutVoornaam: "Vul je voornaam in.",
    foutVersturen: "Versturen mislukte, probeer het zo nog eens.",
    bijgewerkt: "Je antwoord is bijgewerkt",
    totDan: "Leuk, tot dan!",
    jammerBedankt: "Jammer, bedankt voor het laten weten",
    genoteerd: "We hebben alles genoteerd.",
    rekening: "We houden er rekening mee. De officiële uitnodiging volgt nog.",
    jammer: "We vinden het jammer, maar fijn dat je het laat weten.",
    tochAanpassen: "Toch iets aanpassen",
    deadline: "De aanmeldtermijn is verstreken. Neem even contact op met het bruidspaar.",
    eerderEen: "Op dit toestel meldde je eerder aan:",
    eerderMeer: "Op dit toestel zijn eerder aangemeld:",
    datAanpassen: "Dat aanpassen",
    iemandAnders: "Iemand anders aanmelden",
    blijftStaan: "Wat eerder is ingevuld blijft staan",
    persoonlijk: "Fijn dat je er bent. Je namen staan er al; kies of je erbij bent.",
    jePast: "Je past je eerdere aanmelding aan.",
    tochAnders: "Toch iemand anders?",
    en: "en",
  },
  en: {
    benJeErbij: "Will you be there?",
    aanmelden: "RSVP",
    jaErbij: "Yes, I'll be there",
    neeNiet: "No, I can't make it",
    hoeveel: "How many adults are coming?",
    jij: "You",
    persoon: (n) => `Guest ${n}`,
    voornaam: "First name",
    achternaam: "Last name",
    email: "Email address",
    telefoon: "Phone (optional)",
    adres: "Address for the invitation\n12 High Street, Town, Postcode",
    dieet: "Dietary needs, e.g. vegetarian",
    allergie: "Allergy, e.g. nuts",
    kinderenMee: "Are you bringing children?",
    naamKind: "Child's name",
    leeftijd: "Age",
    kindDieet: (naam) => `Dietary needs or allergy for ${naam} (optional)`,
    nogEenKind: "Add another child",
    leeftijdUitleg: "The age helps with catering: children often have a different rate.",
    nummer: "Which song can't be missed?",
    slapen: "Will you stay the night?",
    ja: "Yes",
    nee: "No",
    berichtNee: "Anything you'd like to add?",
    berichtJa: "A message for the couple?",
    versturen: "Send",
    versturenBezig: "Sending...",
    privacy: "Your details go to the couple.",
    foutKomt: "Let us know if you'll be there.",
    foutVoornaam: "Please enter your first name.",
    foutVersturen: "Sending failed, please try again in a moment.",
    bijgewerkt: "Your answer has been updated",
    totDan: "Lovely, see you then!",
    jammerBedankt: "What a shame, thanks for letting us know",
    genoteerd: "We've noted everything down.",
    rekening: "We'll count you in. The official invitation will follow.",
    jammer: "We're sorry you can't make it, but thank you for letting us know.",
    tochAanpassen: "Change something",
    deadline: "The RSVP deadline has passed. Please get in touch with the couple.",
    eerderEen: "You already replied on this device:",
    eerderMeer: "Already replied on this device:",
    datAanpassen: "Change that",
    iemandAnders: "Reply for someone else",
    blijftStaan: "Earlier replies stay as they are",
    persoonlijk: "Lovely to see you. Your names are already filled in; just let us know if you'll be there.",
    jePast: "You're changing your earlier reply.",
    tochAnders: "Someone else after all?",
    en: "and",
  },
  fr: {
    benJeErbij: "Serez-vous là ?",
    aanmelden: "Répondre",
    jaErbij: "Oui, je serai là",
    neeNiet: "Non, je ne peux pas",
    hoeveel: "Combien d'adultes viendront ?",
    jij: "Vous",
    persoon: (n) => `Personne ${n}`,
    voornaam: "Prénom",
    achternaam: "Nom",
    email: "Adresse e-mail",
    telefoon: "Téléphone (facultatif)",
    adres: "Adresse pour le faire-part\n12 rue de la Paix, 75002 Paris",
    dieet: "Régime, par ex. végétarien",
    allergie: "Allergie, par ex. noix",
    kinderenMee: "Venez-vous avec des enfants ?",
    naamKind: "Prénom de l'enfant",
    leeftijd: "Âge",
    kindDieet: (naam) => `Régime ou allergie de ${naam} (facultatif)`,
    nogEenKind: "Ajouter un enfant",
    leeftijdUitleg: "L'âge aide pour le traiteur : les enfants ont souvent un autre tarif.",
    nummer: "Quelle chanson ne doit pas manquer ?",
    slapen: "Restez-vous dormir ?",
    ja: "Oui",
    nee: "Non",
    berichtNee: "Souhaitez-vous ajouter quelque chose ?",
    berichtJa: "Un petit mot pour les mariés ?",
    versturen: "Envoyer",
    versturenBezig: "Envoi...",
    privacy: "Vos informations sont transmises aux mariés.",
    foutKomt: "Dites-nous si vous serez là.",
    foutVoornaam: "Indiquez votre prénom.",
    foutVersturen: "L'envoi a échoué, réessayez dans un instant.",
    bijgewerkt: "Votre réponse a été mise à jour",
    totDan: "Super, à bientôt !",
    jammerBedankt: "Dommage, merci de nous avoir prévenus",
    genoteerd: "Nous avons tout noté.",
    rekening: "Nous comptons sur vous. L'invitation officielle suivra.",
    jammer: "C'est dommage, mais merci de nous prévenir.",
    tochAanpassen: "Modifier quelque chose",
    deadline: "La date limite de réponse est passée. Contactez les mariés.",
    eerderEen: "Vous avez déjà répondu sur cet appareil :",
    eerderMeer: "Déjà répondu sur cet appareil :",
    datAanpassen: "Modifier cela",
    iemandAnders: "Répondre pour quelqu'un d'autre",
    blijftStaan: "Les réponses précédentes restent inchangées",
    persoonlijk: "Ravis de vous voir. Vos noms sont déjà remplis ; dites-nous simplement si vous serez là.",
    jePast: "Vous modifiez votre réponse précédente.",
    tochAnders: "Quelqu'un d'autre finalement ?",
    en: "et",
  },
  de: {
    benJeErbij: "Bist du dabei?",
    aanmelden: "Anmelden",
    jaErbij: "Ja, ich bin dabei",
    neeNiet: "Nein, ich kann nicht",
    hoeveel: "Mit wie vielen Erwachsenen kommst du?",
    jij: "Du",
    persoon: (n) => `Person ${n}`,
    voornaam: "Vorname",
    achternaam: "Nachname",
    email: "E-Mail-Adresse",
    telefoon: "Telefon (optional)",
    adres: "Adresse für die Einladung\nMusterstraße 12, 12345 Stadt",
    dieet: "Ernährung, z. B. vegetarisch",
    allergie: "Allergie, z. B. Nüsse",
    kinderenMee: "Kommen Kinder mit?",
    naamKind: "Name des Kindes",
    leeftijd: "Alter",
    kindDieet: (naam) => `Ernährung oder Allergie von ${naam} (optional)`,
    nogEenKind: "Noch ein Kind",
    leeftijdUitleg: "Das Alter hilft beim Catering: Für Kinder gilt oft ein anderer Preis.",
    nummer: "Welches Lied darf nicht fehlen?",
    slapen: "Übernachtest du?",
    ja: "Ja",
    nee: "Nein",
    berichtNee: "Möchtest du noch etwas sagen?",
    berichtJa: "Eine Nachricht für das Brautpaar?",
    versturen: "Absenden",
    versturenBezig: "Wird gesendet...",
    privacy: "Deine Angaben gehen an das Brautpaar.",
    foutKomt: "Sag uns bitte, ob du dabei bist.",
    foutVoornaam: "Bitte gib deinen Vornamen ein.",
    foutVersturen: "Senden fehlgeschlagen, versuch es gleich noch einmal.",
    bijgewerkt: "Deine Antwort wurde aktualisiert",
    totDan: "Schön, bis dann!",
    jammerBedankt: "Schade, danke, dass du Bescheid sagst",
    genoteerd: "Wir haben alles notiert.",
    rekening: "Wir planen mit dir. Die offizielle Einladung folgt noch.",
    jammer: "Schade, aber schön, dass du Bescheid sagst.",
    tochAanpassen: "Doch etwas ändern",
    deadline: "Die Anmeldefrist ist abgelaufen. Melde dich bitte beim Brautpaar.",
    eerderEen: "Auf diesem Gerät hast du dich schon angemeldet:",
    eerderMeer: "Auf diesem Gerät schon angemeldet:",
    datAanpassen: "Das ändern",
    iemandAnders: "Jemand anderen anmelden",
    blijftStaan: "Frühere Antworten bleiben bestehen",
    persoonlijk: "Schön, dass du da bist. Deine Namen stehen schon da; sag uns nur, ob du dabei bist.",
    jePast: "Du änderst deine frühere Anmeldung.",
    tochAnders: "Doch jemand anderes?",
    en: "und",
  },
  es: {
    benJeErbij: "¿Vienes?",
    aanmelden: "Confirmar asistencia",
    jaErbij: "Sí, allí estaré",
    neeNiet: "No, no puedo",
    hoeveel: "¿Cuántos adultos venís?",
    jij: "Tú",
    persoon: (n) => `Persona ${n}`,
    voornaam: "Nombre",
    achternaam: "Apellido",
    email: "Correo electrónico",
    telefoon: "Teléfono (opcional)",
    adres: "Dirección para la invitación\nCalle Mayor 12, 28013 Madrid",
    dieet: "Dieta, p. ej. vegetariana",
    allergie: "Alergia, p. ej. frutos secos",
    kinderenMee: "¿Vienen niños?",
    naamKind: "Nombre del niño",
    leeftijd: "Edad",
    kindDieet: (naam) => `Dieta o alergia de ${naam} (opcional)`,
    nogEenKind: "Añadir otro niño",
    leeftijdUitleg: "La edad ayuda con el catering: los niños suelen tener otra tarifa.",
    nummer: "¿Qué canción no puede faltar?",
    slapen: "¿Te quedas a dormir?",
    ja: "Sí",
    nee: "No",
    berichtNee: "¿Quieres añadir algo?",
    berichtJa: "¿Un mensaje para los novios?",
    versturen: "Enviar",
    versturenBezig: "Enviando...",
    privacy: "Tus datos van a los novios.",
    foutKomt: "Dinos si vienes.",
    foutVoornaam: "Escribe tu nombre.",
    foutVersturen: "No se pudo enviar, inténtalo de nuevo en un momento.",
    bijgewerkt: "Tu respuesta se ha actualizado",
    totDan: "¡Genial, nos vemos!",
    jammerBedankt: "Qué pena, gracias por avisar",
    genoteerd: "Lo hemos apuntado todo.",
    rekening: "Contamos contigo. La invitación oficial llegará pronto.",
    jammer: "Nos da pena, pero gracias por avisarnos.",
    tochAanpassen: "Cambiar algo",
    deadline: "El plazo para confirmar ha terminado. Ponte en contacto con los novios.",
    eerderEen: "Ya respondiste en este dispositivo:",
    eerderMeer: "Ya respondieron en este dispositivo:",
    datAanpassen: "Cambiar eso",
    iemandAnders: "Responder por otra persona",
    blijftStaan: "Las respuestas anteriores se mantienen",
    persoonlijk: "Qué bien verte. Tus nombres ya están; solo dinos si vienes.",
    jePast: "Estás cambiando tu respuesta anterior.",
    tochAnders: "¿Otra persona al final?",
    en: "y",
  },
  it: {
    benJeErbij: "Ci sarai?",
    aanmelden: "Conferma presenza",
    jaErbij: "Sì, ci sarò",
    neeNiet: "No, non posso",
    hoeveel: "Quanti adulti venite?",
    jij: "Tu",
    persoon: (n) => `Persona ${n}`,
    voornaam: "Nome",
    achternaam: "Cognome",
    email: "Indirizzo email",
    telefoon: "Telefono (facoltativo)",
    adres: "Indirizzo per la partecipazione\nVia Roma 12, 00100 Roma",
    dieet: "Dieta, per es. vegetariana",
    allergie: "Allergia, per es. frutta a guscio",
    kinderenMee: "Vengono dei bambini?",
    naamKind: "Nome del bambino",
    leeftijd: "Età",
    kindDieet: (naam) => `Dieta o allergia di ${naam} (facoltativo)`,
    nogEenKind: "Aggiungi un bambino",
    leeftijdUitleg: "L'età aiuta con il catering: per i bambini spesso vale un'altra tariffa.",
    nummer: "Quale canzone non può mancare?",
    slapen: "Ti fermi a dormire?",
    ja: "Sì",
    nee: "No",
    berichtNee: "Vuoi aggiungere qualcosa?",
    berichtJa: "Un messaggio per gli sposi?",
    versturen: "Invia",
    versturenBezig: "Invio...",
    privacy: "I tuoi dati vanno agli sposi.",
    foutKomt: "Facci sapere se ci sarai.",
    foutVoornaam: "Inserisci il tuo nome.",
    foutVersturen: "Invio non riuscito, riprova tra poco.",
    bijgewerkt: "La tua risposta è stata aggiornata",
    totDan: "Che bello, a presto!",
    jammerBedankt: "Peccato, grazie per avercelo detto",
    genoteerd: "Abbiamo preso nota di tutto.",
    rekening: "Contiamo su di te. L'invito ufficiale arriverà.",
    jammer: "Ci dispiace, ma grazie per avercelo fatto sapere.",
    tochAanpassen: "Modifica qualcosa",
    deadline: "Il termine per confermare è scaduto. Contatta gli sposi.",
    eerderEen: "Hai già risposto da questo dispositivo:",
    eerderMeer: "Hanno già risposto da questo dispositivo:",
    datAanpassen: "Modifica",
    iemandAnders: "Rispondi per un'altra persona",
    blijftStaan: "Le risposte precedenti restano invariate",
    persoonlijk: "Che bello vederti. I tuoi nomi ci sono già; dicci solo se ci sarai.",
    jePast: "Stai modificando la tua risposta precedente.",
    tochAnders: "Un'altra persona, alla fine?",
    en: "e",
  },
}

export function formulierTekst(taal: CardTaal | undefined): FormulierTeksten {
  return FORMULIER_TEKST[taal ?? "nl"] ?? FORMULIER_TEKST.nl
}
