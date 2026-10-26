/* The same character rigs are used by battles and Story Mode. */
'use strict';

function rigKitFor(id) {
  const kits = {
    Scraps: typeof ScrapsRig !== 'undefined' ? ScrapsRig : null,
    Astro: typeof AstroRigs !== 'undefined' ? AstroRigs.Astro : null,
    BedtimeAstro: typeof AstroRigs !== 'undefined' ? AstroRigs.BedtimeAstro : null,
    Shelly: typeof ShellyRigs !== 'undefined' ? ShellyRigs.Shelly : null,
    CheerbearShelly: typeof ShellyRigs !== 'undefined' ? ShellyRigs.CheerbearShelly : null,
    Goob: typeof GoobRig !== 'undefined' ? GoobRig : null,
    Sprout: typeof SproutRig !== 'undefined' ? SproutRig : null,
    Gigi: typeof GigiRigs !== 'undefined' ? GigiRigs.Gigi : null,
    WishBearGigi: typeof GigiRigs !== 'undefined' ? GigiRigs.WishBearGigi : null,
    Bobette: typeof BobetteRig !== 'undefined' ? BobetteRig : null,
    Dyle: typeof DyleRig !== 'undefined' ? DyleRig : null,
    Vee: typeof VeeRig !== 'undefined' ? VeeRig : null,
    Shrimpo: typeof ShrimpoRig !== 'undefined' ? ShrimpoRig : null,
    Ginger: typeof GingerRig !== 'undefined' ? GingerRig : null,
    Dandy: typeof DandyRig !== 'undefined' ? DandyRig : null,
    Rudie: typeof RudieRig !== 'undefined' ? RudieRig : null,
    Finn: typeof FinnRig !== 'undefined' ? FinnRig : null,
    Looey: typeof LooeyRig !== 'undefined' ? LooeyRig : null,
    Soulvester: typeof SoulvesterRig !== 'undefined' ? SoulvesterRig : null,
    QOMSoulvester: typeof QOMSoulvesterRig !== 'undefined' ? QOMSoulvesterRig : null,
    Gourdy: typeof GourdyRig !== 'undefined' ? GourdyRig : null,
    QOMGourdy: typeof QOMGourdyRig !== 'undefined' ? QOMGourdyRig : null,
    Connie: typeof ConnieRig !== 'undefined' ? ConnieRig : null,
    QOMConnie: typeof QOMConnieRig !== 'undefined' ? QOMConnieRig : null,
    Cocoa: typeof CocoaRig !== 'undefined' ? CocoaRig : null
  };
  return kits[id] || null;
}
