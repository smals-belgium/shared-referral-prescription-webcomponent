const relevantInfoTranslations: Record<string, { fr: string; nl: string }> = {
  "tmp-addInfo-impl": { fr: "Implants", nl: "Implantaten" },
  "tmp-addInfo-preg": { fr: "Grossesse", nl: "Zwangerschap" },
  "tmp-addInfo-diab": { fr: "Diabète", nl: "Diabetes" },
  "tmp-addInfo-all": { fr: "Allergie à l'agent de contraste", nl: "Allergie voor contrastmiddel" },
  "tmp-addInfo-metdeb": { fr: "Résidus métalliques", nl: "Metaaldeeltjes" },
  "tmp-addInfo-rendys": { fr: "Dysfonctionnement rénal", nl: "Nierdisfunctie" },
  "tmp-addInfo": { fr: "Autre", nl: "Andere" }
};

const implantTypesTranslations: Record<string, { fr: string; nl: string }> = {
  "tmp-impl-stent": { fr: "endoprothèses (p.ex. stents)", nl: "endoprothese (bv. stent)" },
  "tmp-impl-neurostim": { fr: "neurostimulateur", nl: "neurostimulator" },
  "tmp-impl-coch": { fr: "implant cochléaire", nl: "cochleair implantaat" },
  "tmp-impl-hydro": { fr: "shunt d’hydrocéphalie", nl: "hydrocefalieshunt" },
  "tmp-impl-ortho": { fr: "implant orthopédique", nl: "orthopedisch implantaat" },
  "tmp-impl-aesthetic": { fr: "implant esthétique/reconstructif", nl: "esthetisch / reconstructief implantaat" },
  "tmp-impl-elec": { fr: "électrode", nl: "electrode" },
  "tmp-impl-biosens": { fr: "biocapteur", nl: "biosensor" },
  "tmp-impl-mecheart": { fr: "implant cardiaque mécanique", nl: "mechanisch hartimplantaat" },
  "tmp-impl-elecheart": { fr: "implant cardiaque électronique", nl: "elektronisch hartimplantaat" },
  "tmp-impl-ophta": { fr: "implant intra-oculaire", nl: "oogheelkundig implantaat" },
  "tmp-impl": { fr: "autre", nl: "andere" }
};

/**
 * Generates a warning message listing relevant information
 * that is not taken into account by PSS Service to generate the recommendations.
 * The keys (relevantInfo & implants) are the ones listed in the EVF Templates of the ANNEX_82 on the web api.
 * @see https://git.vascloud.be/nihdi/uhmep/healix/webapi/-/blob/develop/src/main/resources/evf/template-versions/create/ANNEX_82.json?ref_type=heads
 * @see https://git.vascloud.be/nihdi/uhmep/healix/webapi/-/blob/develop/src/main/resources/evf/template-versions/read/ANNEX_82.json?ref_type=heads
 *
 * @param relevantInfo - Array of keys for relevant information (field of prescription ANNEX_82).
 * @param implants     - Optional array of implant subtype keys.
 *                       If provided and non-empty, includes an "Implants"
 *                       label followed by the translated subtypes.
 * @param language     - Output language: 'fr' (French) or 'nl' (Dutch).
 * @returns The warning message string, or an empty string if there are no items.
 *
 * @example
 * ```ts
 * // English example in French output
 * generateWarningMessage(
 *   ['tmp-addInfo-preg', 'tmp-addInfo-diab'],
 *   [],
 *   'fr'
 * );
 * // Returns:
 * // "Les informations pertinentes ci-dessous ne sont pas prises en compte dans ces résultats :
 * //  - Grossesse
 * //  - Diabète"
 * ```
 *
 * @example
 * ```ts
 * // Example in Dutch output with implants detailed
 * generateWarningMessage(
 *   ['tmp-addInfo-impl', 'tmp-addInfo-all'],
 *   ['tmp-impl-stent', 'tmp-impl-coch'],
 *   'nl'
 * );
 * // Returns:
 * // "De onderstaande relevante informatie wordt niet in aanmerking genomen in deze resultaten:
 * //  - Implantaten (endoprothese (bv. stent), cochleair implantaat)
 * //  - Allergie voor contrastmiddel"
 * ```
 */
export function generateWarningMessage(
  relevantInfo: string[],
  implants: string[],
  language: 'nl' | 'fr'
): string {
  const translatedItems: string[] = [];

  if (implants.length > 0) {
    const subImplants = implants
      .map(key => implantTypesTranslations[key]?.[language])
      .filter(Boolean);

    const implantsLabel = relevantInfoTranslations['tmp-addInfo-impl']?.[language] ?? 'Implants';
    const combinedImplants = subImplants.length
      ? `${implantsLabel} (${subImplants.join(', ')})`
      : implantsLabel;

    translatedItems.push(combinedImplants);
  }

  relevantInfo.forEach(key => {
    if (key !== 'tmp-addInfo-impl' && !key.startsWith('tmp-impl')) {
      const translation = relevantInfoTranslations[key]?.[language];
      if (translation) {
        translatedItems.push(translation);
      }
    }
  });

  if (!translatedItems.length) {
    return '';
  }

  const intro = language === 'fr'
    ? 'Les informations pertinentes ci-dessous ne sont pas prises en compte dans ces résultats :'
    : 'De onderstaande relevante informatie wordt niet in aanmerking genomen in deze resultaten:';

  const bulletList = translatedItems.map(item => `\t• ${item}`).join('\n');

  return `${intro}\n${bulletList}`;
}
