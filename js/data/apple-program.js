/* Hybrid-Ag — representative Pink Lady sample, transcribed 2 October 2026.
   The supplied booklet's table is on PDF pages 46–47. It prints quantities in L;
   Nathan confirmed the per-hectare basis on 2 October, so display uses L/ha.
   Quantities, blank cells, stage names, months and application categories are
   retained. This sample is not a block prescription or product approval. */
window.CROP_PROGRAM = {
  meta: { crop: 'Apples', variety: 'Pink Lady', basis: 'Representative sample; rates in L/ha' },
  emphasizePowerCal: false,
  sourceDataset: {
    title: 'Apple Nutrition Playbook - Digital',
    filename: 'Apple Nutrition Playbook - Digital (5)_compressed.pdf',
    tableTitle: 'Pink Lady Nutrition Program',
    pages: [46, 47],
    originalUnit: 'L',
    displayUnit: 'L/ha',
    rateBasis: 'per hectare',
    basisConfirmedBy: 'Nathan',
    basisConfirmedOn: '2026-10-02',
    basisSource: 'Nathan confirmed that the booklet quantities are litres per hectare in the website working conversation.',
    transcriptionNote: 'Printed quantities are unchanged. Blank cells remain blank; they do not mean that an application or test is unnecessary.',
    sampleNote: 'Representative Pink Lady program only. Timing and rates must be adjusted for variety, rootstock, region, block conditions, crop load, water, weather, testing results and technical advice.'
  },
  approvalNotes: [
    'The confirmed rate basis does not turn this sample into a prescription for every apple block. Discuss soil and crop requirements with the Hybrid-Ag team.',
    'Product identities, current directions and compatibility still require technical confirmation. Entries sharing a stage do not establish that the products can be mixed.',
    'Nutri-Core Soil Activator retains the booklet name without a product link because a matching identity has not been confirmed. Agri-Vive RF remains flagged for identity confirmation.',
    'The booklet does not supply BBCH codes or intervals between entries in the same month. None have been added.'
  ],

  stages: [
    { key:'dry-ground', name:'Dry Ground Spread', month:'June', phase:'soil', phenology:'DORMANCY', sourcePage:46, contextPages:[36],
      why:'Review soil results and the block’s history during dormancy before choosing ground applications. No product or rate is listed in this sample’s June column.',
      seeing:'Dormant trees.' },
    { key:'early-bud-break', name:'Early Bud Break', month:'September', phase:'flower', phenology:'BUD & FLOWER AND CELL DIVISION', sourcePage:46, contextPages:[38,50],
      why:'Review spring development alongside the soil results. The soil-primer applications shown here need to suit the prescription for the block.',
      seeing:'Buds beginning their spring development.' },
    { key:'pink-bud', name:'Bud Burst/Pink Bud', month:'September', phase:'flower', phenology:'BUD & FLOWER AND CELL DIVISION', sourcePage:46, contextPages:[38,51],
      why:'Follow the buds’ actual development when timing applications before flowering. Bud Burst/Pink Bud is the first foliar stage in this sample.',
      seeing:'Bud burst and pink buds before open flowering.' },
    { key:'flower-20-40', name:'20–40% Flower', month:'October', phase:'flower', phenology:'BUD & FLOWER AND CELL DIVISION', sourcePage:46, contextPages:[39,51],
      why:'Use the proportion of flowers open to identify this stage, rather than the month alone. The sample shows a separate application later in flowering.',
      seeing:'20–40% flowering.' },
    { key:'flower-80-100', name:'80–100% Flower', month:'October', phase:'flower', phenology:'BUD & FLOWER AND CELL DIVISION', sourcePage:46, contextPages:[41,51],
      why:'Review the recommendation as the block reaches 80–100% flowering. The foliar and fertigation entries shown here are separate application methods.',
      seeing:'80–100% flowering.' },
    { key:'petal-fall', name:'Petal Fall / Cell Division', month:'October', phase:'flower', phenology:'BUD & FLOWER AND CELL DIVISION', sourcePage:46, contextPages:[39,51],
      why:'Review early fruit development with crop load and growing conditions before confirming the next application. Petal fall and fruit set are separate entries in the sample.',
      seeing:'Petal fall and early fruit development.' },
    { key:'fruit-set', name:'Fruit Set / Cell Division', month:'October', phase:'flower', phenology:'BUD & FLOWER AND CELL DIVISION', testing:'DSA', sourcePage:47, contextPages:[39,51],
      why:'Review fruit set alongside the DSA result and the block’s history. These details help the team assess the nutrition needed as the young fruit develops.',
      seeing:'Young fruitlets developing after fruit set.' },
    { key:'early-fruit-1', name:'Early Fruit Development 1', month:'November', phase:'fruit', phenology:'FRUIT DEVELOPMENT & CELL EXPANSION', sourcePage:47, contextPages:[40,52],
      why:'Consider continuing fruit growth with canopy condition and water supply. The block’s results help guide the nutrition recommendation at this stage.',
      seeing:'Young fruit continuing to develop.' },
    { key:'early-fruit-2', name:'Early Fruit Development 2', month:'November', phase:'fruit', phenology:'FRUIT DEVELOPMENT & CELL EXPANSION', testing:'DSA', sourcePage:47, contextPages:[40,52],
      why:'Use the DSA result to review the recommendation as early fruit growth continues. No fixed interval after Early Fruit Development 1 is given in the booklet.',
      seeing:'Continuing early fruit development.' },
    { key:'mid-fruit-1', name:'Mid Fruit Development 1', month:'December', phase:'fruit', phenology:'FRUIT DEVELOPMENT & CELL EXPANSION', testing:'DSA', sourcePage:47, contextPages:[40,52],
      why:'Review the DSA result with fruit development and the applications already made. This helps the team decide whether the nutrition recommendation needs changing.',
      seeing:'Continuing fruit development.' },
    { key:'mid-fruit-2', name:'Mid Fruit Development 2', month:'January', phase:'fruit', phenology:'FRUIT DEVELOPMENT & CELL EXPANSION', testing:'DSA', sourcePage:47, contextPages:[40,52],
      why:'A further DSA result provides information to review as the fruit develops. Keep the foliar and fertigation applications distinct when discussing the next application.',
      seeing:'Mid fruit development.' },
    { key:'late-fruit-1', name:'Late Fruit Development 1', month:'February', phase:'fruit', phenology:'FRUIT DEVELOPMENT & CELL EXPANSION', testing:'DSA', sourcePage:47, contextPages:[40,52],
      why:'Review the DSA result during late fruit development alongside the condition of the canopy. Fruit fill needs consideration through the season, not just a late correction.',
      seeing:'Late fruit development.' },
    { key:'late-fruit-2', name:'Late Fruit Development 2', month:'March', phase:'fruit', phenology:'FRUIT DEVELOPMENT & CELL EXPANSION', sourcePage:47, contextPages:[40,52],
      why:'Review fruit condition and maturity as the block approaches harvest. The absence of a DSA marker in this sample entry is not advice to omit testing where it is needed.',
      seeing:'Late fruit development before harvest.' },
    { key:'post-harvest-1', name:'Post-Harvest 1', month:'April', phase:'post', phenology:'POST-HARVEST', testing:'DSA', sourcePage:47, contextPages:[33,34,49],
      why:'Bring harvest and pack-out information into the review with the DSA result and remaining canopy. These details help guide the post-harvest prescription.',
      seeing:'Harvest completed; leaves remaining on the trees.' },
    { key:'post-harvest-2', name:'Post-Harvest 2', month:'April', phase:'post', phenology:'POST-HARVEST', sourcePage:47, contextPages:[33,36,49],
      why:'The remaining canopy and seasonal conditions guide post-harvest timing. The booklet does not give a fixed interval between its two April entries.',
      seeing:'Post-harvest leaves moving towards senescence.' }
  ],

  cats: [
    { key:'soil', label:'Soil primer', color:'teal' },
    { key:'foliar', label:'Foliar applications', color:'berry' },
    { key:'fert', label:'Fertigation', color:'orange' }
  ],

  // Rates use zero-based stage indices. The booklet's raw unit is recorded above.
  products: [
    { name:'Mycro-Tec SP®', href:'mycro-tec-sp.html', cat:'soil', role:'Soil primer', sourcePages:[46], rates:{1:'5 L/ha'},
      why:'The sample includes Mycro-Tec SP at Early Bud Break. Review the soil results and root-zone conditions with the team before including it in the block’s recommendation.' },
    { name:'Mycro-Feast®', href:'mycro-feast.html', cat:'soil', role:'Soil primer', sourcePages:[46], rates:{1:'5 L/ha'},
      why:'Mycro-Feast is shown in the Early Bud Break soil-primer application. Consider it within the soil recommendation, alongside the other inputs already planned for the block.' },
    { name:'Nutri-Core Soil Activator®', cat:'soil', role:'Product identity to confirm', sourcePages:[46], rates:{1:'75 L/ha'},
      why:'The booklet names Nutri-Core Soil Activator in this row. Its identity has not been confirmed, so this entry cannot yet be used as a product recommendation.' },

    { name:'Power-Cal®', href:'product.html', cat:'foliar', role:'Calcium', sourcePages:[46,47],
      rates:{2:'5 L/ha',3:'5 L/ha',4:'5 L/ha',5:'5 L/ha',6:'5 L/ha',7:'10 L/ha',8:'10 L/ha',9:'10 L/ha',10:'10 L/ha',11:'10 L/ha',12:'10 L/ha',13:'10 L/ha',14:'10 L/ha'},
      why:'Power-Cal is shown from Bud Burst/Pink Bud through to the second post-harvest application. Review the need for these applications with the block’s results rather than following the whole sample automatically.' },
    { name:'Opti-Trace® Bud Max', href:'opti-trace-budmax.html', cat:'foliar', role:'Trace Nutrient option', sourcePages:[46,47],
      rates:{2:'5 L/ha',3:'5 L/ha',4:'5 L/ha',5:'5 L/ha',6:'5 L/ha',13:'5 L/ha',14:'5 L/ha'},
      why:'Bud Max appears during bud and flower development, early fruit development and after harvest. These entries show its use in this sample, not the full range of uses or a requirement at every stage.' },
    { name:'Bio-Sea® FKF', href:'bio-sea-fkf.html', cat:'foliar', role:'Foliar application', sourcePages:[46,47],
      rates:{2:'2.5 L/ha',3:'2.5 L/ha',4:'2.5 L/ha',5:'2.5 L/ha',6:'2.5 L/ha',7:'2.5 L/ha',8:'2.5 L/ha',9:'2.5 L/ha',10:'2.5 L/ha',11:'2.5 L/ha',12:'2.5 L/ha'},
      why:'FKF is shown from Bud Burst/Pink Bud through late fruit development. Consider these applications alongside the block’s nutrition recommendation and the other products already supplied.' },
    { name:'Agri-Vive® RF', href:'agri-vive-rf.html', cat:'foliar', role:'Product identity to confirm', sourcePages:[46,47], rates:{6:'10 L/ha',7:'10 L/ha'},
      why:'RF is shown as a foliar application at fruit set and early fruit development. Its identity still needs confirmation against current product records. Do not substitute another Agri-Vive product.' },
    { name:'Opti-Trace® Max', href:'opti-trace-max.html', cat:'foliar', role:'Trace Nutrient option', sourcePages:[46,47], rates:{7:'2 L/ha',9:'2 L/ha',11:'2 L/ha'},
      why:'Opti-Trace Max appears at the first early, mid and late fruit-development entries. Review the block’s trace Nutrient results before deciding whether those applications are appropriate.' },
    { name:'Opti-Trace® Boron', href:'opti-trace-boron.html', cat:'foliar', role:'Boron', sourcePages:[46,47], rates:{8:'2 L/ha',10:'2 L/ha',12:'2 L/ha'},
      why:'The sample shows Boron applications at the second early, mid and late fruit-development entries. Check the block’s Boron requirement and the amount already supplied when reviewing them.' },
    { name:'Agri-Vive® 0.0.30', href:'agri-vive-0-0-30.html', cat:'foliar', role:'Potassium', sourcePages:[46,47], rates:{9:'5 L/ha',10:'5 L/ha',11:'5 L/ha',12:'5 L/ha'},
      why:'Agri-Vive 0.0.30 is shown through mid and late fruit development. Review these applications against the crop’s Potassium requirement and the nutrition already supplied.' },
    { name:'Power-N®', href:'power-n.html', cat:'foliar', role:'Nitrogen', sourcePages:[46,47], rates:{13:'10 L/ha',14:'10 L/ha'},
      why:'Power-N appears in both post-harvest entries. Review harvest information and the remaining canopy with the team before confirming the post-harvest nutrition recommendation.' },
    { name:'Opti-Trace® Copper', href:'opti-trace-copper.html', cat:'foliar', role:'Copper', sourcePages:[46,47], rates:{13:'0.3 L/ha',14:'0.3 L/ha'},
      why:'Copper appears in both post-harvest entries. Review the block’s Copper requirement and previous applications; the booklet gives no fixed interval between these entries.' },

    { name:'Opti-Cal®', href:'opti-cal.html', cat:'fert', role:'Calcium', sourcePages:[46,47], rates:{4:'20 L/ha',5:'20 L/ha',8:'20 L/ha'},
      why:'Opti-Cal is shown through fertigation at 80–100% flowering, petal fall and the second early fruit-development entry. Keep these rates separate from the foliar applications.' },
    { name:'Agri-Vive® RF', href:'agri-vive-rf.html', cat:'fert', role:'Product identity to confirm', sourcePages:[46,47], rates:{6:'20 L/ha',7:'30 L/ha',10:'30 L/ha'},
      why:'These RF entries are for fertigation, not foliar spraying. Its identity and suitability for the proposed application still need technical confirmation.' },
    { name:'K-Max', href:'k-max.html', cat:'fert', role:'Potassium', sourcePages:[46,47], rates:{9:'20 L/ha',11:'20 L/ha',12:'20 L/ha'},
      why:'K-Max is shown through fertigation during mid and late fruit development. Review the crop’s Potassium requirement and earlier applications before confirming these entries for the block.' },
    { name:'Nutri-Core® Multi N', href:'nutri-core-multi-n.html', cat:'fert', role:'Nitrogen', sourcePages:[46,47], rates:{13:'40 L/ha',14:'40 L/ha'},
      why:'Multi N is shown through fertigation in both post-harvest entries. Review the remaining canopy and seasonal conditions when deciding on the post-harvest prescription.' }
  ]
};
