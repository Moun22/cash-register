const fs = require('fs');

function lireFichierTexte(filePath) {
  const buffer = fs.readFileSync(filePath);

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString('utf16le');
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const inverse = Buffer.alloc(buffer.length);
    for (let i = 0; i + 1 < buffer.length; i += 2) {
      inverse[i] = buffer[i + 1];
      inverse[i + 1] = buffer[i];
    }
    return inverse.toString('utf16le');
  }
  return buffer.toString('utf8');
}

function retirerBOM(texte) {
  return texte.charCodeAt(0) === 0xfeff ? texte.slice(1) : texte;
}

function detecterDelimiteur(ligneEntete) {
  const nbVirgules = (ligneEntete.match(/,/g) || []).length;
  const nbPointVirgules = (ligneEntete.match(/;/g) || []).length;
  return nbPointVirgules > nbVirgules ? ';' : ',';
}

function parserLigneCSV(ligne, delimiteur = ',') {
  const champs = [];
  let courant = '';
  let dansGuillemets = false;

  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"' && ligne[i + 1] === '"') {
      courant += '"';
      i++;
    } else if (c === '"') {
      dansGuillemets = !dansGuillemets;
    } else if (c === delimiteur && !dansGuillemets) {
      champs.push(courant);
      courant = '';
    } else {
      courant += c;
    }
  }
  champs.push(courant);
  return champs.map((c) => c.trim());
}

function parserCSV(contenu) {
  const lignes = retirerBOM(contenu).split(/\r?\n/).filter((l) => l.trim());
  if (lignes.length === 0) return { entete: [], data: [] };

  const delimiteur = detecterDelimiteur(lignes[0]);
  const entete = parserLigneCSV(lignes[0], delimiteur);
  const data = lignes.slice(1).map((l) => parserLigneCSV(l, delimiteur));
  return { entete, data };
}

function importerDepuisFichier(filePath, productsService) {
  const contenu = lireFichierTexte(filePath);
  const { entete, data } = parserCSV(contenu);

  const enteteNormalisee = entete.map((c) => c.toLowerCase());
  const idx = (nom) => enteteNormalisee.indexOf(nom);
  const idxNom = idx('nom');
  const idxPrix = idx('prix');
  const idxCodeBarres = idx('code_barres');
  const idxDescription = idx('description');

  if (idxNom === -1 || idxPrix === -1) {
    return {
      importes: 0,
      ignores: data.length,
      erreurs: [`Colonnes nom et prix requises. Colonnes detectees : [${entete.join(' | ')}]`]
    };
  }

  let importes = 0;
  let ignores = 0;
  const erreurs = [];

  for (let i = 0; i < data.length; i++) {
    const champs = data[i];
    const donnees = {
      nom: champs[idxNom],
      prix: champs[idxPrix],
      code_barres: idxCodeBarres >= 0 ? champs[idxCodeBarres] || null : null,
      description: idxDescription >= 0 ? champs[idxDescription] || null : null,
      source: 'manuel'
    };

    const resultat = productsService.ajouter(donnees);
    if (resultat.ok) {
      importes++;
    } else {
      ignores++;
      if (erreurs.length < 10) {
        erreurs.push(`Ligne ${i + 2} : ${resultat.erreurs.join(' ')}`);
      }
    }
  }

  return { importes, ignores, erreurs };
}

module.exports = { parserLigneCSV, parserCSV, importerDepuisFichier };
