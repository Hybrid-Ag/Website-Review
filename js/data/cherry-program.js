/* Hybrid-Ag — Cherry program wording draft, refined for Rowe review (8 October 2026).
   Marketing explanations below are revised; identities, rates, stage codes and
   calendar entries remain the existing unapproved data. Do not use this preview
   as application instructions. Technical owner confirmation is still required.
   Historical source note (not current approval):
   Stages + rates cross-checked (2026-07-07, Fable 5) against the canonical
   "Cherry King 2019 Program" + "Nutritional Management in Cherries" decks
   (Pinecone nathan-brain-v2/agronomic) and against the live Odoo product range.
   Product names are the registered Odoo names. Rates below the documented 5-column
   program (bud & flower / shuck fall / fruit fill / post-harvest) follow those decks;
   the finer 13-stage split is an indicative expansion. Public display remains a
   default starting framework; confirm block-specific figures with the agronomy team. */
window.CHERRY = {
  meta: { crop: 'Cherries', region: 'Cool-temperate stone fruit', basis: 'Differential Sap Analysis' },

  // Phenology stages, grower term first, scientific (BBCH) alongside — the "connect the science" line Hamilton asked for.
  stages: [
    { key:'dormancy', name:'Dry Ground Spread', short:'Dormancy', bbch:'BBCH 00', month:'Jun–Jul', phase:'soil',
      why:'Use the soil results to review ground applications before spring growth. A dry or granular prescription blend needs to reflect the block’s requirements and the work planned for it.',
      seeing:'The trees are dormant, with no green growth.' },
    { key:'budswell', name:'Bud Swell', bbch:'BBCH 51', month:'Aug', phase:'veg',
      why:'Bud movement marks the start of spring growth. Review how the block is progressing alongside its existing results before deciding what nutrition is needed.',
      seeing:'Buds are swelling and their scales are loosening.' },
    { key:'budburst', name:'Bud Burst', bbch:'BBCH 53', month:'early Sep', phase:'veg',
      why:'The first leaves are emerging. Interpret the block’s observations and test results for this stage of growth rather than choosing a product by the date alone.',
      seeing:'Green tips and the edges of the first leaves are visible.' },
    { key:'whitebud', name:'White Bud', bbch:'BBCH 57', month:'mid Sep', phase:'flower',
      why:'Flowers are close to opening. Consider the block’s recent results and progress towards flowering when reviewing any proposed Nutrient application.',
      seeing:'Petals are visible, but the flowers have not opened.' },
    { key:'bloom', name:'Full Flowering', bbch:'BBCH 65', month:'late Sep', phase:'flower',
      why:'The block is in flower. Flowering conditions and existing results help the team assess the nutrition required; the same application will not suit every block.',
      seeing:'Open flowers are visible across the block.' },
    { key:'petalfall', name:'Petal Fall / Set', bbch:'BBCH 67', month:'early Oct', phase:'fruit',
      why:'As petals fall, young fruit becomes visible. Review the developing crop alongside the block’s test results to assess its Nutrient requirements.',
      seeing:'Petals are falling and small green fruitlets are forming.' },
    { key:'celldiv', name:'Cell Division', bbch:'BBCH 71', month:'mid Oct', phase:'fruit',
      why:'The young fruit is developing. Crop load and current plant results help inform the next nutrition decision.',
      seeing:'Small fruitlets are developing before pit hardening.' },
    { key:'cellexp', name:'Cell Expansion', bbch:'BBCH 75', month:'late Oct', phase:'fruit',
      why:'Fruit growth is continuing. Assess proposed nutrition changes against crop load, growing conditions and the results available for the block.',
      seeing:'Fruit is expanding and remains green to straw-green.' },
    { key:'straw', name:'Straw Colour', bbch:'BBCH 81', month:'early Nov', phase:'maturity',
      why:'Fruit is changing towards straw colour. Review any remaining applications against expected harvest and the current product directions.',
      seeing:'Fruit is changing from green to straw colour, with the first blush appearing.' },
    { key:'colour', name:'Colour-up', bbch:'BBCH 85', month:'mid Nov', phase:'maturity',
      why:'Colour is developing as harvest approaches. Assess fruit development and quality when considering any remaining nutrition applications.',
      seeing:'Red colour is developing and fruit is close to full size.' },
    { key:'harvest', name:'Harvest', bbch:'BBCH 89', month:'late Nov–Dec', phase:'maturity',
      why:'Yield and fruit quality help assess the season’s nutrition decisions. Review them with the weather and applications made, rather than attributing the result to one product.',
      seeing:'Fruit has developed its harvest colour and picking is beginning.' },
    { key:'post1', name:'Post-Harvest 1', bbch:'BBCH 91', month:'Dec–Jan', phase:'post',
      why:'With the crop harvested, review what was removed and the condition of the remaining canopy. These help inform the post-harvest Nutrient recommendation.',
      seeing:'The fruit has been picked and the leaves remain on the trees.' },
    { key:'post2', name:'Post-Harvest 2', bbch:'BBCH 92', month:'Feb–Mar', phase:'post',
      why:'As the trees move towards dormancy, review which applications remain practical and what needs to be addressed in the next soil or crop plan.',
      seeing:'Leaves are ageing as the trees move towards dormancy.' }
  ],

  // Product categories (control the colour band in the matrix).
  cats: [
    { key:'soil',    label:'Soil & Ground', color:'berry' },
    { key:'foliar',  label:'Foliar',        color:'teal'  },
    { key:'fert',    label:'Fertigation',   color:'orange'}
  ],

  // Products. rates keyed by stage index (0-12). role = short descriptor, why = disclosure copy.
  products: [
    { name:'Mycro-Feast®',  href:'mycro-feast.html', cat:'soil', role:'Microbial food', rates:{0:'20 L'},
      why:'Mycro-Feast is included in the ground-application part of this draft. Consider its proposed use with the block’s soil results and any dry or granular prescription blend.' },
    { name:'Nutri-Core® SA', href:'nutri-core-sa.html', cat:'soil', role:'Product selection to confirm', rates:{0:'20 L'},
      why:'Technical review required: the earlier soil-activator description does not match the Nutri-Core SA product record. The product choice and purpose of this ground application must be resolved before use.' },
    { name:'Mycro-Tec® SP',  href:'mycro-tec-sp.html', cat:'soil', role:'Inoculant', rates:{0:'10 L'},
      why:'Mycro-Tec SP is listed as an inoculant in the soil section. Assess its proposed use for the block, with preparation and placement checked against the current product directions.' },

    { name:'Power-Cal®', href:'product.html', cat:'foliar', role:'Calcium',
      rates:{1:'5 L',2:'5 L',3:'5 L',4:'5 L',5:'10 L',6:'10 L',7:'10 L',8:'10 L',9:'10 L',10:'10 L'},
      why:'Assess the Calcium requirement using the block’s results and crop stage. The repeated entries show how Power-Cal was included in this draft, not a direction to add it to every application.' },
    { name:'Opti-Trace® BudMax', href:'opti-trace-budmax.html', cat:'foliar', role:'Trace Nutrient option', rates:{3:'5 L',4:'5 L',5:'5 L'},
      why:'Assess BudMax against the crop’s trace Nutrient requirements and the nutrition already supplied. Its possible use is not limited to the flowering stages shown in this draft.' },
    { name:'Bio-Sea® FKF', href:'bio-sea-fkf.html', cat:'foliar', role:'Foliar application',
      rates:{1:'5 L',2:'5 L',3:'5 L',4:'5 L',5:'5 L',6:'5 L',7:'5 L',8:'5 L',9:'5 L',10:'5 L'},
      why:'Consider Bio-Sea FKF within the block’s nutrition recommendation, taking account of the crop and soil. Its repeated entries here do not mean it is needed in every application.' },
    { name:'Agri-Vive® RF', href:'agri-vive-rf.html', cat:'foliar', role:'Product identity to confirm', rates:{4:'10 L',5:'10 L'},
      why:'Technical review required: the RF identity and description in this program need to be reconciled with current product records. These entries are not approved application guidance.' },
    { name:'Opti-Trace® Bio-Check', href:'opti-trace-bio-check.html', cat:'foliar', role:'Trace Nutrient option', rates:{3:'2 L',4:'2 L'},
      why:'Assess Bio-Check for an identified Nutrient requirement, using the crop’s results and the nutrition already supplied. A flowering-stage entry alone does not establish that it is needed.' },
    { name:'Opti-Trace® Max', href:'opti-trace-max.html', cat:'foliar', role:'Trace Nutrient option', rates:{6:'2 L',7:'2 L'},
      why:'Assess Opti-Trace Max against the trace Nutrient requirements shown by the crop’s results. Its selection and timing should follow the block’s recommendation, not a fixed seasonal schedule.' },
    { name:'Agri-Vive® 0.0.30', href:'agri-vive-0-0-30.html', cat:'foliar', role:'Potassium', rates:{8:'5 L',9:'5 L',10:'5 L'},
      why:'Review the Potassium requirement alongside current results and expected harvest. Assess the foliar entries shown here against the nutrition already supplied to the block.' },
    { name:'Opti-Trace® Boron', href:'opti-trace-boron.html', cat:'foliar', role:'Boron', rates:{8:'3 L',9:'3 L'},
      why:'Assess the Boron requirement from the block’s results, allowing for Boron already supplied. The later-season entries shown here still need an appropriate reason and timing.' },
    { name:'Opti-Trace® Copper', href:'opti-trace-copper.html', cat:'foliar', role:'Copper', rates:{11:'0.3 L',12:'0.3 L'},
      why:'Assess whether the block requires Copper after harvest. Its inclusion should follow the test results and the recommendation for the trees, not the calendar alone.' },
    { name:'Power-N®', href:'power-n.html', cat:'foliar', role:'Nitrogen', rates:{11:'10 L',12:'10 L'},
      why:'Review the Nitrogen requirement after harvest against the crop removed and the condition of the remaining canopy. Assess Power-N as one option within that recommendation.' },

    { name:'Opti-Cal®', href:'opti-cal.html', cat:'fert', role:'Calcium', rates:{3:'40 L',4:'40 L',5:'10 L',6:'20 L',7:'20 L'},
      why:'Assess Opti-Cal for a Calcium application through irrigation. The recommendation needs to account for water quality and delivery equipment as well as the block’s Nutrient requirements.' },
    { name:'Agri-Vive® RF', href:'agri-vive-rf.html', cat:'fert', role:'Product identity to confirm', rates:{5:'40 L'},
      why:'Technical review required: confirm the identity of the RF product in this entry and whether the proposed fertigation use is supported. It is not an approved block recommendation.' },
    { name:'K-Max®', href:'k-max.html', cat:'fert', role:'Potassium', rates:{6:'20 L',7:'20 L'},
      why:'Review the Potassium requirement and the nutrition already supplied before including K-Max. The irrigation application needs to suit the block, water and delivery equipment.' },
    { name:'Nutri-Core® Multi-N', href:'nutri-core-multi-n.html', cat:'fert', role:'Nitrogen', rates:{11:'40 L',12:'40 L'},
      why:'Assess the Nitrogen requirement after harvest using the crop removed and the condition of the trees. Nutri-Core Multi-N is an option to review within that recommendation.' }
  ]
};
