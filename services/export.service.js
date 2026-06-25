const PDFDocument = require('pdfkit');

function formaterDateLocale(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const jour = String(d.getDate()).padStart(2, '0');
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const annee = d.getFullYear();
  const heure = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${jour}/${mois}/${annee} ${heure}:${minute}`;
}

function echapperCSV(valeur) {
  const texte = String(valeur ?? '');
  if (/[",\n;]/.test(texte)) {
    return `"${texte.replace(/"/g, '""')}"`;
  }
  return texte;
}

function ligneCSV(...champs) {
  return champs.map(echapperCSV).join(',');
}

function tradOuDefaut(i18n, cle, defaut) {
  if (i18n && typeof i18n.t === 'function') {
    const v = i18n.t(cle);
    if (v && v !== cle) return v;
  }
  return defaut;
}

function genererCSV(ventes, lignesParVente, i18n = null) {
  const T = (cle, def) => tradOuDefaut(i18n, cle, def);
  const NO_LINE = T('export.csv_aucune_ligne', '(aucune ligne)');

  const lignes = [ligneCSV(
    T('export.csv_id', 'Vente ID'),
    T('export.csv_date', 'Date'),
    T('export.csv_produit', 'Produit'),
    T('export.csv_quantite', 'Quantite'),
    T('export.csv_prix_unitaire', 'Prix unitaire'),
    T('export.csv_sous_total', 'Sous-total')
  )];

  for (const v of ventes) {
    const dateAffichee = formaterDateLocale(v.date_iso);
    const lignesVente = lignesParVente.get(v.id) || [];
    if (lignesVente.length === 0) {
      lignes.push(ligneCSV(v.id, dateAffichee, NO_LINE, 0, 0, v.total.toFixed(2)));
      continue;
    }
    for (const l of lignesVente) {
      lignes.push(ligneCSV(
        v.id,
        dateAffichee,
        l.nom_snapshot,
        l.quantite,
        l.prix_unitaire.toFixed(2),
        (l.prix_unitaire * l.quantite).toFixed(2)
      ));
    }
  }

  return lignes.join('\n');
}

function genererPDF(ventes, lignesParVente, filtres = {}, i18n = null) {
  const T = (cle, def, params) => {
    if (i18n && typeof i18n.t === 'function') {
      const v = i18n.t(cle, params);
      if (v && v !== cle) return v;
    }
    if (!params) return def;
    return def.replace(/\{(\w+)\}/g, (_, k) =>
      params[k] !== undefined ? String(params[k]) : `{${k}}`
    );
  };

  return new Promise((resolve, reject) => {
    const buffers = [];
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    doc.on('data', (c) => buffers.push(c));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(22).fillColor('#0f172a').text(T('export.titre_pdf', 'Rapport de ventes'), { align: 'center' });
    doc.moveDown(0.3);

    if (filtres.dateDebut || filtres.dateFin) {
      const periode = T('export.periode_pdf', 'Periode : {debut} au {fin}', {
        debut: filtres.dateDebut || '...',
        fin: filtres.dateFin || '...'
      });
      doc.fontSize(11).fillColor('#475569').text(periode, { align: 'center' });
    }

    const dateGen = new Date().toLocaleString('fr-FR');
    doc.fontSize(9).fillColor('#94a3b8').text(
      T('export.generation_pdf', 'Genere le {date}', { date: dateGen }),
      { align: 'center' }
    );
    doc.moveDown(1);

    let totalPeriode = 0;

    for (const v of ventes) {
      doc.fontSize(12).fillColor('#1e293b').text(
        `Vente #${v.id}   ${formaterDateLocale(v.date_iso)}`,
        { continued: false }
      );
      doc.moveDown(0.2);

      const lignesVente = lignesParVente.get(v.id) || [];
      for (const l of lignesVente) {
        const sousTotal = (l.prix_unitaire * l.quantite).toFixed(2);
        doc.fontSize(10).fillColor('#475569').text(
          `   ${l.nom_snapshot}  -  ${l.quantite} x ${l.prix_unitaire.toFixed(2)}  =  ${sousTotal} EUR`
        );
      }

      doc.fontSize(11).fillColor('#0f172a').text(
        T('export.total_vente_pdf', 'Total vente : {total}', { total: `${v.total.toFixed(2)} EUR` }),
        { align: 'right' }
      );
      doc.moveDown(0.6);
      totalPeriode += v.total;
    }

    doc.moveDown(1);
    doc.strokeColor('#1e293b').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor('#0f172a').text(
      T('export.total_periode_pdf', 'TOTAL PERIODE : {total}', { total: `${totalPeriode.toFixed(2)} EUR` }),
      { align: 'right' }
    );

    const clePluriel = ventes.length > 1 ? 'export.nb_ventes_pdf_pluriel' : 'export.nb_ventes_pdf';
    const defautPluriel = ventes.length > 1 ? '{n} ventes' : '{n} vente';
    doc.fontSize(10).fillColor('#475569').text(
      T(clePluriel, defautPluriel, { n: ventes.length }),
      { align: 'right' }
    );

    doc.end();
  });
}

function genererTicketPDF(vente, lignes, i18n = null) {
  const T = (cle, def, params) => {
    if (i18n && typeof i18n.t === 'function') {
      const v = i18n.t(cle, params);
      if (v && v !== cle) return v;
    }
    if (!params) return def;
    return def.replace(/\{(\w+)\}/g, (_, k) =>
      params[k] !== undefined ? String(params[k]) : `{${k}}`
    );
  };

  return new Promise((resolve, reject) => {
    const buffers = [];
    const doc = new PDFDocument({ size: [220, 600], margin: 12 });

    doc.on('data', (c) => buffers.push(c));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(14).text(T('export.ticket_titre', 'Ticket de caisse'), { align: 'center' });
    doc.fontSize(10).text(T('export.ticket_vente_no', 'Vente #{id}', { id: vente.id }), { align: 'center' });
    doc.fontSize(8).text(formaterDateLocale(vente.date_iso), { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(8).text('----------------------------------', { align: 'center' });
    doc.moveDown(0.2);

    for (const l of lignes) {
      const sousTotal = (l.prix_unitaire * l.quantite).toFixed(2);
      doc.fontSize(9).text(l.nom_snapshot);
      doc.fontSize(8).fillColor('#555').text(
        `  ${l.quantite} x ${l.prix_unitaire.toFixed(2)}  =  ${sousTotal} EUR`,
        { align: 'right' }
      );
      doc.fillColor('black');
    }

    doc.moveDown(0.3);
    doc.fontSize(8).text('----------------------------------', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(12).text(
      T('export.ticket_total', 'TOTAL : {total}', { total: `${vente.total.toFixed(2)} EUR` }),
      { align: 'right' }
    );
    doc.moveDown(0.6);
    doc.fontSize(9).fillColor('#555').text(T('export.ticket_merci', 'Merci de votre visite !'), { align: 'center' });

    doc.end();
  });
}

module.exports = { echapperCSV, ligneCSV, genererCSV, genererPDF, genererTicketPDF, formaterDateLocale };
