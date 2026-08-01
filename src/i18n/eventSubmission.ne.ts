import type {EventSubmissionCopy} from './eventSubmission'

export const eventSubmissionNe = {
  metaTitle: 'कार्यक्रम पठाउनुहोस् | nepali.no',
  metaDescription: 'नर्वेमा नेपाली समुदायसँग सम्बन्धित कार्यक्रम nepali.no को समीक्षाका लागि पठाउनुहोस्।',
  eyebrow: 'समुदायको सहभागिता',
  title: 'कार्यक्रम पठाउनुहोस्',
  introduction: 'आफ्नो संस्था वा समुदायको कार्यक्रमको जानकारी पठाउनुहोस्। nepali.no को टोलीले जानकारी जाँच गरेपछि मात्र सार्वजनिक गर्ने निर्णय गर्छ।',
  beforeYouBeginTitle: 'सुरु गर्नुअघि',
  beforeYouBeginItems: [
    'कार्यक्रमसँग सम्बन्धित सही र अद्यावधिक जानकारी तयार राख्नुहोस्।',
    'कार्यक्रम पठाउँदैमा प्रकाशित हुने सुनिश्चित हुँदैन।',
    'निजी सम्पर्क विवरण समीक्षा र आवश्यक सम्पर्कका लागि मात्र प्रयोग गरिन्छ।',
  ],
  requiredNotice: 'ताराङ्कित (*) विवरण अनिवार्य छन्।',
  privateNotice: 'यो सम्पर्क जानकारी निजी रहन्छ र nepali.no को समीक्षा टोलीले मात्र प्रयोग गर्छ।',
  publicContactNotice: 'यहाँ राखिएको जानकारी अनुमति दिएपछि मात्र सार्वजनिक कार्यक्रम पृष्ठमा प्रयोग गर्न सकिन्छ।',
  sections: {
    language: 'भाषा र प्रकाशन प्राथमिकता', organizer: 'आयोजकको निजी सम्पर्क', publicContact: 'सार्वजनिक गर्न मिल्ने आयोजक विवरण',
    event: 'कार्यक्रमको जानकारी', location: 'मिति, स्थान वा अनलाइन पहुँच', registration: 'दर्ता र शुल्क', image: 'वैकल्पिक तस्बिर प्रस्ताव', declarations: 'घोषणा र सहमति',
  },
  fields: {
    formInterfaceLanguage: 'फारामको भाषा', submissionLanguage: 'पठाइएको जानकारीको भाषा', otherSubmissionLanguage: 'अन्य भाषा उल्लेख गर्नुहोस्', requestedPublicLanguage: 'सार्वजनिक पृष्ठको प्राथमिक भाषा',
    organizerName: 'आयोजक संस्था वा समूहको नाम', privateContactName: 'सम्पर्क व्यक्तिको नाम', privateContactEmail: 'निजी इमेल', privateContactPhone: 'निजी फोन नम्बर', preferredContactLanguage: 'सम्पर्कका लागि रुचाइएको भाषा', otherPreferredContactLanguage: 'अन्य सम्पर्क भाषा',
    publicOrganizerName: 'सार्वजनिक आयोजक नाम', publicOrganizerUrl: 'सार्वजनिक वेबसाइट वा पृष्ठ', publicOrganizerEmail: 'सार्वजनिक इमेल', publicOrganizerPhone: 'सार्वजनिक फोन', publicContactPermission: 'प्रस्तावित सार्वजनिक सम्पर्क विवरण प्रकाशित गर्न अनुमति दिन्छु',
    proposedTitle: 'कार्यक्रमको शीर्षक', summary: 'छोटो सारांश', descriptionPlainText: 'कार्यक्रमको विस्तृत विवरण', eventLanguages: 'कार्यक्रममा प्रयोग हुने भाषा', otherEventLanguage: 'अन्य कार्यक्रम भाषा', eventType: 'कार्यक्रमको प्रकार', eventFormat: 'कार्यक्रमको स्वरूप', isAllDay: 'दिनभर चल्ने कार्यक्रम',
    startDateTime: 'सुरु हुने मिति र समय', endDateTime: 'समाप्त हुने मिति र समय', venueName: 'स्थानको नाम', address: 'ठेगाना', postalCode: 'हुलाक कोड', city: 'सहर', mapUrl: 'नक्साको लिंक', onlinePlatform: 'अनलाइन प्लेटफर्म', onlineInformationUrl: 'अनलाइन पहुँच वा जानकारीको लिंक', accessibilityInformation: 'पहुँचसम्बन्धी जानकारी', transportInformation: 'यातायात वा पार्किङ जानकारी', intendedAudience: 'लक्षित वर्ग', sourceUrl: 'मूल कार्यक्रम वा सार्वजनिक स्रोतको लिंक',
    registrationRequirement: 'दर्ताको आवश्यकता', registrationStatus: 'दर्ताको अवस्था', registrationUrl: 'दर्ता वा टिकटको लिंक', registrationDeadline: 'दर्ताको अन्तिम मिति', isFree: 'निःशुल्क कार्यक्रम', priceDescription: 'शुल्कको विवरण',
    proposedImageUrl: 'प्रस्तावित तस्बिरको लिंक', imageAltSuggestion: 'तस्बिरको वैकल्पिक विवरण', imageCredit: 'तस्बिर श्रेय', imagePermissionConfirmed: 'तस्बिर प्रयोग र प्रकाशन गर्ने अधिकार भएको पुष्टि गर्छु',
    authorityConfirmed: 'यो कार्यक्रम पठाउने अधिकार मसँग छ', accuracyConfirmed: 'दिइएको जानकारी मेरो जानकारीअनुसार सही छ', editingTranslationAccepted: 'nepali.no ले सम्पादन वा अनुवाद गर्न सक्ने स्वीकार गर्छु', publicationNotGuaranteedAccepted: 'पठाउँदैमा प्रकाशन सुनिश्चित नहुने स्वीकार गर्छु', privacyRetentionAccepted: 'गोपनीयता र आवश्यक अवधिसम्म जानकारी राख्ने व्यवस्था स्वीकार गर्छु',
  },
  help: {
    submissionLanguage: 'तपाईंले विवरण लेख्न प्रयोग गरेको मुख्य भाषा छान्नुहोस्।', requestedPublicLanguage: 'अन्तिम भाषा र सम्पादकीय रूप nepali.no ले उपलब्ध क्षमता र आवश्यकताअनुसार तय गर्न सक्छ।', privateContact: 'यो जानकारी सार्वजनिक पृष्ठमा स्वतः देखाइँदैन।', publicContact: 'जनताले सम्पर्क गर्न मिल्ने विवरण मात्र राख्नुहोस्।', publicContactPermission: 'सार्वजनिक इमेल वा फोन राख्दा स्पष्ट अनुमति अनिवार्य छ।',
    summary: 'मुख्य जानकारी २–४ वाक्यमा लेख्नुहोस्।', descriptionPlainText: 'उद्देश्य, कार्यक्रम, समयतालिका र सहभागीका लागि उपयोगी विवरण समावेश गर्नुहोस्।', eventLanguages: 'कार्यक्रममा सहभागी हुन प्रयोग वा बुझ्नुपर्ने सबै भाषा छान्नुहोस्।', onlineAccessRequirement: 'अनलाइन वा हाइब्रिड कार्यक्रमका लागि अनलाइन प्लेटफर्म वा सार्वजनिक जानकारीको लिंकमध्ये कम्तीमा एउटा दिनुहोस्।', sourceUrl: 'सम्भव भए आयोजकको आधिकारिक कार्यक्रम पृष्ठ दिनुहोस्।', proposedImageUrl: 'प्रत्यक्ष अपलोड अहिले उपलब्ध छैन। सार्वजनिक रूपमा पहुँचयोग्य लिंक मात्र दिनुहोस्।', imagePermissionConfirmed: 'तस्बिरको अधिकार स्पष्ट नभए लिंक नदिनुहोस्।', privacyRetentionAccepted: 'समीक्षा, सम्पर्क र अभिलेख व्यवस्थापनका लागि आवश्यक अवधिसम्म जानकारी राख्न सकिन्छ।',
  },
  options: {
    interfaceLanguages: {ne: 'नेपाली', nb: 'नर्वेजियन', en: 'अंग्रेजी'},
    submissionLanguages: {ne: 'नेपाली', nb: 'नर्वेजियन', en: 'अंग्रेजी', other: 'अन्य'},
    publicLanguages: {ne: 'नेपाली', nb: 'नर्वेजियन', both: 'नेपाली र नर्वेजियन दुवै', editorialDecision: 'प्राथमिकता छैन, सम्पादकीय निर्णय'},
    contactLanguages: {ne: 'नेपाली', nb: 'नर्वेजियन', en: 'अंग्रेजी', other: 'अन्य'},
    eventFormats: {inPerson: 'भौतिक उपस्थिति', online: 'अनलाइन', hybrid: 'भौतिक र अनलाइन'},
  },
  actions: {submit: 'समीक्षाका लागि पठाउनुहोस्', submitting: 'पठाइँदैछ…', returnToEvents: 'कार्यक्रमहरूमा फर्कनुहोस्', useNepali: 'नेपाली', useNorwegian: 'Norsk', useEnglish: 'English'},
  messages: {
    validationSummaryTitle: 'केही विवरण जाँच गर्नुहोस्', validationSummaryBody: 'चिन्ह लगाइएका विवरण सच्याएर फेरि पठाउनुहोस्।', successTitle: 'कार्यक्रम प्राप्त भयो', successBody: 'तपाईंको कार्यक्रम प्रस्ताव समीक्षाका लागि सुरक्षित रूपमा प्राप्त भएको छ।', successReference: 'पठाइएको सन्दर्भ नम्बर', publicationNotice: 'प्रस्ताव प्राप्त हुनु प्रकाशनको ग्यारेन्टी होइन।', rateLimited: 'छोटो समयमा धेरै प्रयास भएको छ। केही समयपछि फेरि प्रयास गर्नुहोस्।', temporarilyUnavailable: 'कार्यक्रम पठाउने सेवा अहिले अस्थायी रूपमा उपलब्ध छैन।', storageFailed: 'कार्यक्रम सुरक्षित गर्न सकिएन। कृपया केही समयपछि फेरि प्रयास गर्नुहोस्।', networkFailed: 'नेटवर्क समस्या भयो। इन्टरनेट जाँच गरेर फेरि प्रयास गर्नुहोस्।', unexpectedError: 'अप्रत्याशित समस्या भयो। कृपया फेरि प्रयास गर्नुहोस्।',
  },
} as const satisfies EventSubmissionCopy
