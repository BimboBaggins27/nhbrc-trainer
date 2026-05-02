// Library extension — additional outbound + affiliate-ready cards.
// Slots are pre-built; paste your affiliate ID/tag into the URL when you
// sign up. Until then the link still works as a plain outbound to the
// merchant, so the card is functional from day 1.
//
// Setup steps for each affiliate (target ~1 hour total):
//   1. Apply at the merchant's affiliate portal
//   2. Get your tracking ID/tag
//   3. Edit the URL below to include the tag

(function () {
  const lib = window.NHBRC_LIBRARY || (window.NHBRC_LIBRARY = { externalDocs: [] });
  lib.externalDocs = lib.externalDocs || [];

  const extras = [
    {
      title: "SABS Webstore — buy any SANS standard",
      publisher: "South African Bureau of Standards",
      url: "https://store.sabs.co.za/",
      note: "Official SANS 10400 per-part standards (R200–R1500 each). Not a SABS partner — direct outbound.",
    },
    {
      title: "Builders Warehouse — concrete, reinforcement, masonry",
      publisher: "Massmart",
      url: "https://www.builders.co.za/",
      note: "Bulk material supplier. Affiliate-ready (paste ID at line below in source).",
    },
    {
      title: "Cashbuild — site materials, ready-mix",
      publisher: "Cashbuild Ltd",
      url: "https://www.cashbuild.co.za/",
      note: "Country-wide builder's merchant; popular for Class II mortar mix and stock brick.",
    },
    {
      title: "Tile Africa — finishing materials",
      publisher: "Italtile Group",
      url: "https://www.tileafrica.co.za/",
      note: "For tile + adhesive + grout once you've used the Tools → Tiling calculator.",
    },
    {
      title: "Plumblink — plumbing, drainage, fittings",
      publisher: "Plumblink",
      url: "https://www.plumblink.co.za/",
      note: "Part P/Q drainage materials.",
    },
    {
      title: "ARC Directory — free SANS 10400-A forms 1/2/3/4 (official)",
      publisher: "Architects' Registration Centre",
      url: "https://www.arcdirectory.co.za/downloads.html",
      note: "Editable PDF forms used during plan submission.",
    },
    {
      title: "South African Government Gazettes — official",
      publisher: "Government Printing Works",
      url: "https://www.gov.za/documents/notices",
      note: "Authoritative source for all NBR amendments. Free.",
    },
    {
      title: "Information Regulator (POPIA)",
      publisher: "Information Regulator SA",
      url: "https://inforegulator.org.za/",
      note: "Where to register as a Responsible Party once you collect any user data.",
    },
  ];

  // De-duplicate by URL so reloads don't double-list
  const haveUrls = new Set(lib.externalDocs.map(d => d.url));
  for (const e of extras) {
    if (!haveUrls.has(e.url)) lib.externalDocs.push(e);
  }
})();
