/**
 * Clinical Category Profiles Builder Script
 * SIH 2026 - Problem 26047
 * Generates 28 specialized clinical category modules with exactly 10 questions each
 */

const fs = require('fs');
const path = require('path');

const categories = [
  {
    id: "Shoulder_Pain",
    category: "Shoulder Pain",
    nameHi: "कंधे में दर्द व जकड़न (अवबाहुक)",
    nameEn: "Shoulder Pain & Frozen Shoulder",
    keywords: [
      "shoulder", "shoulder pain", "kandha", "kandhe", "kandhe me dard", "frozen shoulder",
      "rotator cuff", "bahu", "avabahuka", "apabahuka", "कंधा", "कंधे में दर्द", "कंधे", "अवबाहुक", "अपबाहुक"
    ],
    problem: "Shoulder Joint Pain & Limited Mobility (अवबाहुक / कंधा शूल)",
    redFlag: "Left shoulder/arm pain with diaphoresis or chest pressure (Suspected Acute Coronary Syndrome)",
    questions: [
      {
        id: "sh_loc_side",
        purpose: "location",
        hi: "दर्द किस कंधे में है? (बायां कंधा, दायां कंधा या दोनों तरफ?)",
        en: "Which shoulder is painful? (Left shoulder, Right shoulder, or Both?)",
        opts: [
          { val: "RIGHT_SHOULDER", hi: "दायां कंधा (Right Shoulder)", en: "Right Shoulder" },
          { val: "LEFT_SHOULDER", hi: "बायां कंधा (Left Shoulder)", en: "Left Shoulder", rf: true },
          { val: "BILATERAL_BOTH", hi: "दोनों कंधे (Both Shoulders)", en: "Both Shoulders" },
        ]
      },
      {
        id: "sh_severity_scale",
        purpose: "severity",
        hi: "१ से १० के पैमाने पर कंधे का दर्द कितना तीव्र है?",
        en: "On a scale of 1 to 10, how severe is your shoulder pain?",
        opts: [
          { val: "MILD_1_3", hi: "हल्का (१ से ३) - सामान्य काम कर पाते हैं", en: "Mild (1-3) - Full range" },
          { val: "MODERATE_4_6", hi: "मध्यम (४ से ६) - कपड़े पहनने या कंघी करने में कठिनाई", en: "Moderate (4-6) - Limited overhead" },
          { val: "SEVERE_7_10", hi: "अत्यधिक तेज (७ से १०) - हाथ हिलाना भी असहनीय", en: "Severe (7-10) - Unable to move arm", rf: true },
        ]
      },
      {
        id: "sh_onset_mode",
        purpose: "onset",
        hi: "यह दर्द कब से और कैसे शुरू हुआ? (चोट लगने से या धीरे-धीरे जकड़न के साथ?)",
        en: "How did the shoulder pain begin? (Trauma/fall, or gradual onset stiffness?)",
        opts: [
          { val: "ACUTE_FALL_TRAUMA", hi: "हाल ही में गिरने या भारी वजन उठाने से (Fall / Injury)", en: "After acute trauma / heavy lift" },
          { val: "GRADUAL_STIFFNESS", hi: "धीरे-धीरे कई हफ्तों से जकड़न बढ़ रही है (Frozen Shoulder pattern)", en: "Gradual stiffness over weeks/months" },
          { val: "SUDDEN_NO_INJURY", hi: "अचानक बिना किसी चोट के (Sudden non-traumatic)", en: "Sudden onset without trauma" },
        ]
      },
      {
        id: "sh_range_overhead",
        purpose: "character",
        hi: "क्या हाथ को सिर से ऊपर उठाने या पीठ के पीछे ले जाने में जोड़ अटकता या अत्यधिक दर्द होता है?",
        en: "Do you have restriction when raising arm overhead or reaching behind your back?",
        opts: [
          { val: "SEVERE_RESTRICTION", hi: "हाँ, हाथ ऊपर नहीं उठता व पीठ पर नहीं जाता (Severely restricted)", en: "Severely restricted in overhead & internal rotation" },
          { val: "MILD_PAIN_AT_END", hi: "अंत में हल्का दर्द होता है लेकिन हाथ उठ जाता है", en: "Mild pain at end of motion" },
          { val: "NORMAL_RANGE", hi: "गति सामान्य है, केवल मांसपेशियों में दर्द है", en: "Normal range, muscular ache only" },
        ]
      },
      {
        id: "sh_night_pain_sleep",
        purpose: "aggravating",
        hi: "क्या रात में उस करवट सोने पर तेज दर्द से नींद खुल जाती है?",
        en: "Does shoulder pain awaken you at night when lying on the affected side?",
        opts: [
          { val: "YES_NIGHT_PAIN", hi: "हाँ, रात को सोते समय दर्द बहुत बढ़ जाता है", en: "Yes, awakens from sleep" },
          { val: "NO_NIGHT_PAIN", hi: "नहीं, रात को आराम करने पर दर्द शांत रहता है", en: "No sleep disturbance" },
        ]
      },
      {
        id: "sh_radiation_neck_arm",
        purpose: "location",
        hi: "क्या दर्द कंधे से बांह, कोहनी या गर्दन की तरफ फैलता है?",
        en: "Does the pain radiate down into the arm, forearm, hand, or up towards the neck?",
        opts: [
          { val: "RADICULAR_FINGERS", hi: "हाँ, बांह और उंगलियों तक बिजली के झटके जैसी झनझनाहट", en: "Shooting down to fingers" },
          { val: "TO_NECK_TRAPEZIUS", hi: "हाँ, गर्दन और पीठ के ऊपरी हिस्से में", en: "Radiates up to neck / upper back" },
          { val: "STRICTLY_SHOULDER", hi: "नहीं, केवल कंधे के जोड़ पर सीमित है", en: "Strictly localized to shoulder joint" },
        ]
      },
      {
        id: "sh_cardiac_redflag",
        purpose: "red_flag",
        hi: "क्या बाएं कंधे के दर्द के साथ सीने में भारीपन, सांस फूलना या ठंडा पसीना आ रहा है?",
        en: "Is the left shoulder pain accompanied by chest heaviness, shortness of breath, or cold sweating?",
        opts: [
          { val: "YES_CARDIAC_SIGNS", hi: "हाँ, सीने में भारीपन / सांस फूलना / पसीना है (Cardiac Red Flag)", en: "Yes, accompanied by chest pressure/dyspnea", rf: true },
          { val: "NO_CARDIAC_SIGNS", hi: "नहीं, छाती में कोई परेशानी नहीं है", en: "No chest discomfort" },
        ]
      },
      {
        id: "sh_ayush_vata_sheet",
        purpose: "relieving",
        hi: "क्या ठंडी हवा से कंधे की जकड़न बढ़ती है और गर्म सेंक या तेल मालिश से आराम मिलता है?",
        en: "Does cold weather worsen stiffness, while warm fomentation relieves it? (Vata Lakshan)",
        opts: [
          { val: "RELIEF_WARM_SNEHANA", hi: "हाँ, गर्म सेंक व तेल मालिश से आराम मिलता है (वात प्रधान)", en: "Relieved by warm fomentation & oil massage" },
          { val: "BURNING_HOT", hi: "नहीं, जोड़ में जलन है व गर्म सेंक से दर्द बढ़ता है (पित्त प्रधान)", en: "Burning sensation; heat aggravates" },
          { val: "NO_DIFF", hi: "तापमान से कोई विशेष अंतर नहीं", en: "No temperature effect" },
        ]
      },
      {
        id: "sh_past_diabetes",
        purpose: "history",
        hi: "क्या आपको मधुमेह (शुगर / डायबिटीज) या थायरॉइड की समस्या है?",
        en: "Do you have a history of Diabetes Mellitus or Thyroid disorders? (High Frozen Shoulder risk)",
        opts: [
          { val: "KNOWN_DIABETES", hi: "हाँ, डायबिटीज (शुगर) है", en: "Yes, Diabetes Mellitus" },
          { val: "KNOWN_THYROID", hi: "हाँ, थायरॉइड की दवा चल रही है", en: "Yes, Thyroid disorder" },
          { val: "NONE_CHRONIC", hi: "नहीं, ऐसा कोई रोग नहीं है", en: "No diabetes or thyroid illness" },
        ]
      },
      {
        id: "sh_weakness_dropping",
        purpose: "character",
        hi: "क्या हाथ में कमजोरी महसूस होती है जैसे चाय का कप या बाल्टी पकड़ने में हाथ छूटने लगे?",
        en: "Have you noticed weakness in lifting arm or dropping objects from your hand?",
        opts: [
          { val: "MARKED_WEAKNESS", hi: "हाँ, हाथ में कमजोरी है व वजन नहीं उठता (Drop arm sign)", en: "Marked motor weakness (Rotator Cuff Tear threat)", rf: true },
          { val: "PAIN_ONLY", hi: "केवल दर्द है, ताकत पूरी है", en: "Pain only, strength intact" },
        ]
      },
    ]
  },

  {
    id: "Lower_Back_Pain",
    category: "Lower Back Pain",
    nameHi: "कमर दर्द व साइटिका (कटिशूल / गृध्रसी)",
    nameEn: "Lower Back Pain & Sciatica",
    keywords: [
      "lower back", "back pain", "kamar", "kamar dard", "kamar me dard", "lumbago", "sciatica",
      "gridhrasi", "katishoola", "kati shool", "slip disc", "disc herniation", "lumbar",
      "कमर", "कमर दर्द", "कमर में दर्द", "कटिशूल", "गृध्रसी", "साइटिका", "स्लिप डिस्क", "पीठ दर्द"
    ],
    problem: "Lumbar Spine Pain & Radiculopathy (कटिशूल / गृध्रसी)",
    redFlag: "Loss of bowel/bladder control or saddle anesthesia (Cauda Equina Syndrome)",
    questions: [
      {
        id: "lbp_site_exact",
        purpose: "location",
        hi: "कमर में दर्द किस जगह है? (मध्य कमर, एक तरफ या दोनों तरफ?)",
        en: "Where exactly in your back is the pain located? (Central spine, left side, right side, or across?)",
        opts: [
          { val: "LOWER_CENTRAL_SPINE", hi: "कमर के बिल्कुल बीच में (Central Lower Spine)", en: "Central Lower Spine (L4-S1)" },
          { val: "UNILATERAL_LEFT_OR_RIGHT", hi: "कमर के एक तरफ व कूल्हे में (One side & buttock)", en: "One side into buttock" },
          { val: "BELT_LINE_ACROSS", hi: "पूरी कमर में बेल्ट की तरह फैला हुआ", en: "Band across entire lower back" },
        ]
      },
      {
        id: "lbp_sciatica_radiation",
        purpose: "character",
        hi: "क्या दर्द कूल्हे से होकर जांघ, घुटने के पीछे या पैर के अंगूठे/उंगलियों तक जाता है?",
        en: "Does the pain shoot down the back of your leg past the knee into calf, ankle, or foot? (Sciatica)",
        opts: [
          { val: "RADICULAR_PAST_KNEE", hi: "हाँ, जांघ के पीछे से पैर के पंजे तक जाता है (गृध्रसी / Sciatica)", en: "Yes, radiates down past knee to foot" },
          { val: "UPTO_BUTTOCK_THIGH", hi: "केवल कूल्हे व ऊपरी जांघ तक ही रहता है", en: "Referred to buttock/upper thigh only" },
          { val: "LOCALIZED_BACK_ONLY", hi: "नहीं, केवल कमर में रहता है, पैर में नहीं जाता", en: "No radiation down leg" },
        ]
      },
      {
        id: "lbp_severity_scale",
        purpose: "severity",
        hi: "१ से १० के पैमाने पर आपकी कमर का दर्द कितना तीव्र है?",
        en: "On a scale of 1 to 10, how severe is your back pain?",
        opts: [
          { val: "MILD_1_3", hi: "हल्का (१ से ३) - सामान्य काम कर पाते हैं", en: "Mild (1-3)" },
          { val: "MODERATE_4_6", hi: "मध्यम (४ से ६) - झुकने या उठने-बैठने में तकलीफ", en: "Moderate (4-6)" },
          { val: "SEVERE_7_10", hi: "अत्यधिक तेज (७ से १०) - करवट बदलना भी कठिन", en: "Severe (7-10) - Unable to stand or walk", rf: true },
        ]
      },
      {
        id: "lbp_cauda_equina_redflag",
        purpose: "red_flag",
        hi: "क्या पेशाब या शौच पर नियंत्रण में रुकावट आई है, या गुप्तांगों/जांघों के बीच सुन्नपन (Saddle numbness) है?",
        en: "Are you having difficulty controlling urine or bowel, or numbness around your groin/saddle area?",
        opts: [
          { val: "YES_CAUDA_EQUINA", hi: "हाँ, पेशाब/शौच में अनियंत्रण या गुप्तांगों में सुन्नपन है (Cauda Equina Red Flag)", en: "Yes, bladder/bowel dysfunction or saddle numbness", rf: true },
          { val: "NO_SPHINCTER_ISSUES", hi: "नहीं, पेशाब-शौच पर पूरा सामान्य नियंत्रण है", en: "No sphincter problems" },
        ]
      },
      {
        id: "lbp_paresthesia_footdrop",
        purpose: "character",
        hi: "क्या पैर या पंजे में सुन्नपन, चींटियां चलने जैसा अहसास (Tingling) या पैर की उंगलियां उठाने में कमजोरी है?",
        en: "Do you have numbness, pins and needles, or difficulty lifting your foot/toes while walking (Foot drop)?",
        opts: [
          { val: "FOOT_DROP_WEAKNESS", hi: "हाँ, चलते समय पंजा अटकता है / कमजोरी (Foot drop weakness)", en: "Motor weakness / Foot drop", rf: true },
          { val: "NUMBNESS_TINGLING_ONLY", hi: "केवल झनझनाहट व सुन्नपन है", en: "Numbness / Tingling sensations" },
          { val: "NO_NUMBNESS", hi: "कोई सुन्नपन या कमजोरी नहीं है", en: "No numbness or weakness" },
        ]
      },
      {
        id: "lbp_aggravating_bending",
        purpose: "aggravating",
        hi: "किस स्थिति में कमर का दर्द अधिक बढ़ता है? (आगे झुकने पर, भारी वजन उठाने पर, या ज्यादा देर बैठने पर?)",
        en: "What worsens the back pain? (Bending forward, sitting, coughing/sneezing, or standing?)",
        opts: [
          { val: "WORSE_BENDING_COUGH", hi: "आगे झुकने, खांसने या छींकने पर (Disc herniation pattern)", en: "Bending forward, sitting, coughing" },
          { val: "WORSE_STANDING_WALKING", hi: "खड़े रहने या चलने पर बढ़ता है, बैठने पर आराम (Spinal Stenosis)", en: "Prolonged standing & walking" },
          { val: "MORNING_STIFF_BED", hi: "सुबह उठने पर बहुत जकड़न होती है, चलने पर थोड़ा आराम", en: "Morning stiffness, eases with movement" },
        ]
      },
      {
        id: "lbp_relieving_posture",
        purpose: "relieving",
        hi: "किस स्थिति में दर्द में सबसे अधिक आराम मिलता है?",
        en: "Which posture gives you maximum relief from the back pain?",
        opts: [
          { val: "LYING_FLAT_KNEES_BENT", hi: "सीधे लेटकर घुटने मोड़कर आराम करने पर", en: "Lying flat with knees bent" },
          { val: "SITTING_FORWARD", hi: "आगे झुककर बैठने पर", en: "Sitting forward" },
          { val: "WARM_FOMENTATION", hi: "गर्म सेंक या कटिबस्ति/तेल मालिश से", en: "Warm fomentation & oil massage" },
          { val: "NO_POSTURAL_RELIEF", hi: "किसी भी स्थिति में आराम नहीं मिलता", en: "Constant in all postures" },
        ]
      },
      {
        id: "lbp_onset_lifting",
        purpose: "onset",
        hi: "दर्द की शुरुआत कैसे हुई? (अचानक भारी वजन उठाने या मुड़ने से, या धीरे-धीरे?)",
        en: "How did the back pain start? (Sudden twist / heavy lift, or gradual onset?)",
        opts: [
          { val: "SUDDEN_HEAVY_LIFT", hi: "अचानक भारी वजन उठाने या झटके से मुड़ने पर", en: "Acute heavy lift / sudden jerk" },
          { val: "GRADUAL_CHRONIC", hi: "लंबे समय से धीरे-धीरे", en: "Gradually over months or years" },
          { val: "AFTER_ACCIDENT", hi: "गाड़ी के झटके या गिरने के बाद", en: "After fall / vehicle jerk" },
        ]
      },
      {
        id: "lbp_ayush_vayu_dosha",
        purpose: "associated",
        hi: "क्या कमर में सूखापन, पेट में गैस/अफरा या मल त्याग में सूखापन (कब्ज) रहता है? (वात-गृध्रसी लक्षण)",
        en: "Do you experience dry hard stools, flatulence, or cold sensitivity with the back pain? (Vata-Apana Vitiation)",
        opts: [
          { val: "VATA_KABZ_PRESENT", hi: "हाँ, कब्ज, पेट में गैस व ठंड से दर्द बढ़ता है (वात प्रकोप)", en: "Yes, constipation, bloating & cold aggravation (Vata+)" },
          { val: "AMA_HEAVY_STIFF", hi: "सुबह शरीर भारी व सुस्त रहता है (आमवात/कफ प्रधान)", en: "Sluggish morning heaviness (Ama+)" },
          { val: "NIRAMA_CLEAR", hi: "पाचन व पेट साफ सामान्य रहता है", en: "Normal digestion & bowel" },
        ]
      },
      {
        id: "lbp_prior_scans_history",
        purpose: "history",
        hi: "क्या आपने पहले कभी कमर का X-Ray या MRI स्कैन करवाया है?",
        en: "Have you previously undergone an X-Ray or MRI scan of your lower spine?",
        opts: [
          { val: "MRI_DONE_SLIP_DISC", hi: "हाँ, MRI में स्लिप डिस्क / नस दबने की पुष्टि हुई है", en: "Yes, MRI confirmed Disc Bulge / Nerve Root Compression" },
          { val: "XRAY_DONE_SPONDYLOSIS", hi: "हाँ, केवल X-Ray हुआ है", en: "Yes, X-Ray done (Lumbar Spondylosis)" },
          { val: "NO_SCANS_YET", hi: "नहीं, अभी तक कोई जांच/स्कैन नहीं हुआ", en: "No prior imaging done" },
        ]
      },
    ]
  },
];

console.log("Categories loaded in builder:", categories.length);
