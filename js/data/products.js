/* Hybrid Ag — products mega-menu source.
   Mirror of Odoo product.template · categ "Sales Products 2026" · is_published=true (pulled 2026-07-02).
   RECONCILE AT ERP INTEGRATION: replace this static list with a validated Odoo feed.
   Every listed product must have an explicit page; missing links are never redirected elsewhere.
   Accent keys follow brand product-range map C-13: orange=macros, green=stimulants/biology, berry=traces, teal=hero/testing. */
window.PRODUCTS = [
  { key: 'foliar', label: 'Foliar', accent: 'orange',
    blurb: 'Fast-acting nutrition applied to the leaf, timed to the stage that needs it.',
    items: [
      { name: 'Power-Cal®', href: 'product.html' }, { name: 'Power-Cal® Organic', href: 'power-cal-organic.html' },
      { name: 'Power-Mag®', href: 'power-mag.html' }, { name: 'Power-N®', href: 'power-n.html' }
    ] },
  { key: 'fertigation', label: 'Fertigation', accent: 'orange',
    blurb: 'Soil-delivered calcium, magnesium and potassium through the irrigation line.',
    items: [
      { name: 'Opti-Cal®', href: 'opti-cal.html' }, { name: 'Opti-Cal® Organic', href: 'opti-cal-organic.html' },
      { name: 'Opti-Mag®', href: 'opti-mag.html' }, { name: 'K-Max®', href: 'k-max.html' }, { name: 'K-Max® Organic', href: 'k-max-organic.html' }
    ] },
  { key: 'traces', label: 'Trace Elements', accent: 'berry',
    blurb: 'The Opti-Trace range — single elements and blends to correct the gaps a test finds.',
    items: [
      { name: 'Opti-Trace® BudMax', href: 'opti-trace-budmax.html' }, { name: 'Opti-Trace® BudMax Organic', href: 'opti-trace-budmax-organic.html' },
      { name: 'Opti-Trace® Boron', href: 'opti-trace-boron.html' }, { name: 'Opti-Trace® Boron Organic', href: 'opti-trace-boron-organic.html' },
      { name: 'Opti-Trace® Zinc', href: 'opti-trace-zinc.html' }, { name: 'Opti-Trace® Zinc Organic', href: 'opti-trace-zinc-organic.html' },
      { name: 'Opti-Trace® Manganese', href: 'opti-trace-manganese.html' }, { name: 'Opti-Trace® Manganese Organic', href: 'opti-trace-manganese-organic.html' },
      { name: 'Opti-Trace® Copper', href: 'opti-trace-copper.html' }, { name: 'Opti-Trace® Copper Organic', href: 'opti-trace-copper-organic.html' },
      { name: 'Opti-Trace® Iron', href: 'opti-trace-iron.html' }, { name: 'Opti-Trace® Iron Organic', href: 'opti-trace-iron-organic.html' },
      { name: 'Opti-Trace® Cobalt', href: 'opti-trace-cobalt.html' }, { name: 'Opti-Trace® Cobalt Organic', href: 'opti-trace-cobalt-organic.html' },
      { name: 'Opti-Trace® Moly', href: 'opti-trace-moly.html' }, { name: 'Opti-Trace® Moly Organic', href: 'opti-trace-moly-organic.html' },
      { name: 'Opti-Trace® BMZ', href: 'opti-trace-bmz.html' }, { name: 'Opti-Trace® BMZ Organic', href: 'opti-trace-bmz-organic.html' },
      { name: 'Opti-Trace® Complete', href: 'opti-trace-complete.html' }, { name: 'Opti-Trace® Max', href: 'opti-trace-max.html' }, { name: 'Opti-Trace® Bio-Check', href: 'opti-trace-bio-check.html' },
      { name: 'Opti-Trace® Bio-Check Organic', href: 'opti-trace-bio-check-organic.html' }
    ] },
  { key: 'suspensions', label: 'Micronised Suspensions', accent: 'berry',
    blurb: 'The Liqui- range — finely milled minerals held in suspension for even uptake.',
    items: [
      { name: 'Liqui-Cal®', href: 'liqui-cal.html' }, { name: 'Liqui-Cal® Organic', href: 'liqui-cal-organic.html' },
      { name: 'Liqui-Gyp®', href: 'liqui-gyp.html' }, { name: 'Liqui-Gyp® Organic', href: 'liqui-gyp-organic.html' },
      { name: 'Liqui-Phos®', href: 'liqui-phos.html' }, { name: 'Liqui-Phos® Organic', href: 'liqui-phos-organic.html' }
    ] },
  { key: 'biological', label: 'Biological & Soil', accent: 'green',
    blurb: 'Mycro- inoculants and Bio-Sea marine inputs that wake the soil up and feed it.',
    items: [
      { name: 'Mycro-Feast®', href: 'mycro-feast.html' }, { name: 'Mycro-Start®', href: 'mycro-start.html' }, { name: 'Mycro-Tec® Lockout Liquid', href: 'mycro-tec-lockout-liquid.html' },
      { name: 'Mycro-Tec® Lockout Powder', href: 'mycro-tec-lockout-powder.html' }, { name: 'Mycro-Tec® SP', href: 'mycro-tec-sp.html' }, { name: 'Mycro-Tec® Strepto', href: 'mycro-tec-strepto.html' },
      { name: 'Mycro-Tec® VAM', href: 'mycro-tec-vam.html' }, { name: 'Bio-Sea® FKF', href: 'bio-sea-fkf.html' }, { name: 'Bio-Sea® FKF Organic', href: 'bio-sea-fkf-organic.html' },
      { name: 'Bio-Sea® Fish', href: 'bio-sea-fish.html' }, { name: 'Bio-Sea® Black', href: 'bio-sea-black.html' },
      { name: 'Bio-Sea® Black Organic', href: 'bio-sea-black-organic.html' }, { name: 'Bio-Sea® Soil Activator', href: 'bio-sea-soil-activator.html' }
    ] },
  { key: 'stimulants', label: 'Plant Stimulants', accent: 'green',
    blurb: 'Targeted inputs for set, frost, recovery and the hormonal shifts across a season.',
    items: [
      { name: 'Amino-Plex®', href: 'amino-plex.html' }, { name: 'Eco-Gibb®', href: 'eco-gibb.html' }, { name: 'Frost-Ex®', href: 'frost-ex.html' }, { name: 'Reprieve®', href: 'reprieve.html' },
      { name: 'Amplify®', href: 'amplify.html' }, { name: 'Cell-Ex®', href: 'cell-ex.html' }, { name: 'Fruitify®', href: 'fruitify.html' }, { name: 'Magnify®', href: 'magnify.html' },
      { name: 'ReLeaf®', href: 'releaf.html' }, { name: 'N-Hance®', href: 'n-hance.html' }
    ] },
  { key: 'npk', label: 'NPK & Combination', accent: 'orange',
    blurb: 'The Agri-Vive range — balanced NPK blends built around the job in front of you.',
    items: [
      { name: 'Agri-Vive® 0.0.30', href: 'agri-vive-0-0-30.html' }, { name: 'Agri-Vive® 0.0.30 Organic', href: 'agri-vive-0-0-30-organic.html' }, { name: 'Agri-Vive® 3.14.32', href: 'agri-vive-3-14-32.html' },
      { name: 'Agri-Vive® 10.10.10', href: 'agri-vive-10-10-10.html' }, { name: 'Agri-Vive® 12.18.0', href: 'agri-vive-12-18-0.html' }, { name: 'Agri-Vive® 18.6.14', href: 'agri-vive-18-6-14.html' },
      { name: 'Agri-Vive® 22.5.6', href: 'agri-vive-22-5-6.html' }, { name: 'Agri-Vive® RF', href: 'agri-vive-rf.html' }, { name: 'Agri-Vive® Post Harvest Boost', href: 'agri-vive-post-harvest-boost.html' }
    ] },
  { key: 'nutricore', label: 'Nutri-Core', accent: 'orange',
    blurb: 'Nitrogen and phosphate carriers that keep the soil biology working, not just fed.',
    items: [
      { name: 'Nutri-Core® CN', href: 'nutri-core-cn.html' }, { name: 'Nutri-Core® Multi-N', href: 'nutri-core-multi-n.html' }, { name: 'Nutri-Core® NP', href: 'nutri-core-np.html' }, { name: 'Nutri-Core® SA', href: 'nutri-core-sa.html' }
    ] },
  { key: 'humates', label: 'Humates', accent: 'green',
    blurb: 'Fulvic and humic inputs that hold nutrition in the root zone and carry it in.',
    items: [
      { name: 'Fulvix®', href: 'fulvix.html' }, { name: 'Humix®', href: 'humix.html' }
    ] },
  { key: 'broadacre', label: 'Broadacre & Pasture', accent: 'orange',
    blurb: 'Granular and liquid programs for grain, oilseed and pasture systems.',
    items: [
      { name: 'Pearl Boost®', href: 'pearl-boost.html' }, { name: 'Pearl Boost® Organic', href: 'pearl-boost-organic.html' }, { name: 'Pearl Array® Z', href: 'pearl-array-z.html' }, { name: 'Pearl Fusion®', href: 'pearl-fusion.html' },
      { name: 'Pearl Surge®', href: 'pearl-surge.html' }, { name: 'Precede®', href: 'precede.html' }, { name: 'Protex® B', href: 'protex-b.html' }, { name: 'Protex® B Organic', href: 'protex-b-organic.html' }, { name: 'Protex® Blue', href: 'protex-blue.html' },
      { name: 'Protex® Mg S', href: 'protex-mg-s.html' }, { name: 'ToNik®', href: 'tonik.html' }
    ] },
  { key: 'turf', label: 'Turf', accent: 'green',
    blurb: 'The Green-Tee range — colour, root and recovery inputs for fine turf.',
    items: [
      { name: 'Green-Tee® 10.0.10', href: 'green-tee-10-0-10.html' }, { name: 'Green-Tee® 12.0.10 + Fe', href: 'green-tee-12-0-10-plus-fe.html' }, { name: 'Green-Tee® Colour Max', href: 'green-tee-colour-max.html' },
      { name: 'Green-Tee® Conditioner', href: 'green-tee-conditioner.html' }, { name: 'Green-Tee® Nitro', href: 'green-tee-nitro.html' },
      { name: 'Nitro Iron', href: 'nitro-iron.html' }, { name: 'Nitro Iron Green Up', href: 'nitro-iron-green-up.html' },
      { name: 'IronMan®', href: 'ironman.html' }, { name: 'Tsunami® Complete', href: 'tsunami-complete.html' }
    ] },
  { key: 'testing', label: 'Testing & Analysis', accent: 'teal',
    blurb: 'Where every program starts — read the evidence before anything goes on.',
    href: 'services-testing.html',
    items: [
      { name: 'Soil Testing', href: 'services-soil-testing.html' },
      { name: 'Dry and Granular Prescription Blends', href: 'services-prescription-blends.html' },
      { name: 'Leaf Test', href: 'services-leaf-tissue-testing.html' },
      { name: 'Differential Sap Analysis (DSA)', href: 'services-differential-sap-analysis.html' },
      { name: 'Liquid Prescription Blends', href: 'services-liquid-prescription-blends.html' },
      { name: 'Nutrient Audit', href: 'nutrient-audit.html' },
      { name: 'Water Testing', href: 'services-water-testing.html' },
      { name: 'Produce Testing', href: 'services-produce-testing.html' },
      { name: 'Feed Testing', href: 'services-testing.html' }
    ] }
];
