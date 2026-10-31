// Initial editorial drafts for the four AI transparency documents.
// - Initial editorial draft: drafted from the implementation specification, to be refined in Sanity Studio.
// - Requires editorial review before publication.
// - Must be imported as drafts (stable "drafts." IDs) and never published automatically.
// - Rerunning the import must not overwrite an existing document (use `sanity dataset import --missing`).
// Inline parts: a string, {strong}, {em}, or {page: <pageKey>, text} for an internal link.

const nePrinciple =
  'एआईले काममा सहयोग गर्न सक्छ, तर प्रकाशित सामग्रीको निर्णय, जाँच र जिम्मेवारी सधैं मानिसकै हुन्छ।'
const nbPrinciple =
  'KI kan støtte arbeidet, men beslutningen, kontrollen og ansvaret for publisert innhold ligger alltid hos mennesker.'

export const aiTransparencyPages = [
  {
    pageKey: 'aiInformation',
    language: 'ne',
    title: 'nepali.no मा एआईको प्रयोग',
    summary:
      'nepali.no ले एआईलाई सहयोगी उपकरणका रूपमा कहाँ प्रयोग गर्न सक्छ, र प्रकाशित सामग्रीको जिम्मेवारी कसले लिन्छ भन्ने छोटो जानकारी।',
    seoTitle: 'nepali.no मा एआईको प्रयोग',
    seoDescription:
      'nepali.no ले एआईलाई सहयोगी उपकरणका रूपमा कसरी प्रयोग गर्न सक्छ र प्रकाशित सामग्रीको जिम्मेवारी कसरी मानवीय रूपमा रहन्छ भन्ने छोटो जानकारी।',
    body: [
      {h2: 'यस सन्दर्भमा एआई भनेको के हो?'},
      {
        p: 'nepali.no मा एआई भन्नाले लेखन, भाषा र सामग्री तयारीका काममा सहयोग गर्न सक्ने कम्प्युटर प्रणाली हो। यो स्वतन्त्र सम्पादक होइन; यो सहयोगी उपकरण मात्र हो।',
      },
      {h2: 'एआईले कुन कुन काममा सहयोग गर्न सक्छ?'},
      {
        ul: [
          'लेखको मस्यौदा तयार गर्न',
          'अनुवाद गर्न',
          'भाषा परिमार्जन गर्न',
          'सारांश तयार गर्न',
          'अनुसन्धान सामग्री मिलाउन',
          'दृश्य सामग्री तयार गर्न',
        ],
      },
      {h2: 'जिम्मेवारी मानिसकै हुन्छ'},
      {
        ul: [
          'एआईको नतीजालाई तथ्यको स्रोत मानिँदैन।',
          'सम्पादकीय जिम्मेवारी nepali.no ले नै राख्छ।',
          'एआईको सहयोगमा तयार भएको सामग्री आफैं प्रकाशित हुँदैन।',
        ],
      },
      {h2: 'चित्र र दृश्य सामग्री'},
      {
        p: 'हाल प्रयोग भइरहेका अधिकांश सम्पादकीय चित्र एआईले बनाएका सम्पादकीय चित्रण हुन्। यी वृत्तचित्रात्मक तस्बिर होइनन्।',
      },
      {h2: '‘छोटकरीमा’ सारांश'},
      {
        p: 'लेख र गाइडमा देखिने ‘छोटकरीमा’ का बुँदा सुरक्षित गरिएका हुन् र प्रकाशनअघि सम्पादकीय रूपमा जाँचिन्छन्।',
      },
      {h2: 'गल्ती वा अस्पष्ट खुलासा देखे के गर्ने?'},
      {
        p: [
          'कुनै गल्ती, अस्पष्ट जानकारी वा एआईको प्रयोगबारे अस्पष्ट खुलासा देखे ',
          {page: 'contact', text: 'सम्पर्क पृष्ठ'},
          'मार्फत हामीलाई जानकार गराउनुहोस्।',
        ],
      },
      {quote: nePrinciple},
      {
        p: [
          {
            page: 'aiGuidelines',
            text: 'nepali.no का विस्तृत सम्पादकीय एआईसम्बन्धी दिशानिर्देश पढ्नुहोस्।',
          },
        ],
      },
    ],
  },
  {
    pageKey: 'aiInformation',
    language: 'nb',
    title: 'Bruk av KI i nepali.no',
    summary:
      'Kort informasjon om hvor nepali.no kan bruke KI som støtteverktøy, og hvem som har ansvaret for publisert innhold.',
    seoTitle: 'Bruk av KI i nepali.no',
    seoDescription:
      'Kort informasjon om hvordan nepali.no kan bruke KI som støtteverktøy, og hvorfor ansvaret for publisert innhold alltid ligger hos mennesker.',
    body: [
      {h2: 'Hva betyr KI hos nepali.no?'},
      {
        p: 'Med KI mener vi datasystemer som kan støtte arbeid med tekst, språk og innholdsproduksjon. KI er ikke en selvstendig redaktør, men et støtteverktøy.',
      },
      {h2: 'Hva kan KI støtte?'},
      {
        ul: [
          'utkast til tekster',
          'oversettelse',
          'språkvask og språklig revisjon',
          'sammendrag',
          'organisering av research',
          'produksjon av visuelt innhold',
        ],
      },
      {h2: 'Ansvaret ligger hos mennesker'},
      {
        ul: [
          'KI-resultater regnes ikke som en faktakilde.',
          'nepali.no har det redaksjonelle ansvaret.',
          'Innhold laget med støtte fra KI publiseres ikke automatisk.',
        ],
      },
      {h2: 'Bilder og visuelt innhold'},
      {
        p: 'De fleste redaksjonelle illustrasjonene som brukes nå, er KI-genererte redaksjonelle illustrasjoner. De er ikke dokumentariske fotografier.',
      },
      {h2: 'Sammendrag i «Kort fortalt»'},
      {
        p: 'Punktene i sammendragene i artikler og veiledninger er lagret og gjennomgås redaksjonelt før publisering.',
      },
      {h2: 'Se feil eller uklar merking?'},
      {
        p: [
          'Hvis du oppdager feil eller uklar merking av KI-bruk, kan du si fra via ',
          {page: 'contact', text: 'kontaktsiden'},
          '.',
        ],
      },
      {quote: nbPrinciple},
      {
        p: [
          {
            page: 'aiGuidelines',
            text: 'Les nepali.no sine fullstendige redaksjonelle retningslinjer for bruk av KI.',
          },
        ],
      },
    ],
  },
  {
    pageKey: 'aiGuidelines',
    language: 'ne',
    title: 'nepali.no का सम्पादकीय एआईसम्बन्धी दिशानिर्देश',
    summary:
      'nepali.no ले सम्पादकीय काममा एआईलाई कुन सीमाभित्र र कुन जिम्मेवारीसहित प्रयोग गर्छ भन्ने विस्तृत दिशानिर्देश।',
    seoTitle: 'nepali.no का सम्पादकीय एआईसम्बन्धी दिशानिर्देश',
    seoDescription:
      'nepali.no का सम्पादकीय एआई दिशानिर्देश: मानवीय जिम्मेवारी, तथ्य जाँच, एआईले बनाएका चित्र, सारांश, अनुवाद, स्वचालित प्रकाशन नहुने नियम र सच्याइ।',
    body: [
      {
        p: [
          'यो पृष्ठमा सम्पादकीय कामका लागि एआईसम्बन्धी हाम्रा नियम विस्तारमा छन्। छोटो जानकारीका लागि ',
          {page: 'aiInformation', text: 'nepali.no मा एआईको प्रयोग'},
          ' पृष्ठ हेर्न सकिन्छ।',
        ],
      },
      {h2: '१. मानवीय सम्पादकीय जिम्मेवारी'},
      {
        p: 'एआई सहयोगी उपकरण हो, स्वतन्त्र सम्पादक होइन। के प्रकाशित गर्ने, कसरी प्रस्तुत गर्ने र के सच्याउने भन्ने अन्तिम निर्णय सधैं मानिसले गर्छ। प्रकाशित सामग्रीको जिम्मेवारी nepali.no मै रहन्छ।',
      },
      {h2: '२. लेखन र भाषासम्बन्धी कामहरूमा एआईको सहयोग'},
      {
        p: 'मस्यौदा तयार गर्न, भाषा परिमार्जन गर्न र अनुसन्धान सामग्री मिलाउन एआईलाई सहयोगका रूपमा प्रयोग गर्न सकिन्छ। यसरी तयार भएको सामग्री प्रकाशनअघि मानिसले पढ्छ, जाँच्छ र आवश्यक परे सच्याउँछ।',
      },
      {h2: '३. तथ्य जाँच र स्रोत'},
      {
        p: 'एआईको उत्तर तथ्यको स्रोत होइन। तथ्य, तथ्याङ्क, नाम, मिति र नियमहरू भरपर्दो स्रोतबाट जाँचिनुपर्छ। सरकारी निकायसम्बन्धी जानकारीमा सम्बन्धित आधिकारिक स्रोतलाई प्राथमिकता दिइन्छ।',
      },
      {h2: '४. एआईले बनाएका सम्पादकीय चित्र'},
      {
        p: 'हाल लेख र गाइडमा प्रयोग भएका अधिकांश दृश्य सामग्री एआईले बनाएका सम्पादकीय चित्रण हुन्। यिनलाई वृत्तचित्रात्मक तस्बिरका रूपमा वर्णन गरिँदैन, र कुनै वास्तविक घटना वा व्यक्तिको प्रमाणका रूपमा प्रस्तुत गरिँदैन।',
      },
      {h2: '५. वास्तविक तथा बाहिरबाट प्राप्त तस्बिर'},
      {
        p: 'वास्तविक वा बाहिरबाट प्राप्त तस्बिर पनि प्रयोग हुन सक्छन्। त्यस्ता तस्बिरमा उपयुक्त स्रोत र अधिकारसम्बन्धी जानकारी दिनुपर्छ।',
      },
      {h2: '६. एआईको सहयोगमा तयार पारिएका सारांश'},
      {
        ul: [
          '‘छोटकरीमा’ का बुँदा सुरक्षित गरिएका हुन् र प्रकाशनअघि सम्पादकीय रूपमा जाँचिन्छन्।',
          'सार्वजनिक वेबसाइटले हरेक पाठकका लागि नयाँ सारांश बनाउँदैन।',
          'Sanity Studio मा स्वचालित रूपमा सारांश बनाउने सुविधा हाल लागू गरिएको छैन।',
          'भविष्यमा ‘एआईबाट मस्यौदा बनाउनुहोस्’ जस्तो सुविधा थपिएमा त्यसले सम्पादन गर्न मिल्ने बुँदा मात्र प्रस्ताव गर्न सक्छ, र कहिल्यै आफैं प्रकाशित गर्दैन।',
        ],
      },
      {h2: '७. अनुवाद र भाषा परिमार्जन'},
      {
        p: 'नेपाली र नर्वेजियन भाषामा सामग्री अनुवाद वा परिमार्जन गर्दा एआईको सहयोग लिन सकिन्छ। अर्थ, शब्दावली र सन्दर्भ सही छन् कि छैनन् भनेर मानिसले जाँच गर्छ। सरकारी र कानुनी शब्दमा विशेष सावधानी अपनाइन्छ।',
      },
      {h2: '८. स्वचालित प्रकाशन छैन'},
      {
        p: 'एआईले तयार गरेको पाठ, सारांश, अनुवाद वा चित्र आफैं प्रकाशित हुँदैन। प्रत्येक सामग्री मानिसले स्वीकृत गरेपछि मात्र प्रकाशित हुन्छ।',
      },
      {h2: '९. व्यक्तिगत र संवेदनशील जानकारी'},
      {
        p: 'संवेदनशील व्यक्तिगत जानकारी एआई सेवामा लापरवाहीपूर्वक पठाइनु हुँदैन। व्यक्तिगत विवरण, गोप्य कागजात र पाठकसँगको निजी सञ्चारलाई विशेष सावधानीका साथ व्यवस्थापन गरिन्छ।',
      },
      {h2: '१०. पारदर्शिता र खुलासा'},
      {
        p: [
          'एआईको भूमिका पाठकका लागि सान्दर्भिक हुँदा त्यसबारे स्पष्ट जानकारी दिइन्छ। कुनै लेख वा गाइडमा ',
          {page: 'aiInformation', text: 'एआईको प्रयोगबारे छोटो जानकारी'},
          ' तर्फ लैजाने लिङ्क देखिन सक्छ। यो लिङ्कले तस्बिरको श्रेय वा ‘छोटकरीमा’ सारांशको एआईसम्बन्धी जानकारीलाई प्रतिस्थापन गर्दैन।',
        ],
      },
      {h2: '११. सच्याइ र पाठकसँग सम्पर्क'},
      {
        p: [
          'गल्ती, अस्पष्ट खुलासा वा अनुपयुक्त एआई प्रयोग देखिए ',
          {page: 'contact', text: 'सम्पर्क पृष्ठ'},
          'मार्फत जानकारी दिनुहोस्। सच्याइका लागि nepali.no जिम्मेवार रहन्छ।',
        ],
      },
      {h2: '१२. मूल सिद्धान्त'},
      {quote: nePrinciple},
    ],
  },
  {
    pageKey: 'aiGuidelines',
    language: 'nb',
    title: 'Redaksjonelle retningslinjer for bruk av KI i nepali.no',
    summary:
      'Fullstendige retningslinjer for hvordan nepali.no bruker KI i redaksjonelt arbeid, og hvilke grenser og ansvar som gjelder.',
    seoTitle: 'Redaksjonelle retningslinjer for bruk av KI i nepali.no',
    seoDescription:
      'nepali.no sine retningslinjer for KI: menneskelig ansvar, faktasjekk, KI-genererte illustrasjoner, sammendrag, oversettelse, ingen automatisk publisering og rettelser.',
    body: [
      {
        p: [
          'Denne siden beskriver reglene våre for KI i redaksjonelt arbeid i detalj. En kort oversikt finnes på siden ',
          {page: 'aiInformation', text: 'Bruk av KI i nepali.no'},
          '.',
        ],
      },
      {h2: '1. Menneskelig redaksjonelt ansvar'},
      {
        p: 'KI er et støtteverktøy, ikke en selvstendig redaktør. Den endelige beslutningen om hva som publiseres, hvordan det presenteres og hva som rettes, tas alltid av mennesker. Ansvaret for publisert innhold ligger hos nepali.no.',
      },
      {h2: '2. KI-støtte i skrive- og språkarbeid'},
      {
        p: 'KI kan brukes som støtte til utkast, språkvask og organisering av research. Innhold som er utarbeidet på denne måten, leses, kontrolleres og rettes av mennesker før publisering.',
      },
      {h2: '3. Faktasjekk og kilder'},
      {
        p: 'Svar fra KI er ikke en faktakilde. Fakta, tall, navn, datoer og regler må kontrolleres mot pålitelige kilder. For informasjon om offentlige tjenester prioriteres den ansvarlige myndighetens offisielle kilde.',
      },
      {h2: '4. KI-genererte redaksjonelle illustrasjoner'},
      {
        p: 'De fleste bildene i artikler og veiledninger er i dag KI-genererte redaksjonelle illustrasjoner. De beskrives ikke som dokumentariske fotografier, og de presenteres ikke som dokumentasjon av en faktisk hendelse eller en bestemt person.',
      },
      {h2: '5. Ekte fotografier og fotografier fra eksterne'},
      {
        p: 'Ekte fotografier og fotografier fra eksterne kan også brukes. Slike bilder skal ha passende opplysninger om kilde og rettigheter.',
      },
      {h2: '6. KI-støttede sammendrag'},
      {
        ul: [
          'Punktene i «Kort fortalt» er lagret og gjennomgås redaksjonelt før publisering.',
          'Det offentlige nettstedet lager ikke et nytt sammendrag for hver besøkende.',
          'Automatisk generering av sammendrag i Sanity Studio er foreløpig ikke innført.',
          'En fremtidig funksjon som «Generer utkast med KI» kan foreslå redigerbare punkter, men skal aldri publisere noe automatisk.',
        ],
      },
      {h2: '7. Oversettelse og språkrevisjon'},
      {
        p: 'KI kan støtte oversettelse og språkrevisjon mellom nepali og norsk. Mennesker kontrollerer at mening, terminologi og sammenheng er riktig, med særlig forsiktighet for offentlige og juridiske begreper.',
      },
      {h2: '8. Ingen automatisk publisering'},
      {
        p: 'Tekster, sammendrag, oversettelser og illustrasjoner laget med KI publiseres ikke automatisk. Alt innhold publiseres først etter menneskelig godkjenning.',
      },
      {h2: '9. Personlige og sensitive opplysninger'},
      {
        p: 'Sensitive personopplysninger skal ikke sendes til KI-tjenester uten vurdering. Personopplysninger, fortrolige dokumenter og privat kommunikasjon med lesere håndteres med særlig forsiktighet.',
      },
      {h2: '10. Åpenhet og merking'},
      {
        p: [
          'Når KIs rolle er relevant for leseren, skal det opplyses tydelig om det. På enkelte artikler og veiledninger kan det vises en lenke til ',
          {page: 'aiInformation', text: 'kort informasjon om bruk av KI'},
          '. Lenken erstatter ikke bildekreditering eller KI-merkingen i sammendraget «Kort fortalt».',
        ],
      },
      {h2: '11. Rettelser og kontakt med lesere'},
      {
        p: [
          'Hvis du oppdager feil, uklar merking eller uheldig bruk av KI, kan du si fra via ',
          {page: 'contact', text: 'kontaktsiden'},
          '. nepali.no er ansvarlig for rettelser.',
        ],
      },
      {h2: '12. Kjerneprinsippet'},
      {quote: nbPrinciple},
    ],
  },
]
