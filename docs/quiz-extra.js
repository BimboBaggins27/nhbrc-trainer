// Additional question pool — merged into D.quizzes at runtime so the per-module
// quizzes have enough variety that retakes show new questions before repeats.
//
// All questions are factually defensible against:
//  - SABS 0400-1990 (the bundled source standard)
//  - National Building Regulations as amended by R.574/2008 + R.711/2011
//  - SANS 10400-XA (energy, 2011)
//  - NHBRC Home Building Manual (mandate under Act 95 of 1998)
// Each question explains its source/clause in `why`.
window.NHBRC_QUIZ_EXTRA = {
  intro: [
    { q: "The NHBRC's mandate sits primarily under which Act?", opts: ["Act 103 of 1977","Act 95 of 1998","Act 64 of 2002","Act 36 of 2000"], a: 1, why: "Housing Consumers Protection Measures Act 95 of 1998 created the NHBRC and the warranty fund." },
    { q: "The 'national building regulations' themselves are issued under:", opts: ["The Standards Act","The Housing Consumers Protection Measures Act","The National Building Regulations and Building Standards Act 103 of 1977","The Constitution"], a: 2, why: "Act 103 of 1977 is the parent legislation; the actual NBR are subordinate regulations gazetted under it." },
    { q: "Which body publishes the per-part SANS 10400 standards?", opts: ["NHBRC","SABS","CIDB","Department of Human Settlements"], a: 1, why: "The South African Bureau of Standards (SABS) publishes the SANS series; the NBR reference these standards via 'deemed-to-satisfy'." },
    { q: "True / false: a builder must enrol every NEW home with the NHBRC, even if the owner is the builder.", opts: ["True","False — only contractor-built homes need enrolment","Only homes over R500 000","Only homes in metro areas"], a: 0, why: "Enrolment is mandatory for any new home built for a housing consumer; owner-builders may apply for an exemption certificate but must still register." },
    { q: "The 30 May 2008 R.574 Gazette mainly:", opts: ["Repealed Act 103/1977","Substituted definitions, AZ.4, A19 and the occupancy table","Created the NHBRC","Made all SANS 10400 parts free"], a: 1, why: "Notice R.574 in Government Gazette 31084 was the last big substantive amendment to the regulations themselves." },
    { q: "Which SANS 10400 Part deals specifically with energy usage in buildings?", opts: ["XA","T","H","O"], a: 0, why: "SANS 10400-XA, first published 2011, was added on top of the 1990 base edition to cover energy efficiency." },
    { q: "If the builder is not an NHBRC-registered home builder, the local authority must:", opts: ["Approve plans anyway","Refuse to approve until registration is shown","Refer to SABS","Send a private inspector"], a: 1, why: "Section 10 of Act 95/1998 + Reg A22 — local authority cannot accept plans for a home unless the builder is registered with the NHBRC and enrolment is in place." },
  ],

  occupancy: [
    { q: "Occupancy class B1 covers:", opts: ["Hotel","High-risk commercial service","Exhibition","Hospital"], a: 1, why: "B1 = high-risk commercial service (e.g. fuel sales). Hospital is E1/E2." },
    { q: "Class A3 — places of instruction — population is calculated as:", opts: ["1 person per m²","1 person per 5 m²","Number of fixed seats, OR 1 / 2 m²","16 per dwelling"], a: 2, why: "Reg A21 Table 2: A3 = number of fixed seats OR 1 person / 2 m² where there are no fixed seats." },
    { q: "Office buildings (G1) have a population factor of:", opts: ["1 person / 5 m²","1 person / 10 m²","1 person / 15 m²","1 person / 25 m²"], a: 2, why: "Reg A21 Table 2: G1 (offices) — 1 person per 15 m² of floor area." },
    { q: "Class E2 is:", opts: ["Place of detention","Hospital (in-patient)","Light industrial","Place of worship"], a: 1, why: "E2 = hospital (in-patient health-care). E3 = nursing or maternity homes; E1 = high-care; E4 = day-care/clinic." },
    { q: "Free-standing single-family house is:", opts: ["H1","H2","H3","H4"], a: 3, why: "H4 = detached dwelling house. H3 = domestic residences in flats / townhouses; H1 = hotel; H2 = dormitory." },
    { q: "A backyard dwelling rented for income, on the same erf as the main house, would most likely be classified:", opts: ["H4","H3","G1","C1"], a: 1, why: "H3 = domestic residence in a complex of two or more dwellings on the same erf. H4 is the standalone family house." },
    { q: "Reg A20 says the building must be classified by:", opts: ["The owner","The local authority builder","The competent person making the application","The NHBRC head office"], a: 2, why: "Reg A20: the person submitting plans (the competent person) classifies the building according to its proposed use." },
    { q: "A guesthouse with 12 rooms used for short-stay paying guests would normally be:", opts: ["H4","H5","H1","C1"], a: 1, why: "H5 (added in the 2008 amendments) = hospitality / guest house — 16 persons per dwelling, max 4 per room." },
  ],

  plans: [
    { q: "The owner's plan-application declaration is on:", opts: ["Form 1","Form 2","Form 3","Form 4"], a: 0, why: "Form 1 (SANS 10400-A) is the owner's plan-application declaration listing competent persons + which functional regs they cover." },
    { q: "Notice of intention to commence erection must reach the local authority at least:", opts: ["6 hours before","24 hours before","1 week before","Same day"], a: 1, why: "Reg A22 — at least 24 hours' written notice." },
    { q: "Plans for a new dwelling must as a minimum show:", opts: ["Just the floor plan","Floor plan only","Site plan, floor plans, sections, elevations and a locality plan","Specifications only"], a: 2, why: "Reg A4: site, locality, floor plan, sections, elevations and any special drawings required by Part A." },
    { q: "Approval of plans is given by:", opts: ["The NHBRC","The Department of Human Settlements","The local authority (Building Control Officer)","SABS"], a: 2, why: "Reg A8: the local authority's BCO grants or refuses plan approval. NHBRC handles enrolment, not plan approval." },
    { q: "After approval, the plans are valid for:", opts: ["6 months","12 months","2 years","Until cancelled"], a: 1, why: "Reg A12: approval lapses if work has not commenced within 12 months (extension may be granted)." },
    { q: "Existing materials shown on plans use which colour?", opts: ["Red","Green","Grey","Yellow"], a: 2, why: "Existing/retained materials are shown grey; new masonry is red, new concrete green, new iron/steel blue, wood yellow, glass black." },
    { q: "The 2008 R.574 amendment changed the alternative scale for small-erf site plans from:", opts: ["1:200 to 1:100","1:300 to 1:250","1:500 to 1:1000","No change"], a: 1, why: "R.574/2008 substituted '1:300' with '1:250' as the secondary site-plan scale; 1:500 remains the primary." },
    { q: "Form 3 is:", opts: ["Application","Owner's appointment of competent person","Competent person's certificate of compliance","Occupation certificate"], a: 2, why: "Form 3 (SANS 10400-A): the competent person's certificate that the work as built complies with the regulations." },
  ],

  competent: [
    { q: "An 'approved competent person' must be:", opts: ["Any builder with 5 years experience","Registered with a relevant statutory council (ECSA / SACAP / SACNASP / etc.)","NHBRC-listed only","SABS-accredited"], a: 1, why: "Reg A19(9)(c): the local authority may refuse acceptance where the person is not registered with ECSA, SACAP, SACNASP or another relevant council." },
    { q: "Who countersigns sub-designs to confirm coordination?", opts: ["The owner","The contractor","The lead approved competent person","The Building Inspector"], a: 2, why: "Reg A19(8): the lead approved competent person verifies coordination of sub-designs and counter-signs them." },
    { q: "If a competent person resigns mid-project, the owner must:", opts: ["Continue without one","Halt the project permanently","Appoint another approved competent person to take over BOTH completed and remaining work","Wait 30 days then carry on"], a: 2, why: "Reg A19(2): replacement competent person takes responsibility for completed AND remaining work." },
    { q: "'Inspection' as defined in the 2008 NBR means:", opts: ["Day-to-day site supervision","General periodic inspection at appropriate stages by the competent person","Only foundations checks","Only roof inspections"], a: 1, why: "Day-to-day supervision is the contractor's job; statutory 'inspection' is general, at appropriate intervals." },
    { q: "Form 2 of SANS 10400-A is:", opts: ["The owner's plan-application","The owner's appointment of competent person","The competent person's compliance certificate","The notice of completion"], a: 1, why: "Form 2 — owner's appointment of the competent person, naming them and the regulations they accept responsibility for." },
    { q: "ECSA registers:", opts: ["Architects","Engineers","Quantity surveyors","Geologists"], a: 1, why: "Engineering Council of South Africa = engineers. SACAP = architects. SACNASP = natural scientists (incl. geotechnical)." },
    { q: "A registered Pr.Arch (Professional Architect) belongs to:", opts: ["ECSA","SACAP","SACNASP","CIDB"], a: 1, why: "South African Council for the Architectural Profession (SACAP)." },
  ],

  structural: [
    { q: "SANS 10160 covers:", opts: ["Concrete design","Steel design","Basis of structural design and actions","Timber preservation"], a: 2, why: "SANS 10160 — basis of structural design and actions (loads). 10100 = concrete, 10162 = steel, 10005 = timber preservation." },
    { q: "Empirical Part-H foundations are NOT permitted on:", opts: ["Stable Class 2 soil","Dolomite or heaving clay (H2)","Class 1 sand","Bedrock"], a: 1, why: "Dolomite, heaving clay (H2), collapsing sand and other 'special' classifications require rational design by a competent person, not empirical rules." },
    { q: "Minimum concrete strength for empirical mass-strip foundations:", opts: ["10 MPa","15 MPa","25 MPa","40 MPa"], a: 1, why: "Part H empirical: 15 MPa minimum for plain mass-strip footings." },
    { q: "Geotechnical site investigation on dolomitic land must be carried out by:", opts: ["Any builder","An NHBRC inspector","A competent person, typically registered with SACNASP","SABS"], a: 2, why: "Reg F3 + 2008 definitions: the geotechnical investigation is by a competent person — usually a Pr.Sci.Nat (SACNASP)." },
    { q: "Part B5 requires structures to:", opts: ["Be cheap","Resist localised damage / disproportionate collapse","Use steel","Use concrete only"], a: 1, why: "B5 — robustness / resistance to localised damage, mainly relevant for taller and public buildings." },
    { q: "Live load (imposed load) for a residential floor is typically:", opts: ["0.25 kPa","1.5 kPa","5.0 kPa","10 kPa"], a: 1, why: "SANS 10160-2: 1.5 kPa for residential floors. Public access ~3-5 kPa; storage areas higher." },
    { q: "If empirical Part H rules are used, the structure may not exceed:", opts: ["1 storey","2 storeys","3 storeys","Any number"], a: 1, why: "Empirical rules are limited to up to two-storey single dwellings on classified stable soils." },
  ],

  dimensions: [
    { q: "Minimum ceiling height for a habitable room:", opts: ["2.1 m","2.4 m","2.6 m","2.7 m"], a: 1, why: "Part C / CC3 — habitable rooms 2.4 m floor-to-ceiling minimum." },
    { q: "Minimum ceiling height for bathrooms, kitchens and passages:", opts: ["1.8 m","2.0 m","2.1 m","2.4 m"], a: 2, why: "2.1 m — bathrooms, kitchens, laundries and passages may drop below the habitable-room requirement." },
    { q: "Minimum plan dimension of any habitable room:", opts: ["1.5 m","1.8 m","2.0 m","2.4 m"], a: 2, why: "CC2 — no horizontal dimension less than 2.0 m in a habitable room." },
    { q: "Minimum area of a separate WC compartment:", opts: ["1.0 m²","1.4 m²","1.8 m²","2.4 m²"], a: 1, why: "1.4 m² for a separate WC; 1.8 m² for a bathroom containing WC + basin." },
    { q: "Minimum area of a habitable room (e.g. a bedroom):", opts: ["4 m²","6 m²","8 m²","10 m²"], a: 1, why: "Part C minimum habitable-room area is 6 m²; main bedroom is often required larger by SANS 10400-S/H1 guidelines but 6 is the floor." },
    { q: "Where a sloped ceiling is used, the minimum height applies:", opts: ["At any single point","Over the whole floor area","Over at least half the floor area, with no point below 2.1 m","At the doorway only"], a: 2, why: "Sloped ceilings: the 2.4 m must be over at least half the floor, and no point below 2.1 m." },
    { q: "Minimum width of a passage in a dwelling:", opts: ["600 mm","750 mm","900 mm","1100 mm"], a: 2, why: "900 mm minimum passage width; corridors in larger occupancies are wider per Part T (escape)." },
  ],

  walls: [
    { q: "Minimum height of damp-proof course above finished ground:", opts: ["75 mm","100 mm","150 mm","300 mm"], a: 2, why: "Part K / KK16: dpc at least 150 mm above finished ground level on all external and internal walls." },
    { q: "Maximum vertical spacing of cavity-wall ties:", opts: ["300 mm","450 mm","600 mm","900 mm"], a: 1, why: "4 ties per m² with maximum 900 mm horizontal × 450 mm vertical centres." },
    { q: "Minimum lintel bearing each side of an opening:", opts: ["75 mm","100 mm","150 mm","200 mm"], a: 2, why: "150 mm minimum bearing — needed for stress transfer into the masonry." },
    { q: "Maximum total length of openings on any storey of an empirical-design wall:", opts: ["⅓ of wall length","½ of wall length","⅔ of wall length","No limit"], a: 0, why: "Empirical KK5 — total openings ≤ ⅓ of wall length on any storey." },
    { q: "Standard thickness of a single-skin loadbearing brick wall is at least:", opts: ["50 mm","75 mm","106 mm","220 mm"], a: 2, why: "A standard one-brick wall is ~106 mm; a 1½-brick wall is ~220 mm. Empirical Part K rules typically require 220 mm for two-storey loadbearing." },
    { q: "Mortar for ordinary masonry typically uses Class II strength of:", opts: ["3.5 MPa","7 MPa","20 MPa","30 MPa"], a: 1, why: "Class II mortar ≈ 7 MPa compressive strength — suits most domestic masonry." },
    { q: "Cavity gap between brick skins is typically:", opts: ["10 mm","25 mm","50 mm","100 mm"], a: 2, why: "≈ 50 mm cavity is standard, kept clear of mortar droppings to prevent damp bridging." },
    { q: "Wall plate must be tied to the wall at intervals not exceeding:", opts: ["600 mm","900 mm","1.2 m","2.0 m"], a: 2, why: "1.2 m maximum centres for hoop iron / cyclone clips tying wall plate to masonry." },
  ],

  roofs: [
    { q: "Minimum pitch for concrete roof tiles (with underlay):", opts: ["12°","17°","26°","30°"], a: 1, why: "Concrete tiles: 17° minimum with an underlay. Slate is steeper at 26°." },
    { q: "Stress-grade structural pine for roof timber must be treated to at least:", opts: ["H2","H3","H4","H5"], a: 0, why: "H2 for protected interior roof timber; H3 for exposed; H4/H5 for ground/water contact." },
    { q: "Cyclone clips fixing roof to wall plate, max spacing in a normal wind zone:", opts: ["600 mm","900 mm","1.2 m","1.5 m"], a: 2, why: "1.2 m maximum centres in normal wind zones; tighter in coastal Zones 3 and 4." },
    { q: "A trussed roof of clear span exceeding ~9 m typically requires:", opts: ["Owner's word","Empirical sizing","Rational structural design by a competent engineer","SABS approval"], a: 2, why: "Long-span trusses fall outside empirical Part L rules — engineer's design required." },
    { q: "Thatch roof minimum pitch:", opts: ["17°","26°","35°","45°"], a: 3, why: "Thatch is normally pitched at 45° or steeper for water shedding." },
    { q: "Bracing in trussed roofs is required to:", opts: ["Carry vertical load","Resist lateral wind / racking forces","Hold up insulation","Improve aesthetics"], a: 1, why: "Trussed-roof bracing handles wind / racking; trusses themselves carry the vertical loads in plane." },
    { q: "Mono-pitch concrete-tiled roofs are typically restricted to a minimum pitch of:", opts: ["10°","15°","17°","22°"], a: 3, why: "Mono-pitch concrete-tile roofs need higher pitch (~22° with sealed underlay) than dual-pitch because of single-sided runoff." },
  ],

  drainage: [
    { q: "Soil and combined vents on a drainage plan are coloured:", opts: ["Brown","Green","Red","Blue"], a: 2, why: "Brown = drains/soil pipes; green = waste pipes; RED = soil + combined vents; blue = waste vents." },
    { q: "Minimum slope for a 100 mm sewer drain (per SANS 10400-P):", opts: ["1 : 40","1 : 60","1 : 80","1 : 100"], a: 1, why: "100 mm-Ø house drain slope ≈ 1:60. 150 mm Ø may run flatter (≈ 1:80)." },
    { q: "Minimum diameter of the soil pipe carrying a WC:", opts: ["50 mm","75 mm","100 mm","150 mm"], a: 2, why: "100 mm minimum for WC discharge (soil pipe)." },
    { q: "Vent pipe must terminate:", opts: ["At ground level","Inside the ceiling","At least 600 mm above any opening within 3 m horizontally","Below the gutter"], a: 2, why: "Open vent must rise above eaves and at least 600 mm above any opening within 3 m horizontal of it (Part P)." },
    { q: "Stormwater drainage on plans is shown in:", opts: ["Brown","Green","Red","Blue"], a: 3, why: "Stormwater = blue. Combined sewer is red, foul is brown." },
    { q: "Inspection chamber required at:", opts: ["Every connection and at directional changes","Only at the boundary","Only at the WC","Every 200 m"], a: 0, why: "IEs/ICs are required at every junction, change of direction or gradient, and at intervals — not exceeding ~90 m on long runs." },
    { q: "Minimum trap seal depth:", opts: ["25 mm","50 mm","75 mm","100 mm"], a: 1, why: "≥ 50 mm trap seal to prevent siphonic loss and gas ingress." },
  ],

  fire: [
    { q: "Standard fire resistance ratings used in Part T are expressed in:", opts: ["Hours","Minutes (30 / 60 / 120 etc.)","Pascals","Newtons"], a: 1, why: "Fire resistance is rated in minutes — typically 30, 60, 90 or 120 minutes." },
    { q: "Minimum width of a single escape route in a domestic occupancy:", opts: ["600 mm","750 mm","900 mm","1100 mm"], a: 2, why: "≥ 900 mm clear in a dwelling escape route. Public escape routes are wider, scaled to occupant load." },
    { q: "Fire-stopping in masonry cavities is typically required:", opts: ["Never","Every 600 mm vertically","Every 1.5 m vertically and at horizontal junctions","At the roof only"], a: 2, why: "Vertical cavity fire-stops at ≈ 1.5 m and at every junction prevent flame spread up the cavity." },
    { q: "Travel distance from a furthest point in a habitable room to an exit door cannot exceed (in dwellings, with one exit):", opts: ["10 m","20 m","30 m","100 m"], a: 1, why: "Per Part T: dwelling single-exit travel typically capped around 20 m; corridors / multiple exits allow more." },
    { q: "A dividing wall between a garage and a habitable space must be:", opts: ["Plywood","Studwork only","30-min fire-rated, with a self-closing door","Glass"], a: 2, why: "Garage-to-house separation requires at least 30-min FR construction with a self-closing 30-min FR door." },
    { q: "Smoke alarm requirement in single dwellings (modern Part T guidance):", opts: ["Not required","One per bedroom, one per storey, on escape route","Only in commercial","Only over stoves"], a: 1, why: "Best practice + many municipal by-laws: smoke detector in every bedroom, on each storey, on the path to the exit." },
  ],

  lightvent: [
    { q: "Natural light: openings must be at least … of floor area (habitable rooms):", opts: ["2 %","5 %","10 %","20 %"], a: 2, why: "Part O — light openings ≥ 10 % of floor area for natural lighting." },
    { q: "Natural ventilation: openings (operable area) of at least … of floor area:", opts: ["2 %","5 %","10 %","20 %"], a: 1, why: "≥ 5 % of floor area, openable, distributed in the room (Part O)." },
    { q: "Where a bathroom has no opening to outside air, mechanical extraction must be at least:", opts: ["3 air changes/hr","6 air changes/hr","12 air changes/hr","20 air changes/hr"], a: 2, why: "≈ 12 ach for windowless bathroom/WC mechanical extraction." },
    { q: "Sill height of habitable-room windows above floor:", opts: ["No limit","1.0 m","1.2 m","Limited only at upper levels — guard / restrictor needed if drop > 1 m below"], a: 3, why: "No fixed sill, but at upper levels with a > 1 m external drop a restrictor or guard is required (linked to Part M / Part D)." },
    { q: "An internal habitable room with no external wall must:", opts: ["Be closed off","Have mechanical light + ventilation OR borrowed light/ventilation conforming to Part O","Be ignored","Use a glass roof only"], a: 1, why: "Internal rooms rely on mechanical systems or 'borrowed' light/vent through openable interior elements meeting Part O." },
  ],

  stairs: [
    { q: "Maximum riser height in a private dwelling stair:", opts: ["180 mm","200 mm","220 mm","250 mm"], a: 1, why: "Part M: 200 mm max riser in a domestic stair." },
    { q: "Minimum going (tread depth) in a private stair:", opts: ["200 mm","225 mm","250 mm","275 mm"], a: 2, why: "250 mm min going. Public stairs ≥ 280 mm. Both follow the rise-going relationship." },
    { q: "Rise-going relationship: 2 × rise + going should fall in:", opts: ["300–400 mm","500–700 mm","700–900 mm","900–1200 mm"], a: 1, why: "2R + G between 500 and 700 mm gives an ergonomic stair." },
    { q: "Minimum headroom over a stair:", opts: ["1.8 m","2.0 m","2.2 m","2.4 m"], a: 1, why: "≥ 2.0 m headroom measured vertically from the pitch line." },
    { q: "Handrail height above pitch line / nosings:", opts: ["750 mm","900 mm","1.0 m","1.1 m"], a: 1, why: "≈ 900 mm handrail in a private stair; 1.0 m for landings or balconies > 1 m drop." },
    { q: "Balustrade required where the change of level exceeds:", opts: ["300 mm","600 mm","1.0 m","1.5 m"], a: 2, why: "Balustrade required where the floor/landing is more than 1.0 m above the lower surface." },
    { q: "Maximum gap in a balustrade (to resist a child slipping through):", opts: ["50 mm","100 mm","150 mm","200 mm"], a: 1, why: "100 mm — a sphere of 100 mm Ø must not pass through the balustrade." },
  ],

  energy: [
    { q: "SANS 10400-XA was first published in:", opts: ["1990","2008","2011","2018"], a: 2, why: "SANS 10400-XA (Energy usage in buildings) added in 2011 — the 1990 base edition predated energy efficiency rules." },
    { q: "South Africa is divided into how many climate zones for SANS 10400-XA?", opts: ["3","4","6","8"], a: 2, why: "Six climate zones drive different roof / wall R-value targets." },
    { q: "A new home's hot-water demand must be supplied at minimum by … from non-resistance sources:", opts: ["10 %","25 %","50 %","100 %"], a: 2, why: "≥ 50 % of average annual hot-water heating must come from solar, heat-pump or other renewable / efficient source (XA-1)." },
    { q: "R-value is a measure of:", opts: ["Air leakage","Thermal RESISTANCE — higher = better insulation","Sound","Light transmission"], a: 1, why: "R-value (m²K/W) is the resistance to heat flow; higher R = better insulation." },
    { q: "Roof insulation R-value targets generally INCREASE as climate zones go from:", opts: ["Coastal warm to cold interior","Cold to warm","No relationship","Random"], a: 0, why: "Colder zones (e.g. Zone 5 / Highveld) demand higher roof R-values; warmer coastal zones less." },
    { q: "External walls in non-XA-compliant masonry can compensate via:", opts: ["More insulation in roof","Additional internal lining or cavity insulation","Reflective paint only","Larger windows"], a: 1, why: "Wall non-compliance can be compensated by adding cavity / lining insulation or by an XA rational-assessment route." },
  ],

  process: [
    { q: "Correct sequence for a new home (high level):", opts: ["Build → submit → enrol","Pre-application → submit plans → BCO approval → NHBRC enrolment → notice of intent → construct → inspections → completion → occupation cert","Build → enrol → submit","Submit → build → enrol → finish"], a: 1, why: "Approval must precede enrolment; enrolment must precede start of work; occupation only after completion certificate." },
    { q: "Notice of intention to commence is required at least:", opts: ["6 hours before","24 hours before","7 days before","Same day"], a: 1, why: "Reg A22 — 24 hours' written notice." },
    { q: "Occupation of a building before issue of an occupation certificate is:", opts: ["Permitted","An offence under Section 14 of Act 103/1977","Allowed in metro areas","Up to the owner"], a: 1, why: "Section 14 — occupation without an occupation certificate is an offence." },
    { q: "Inspection stages a competent person typically signs off (not exhaustive):", opts: ["Foundations → DPC → roof → drains → completion","Roof only","Doors only","DPC only"], a: 0, why: "Hold points: foundations, dpc, slab, frame, roof, drains, final — varies per local authority and HBM." },
    { q: "If construction has not commenced within … of plan approval, the approval lapses:", opts: ["3 months","12 months","2 years","Never"], a: 1, why: "Reg A12 — 12 months, with possibility of extension on application." },
  ],

  warranty: [
    { q: "NHBRC structural-defect cover is for:", opts: ["1 year","3 years","5 years","10 years"], a: 2, why: "Major structural defects — 5 years from occupation/transfer." },
    { q: "NHBRC roof-leak cover applies for:", opts: ["3 months","6 months","12 months","5 years"], a: 2, why: "Roof leaks — 12 months." },
    { q: "Non-compliance with the NHBRC Home Building Manual cover:", opts: ["1 month","3 months","6 months","12 months"], a: 1, why: "3-month cover for general non-compliance with the Home Building Manual." },
    { q: "Enrolment must be lodged with the NHBRC at least:", opts: ["1 day before construction","15 days before construction starts","30 days before","60 days before"], a: 1, why: "Section 14A of Act 95/1998 + NHBRC rules — minimum 15 days before construction." },
    { q: "The NHBRC builder registration is renewed:", opts: ["Once-off","Monthly","Annually","Every 5 years"], a: 2, why: "Annual renewal of home-builder registration." },
    { q: "If a builder builds without enrolment they:", opts: ["Are eligible for warranty","Forfeit warranty access and may face fines / imprisonment","Get a discount","Get the same protection"], a: 1, why: "Section 21 of Act 95/1998: an offence — fines and possible imprisonment, and the housing consumer cannot claim from the warranty fund." },
  ],
};
