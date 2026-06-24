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

function genererCSV(ventes, lignesParVente) {
  const lignes = [ligneCSV('Vente ID', 'Date', 'Produit', 'Quantite', 'Prix unitaire', 'Sous-total')];

  for (const v of ventes) {
    const dateAffichee = formaterDateLocale(v.date_iso);
    const lignesVente = lignesParVente.get(v.id) || [];
    if (lignesVente.length === 0) {
      lignes.push(ligneCSV(v.id, dateAffichee, '(aucune ligne)', 0, 0, v.total.toFixed(2)));
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

function genererPDF(ventes, lignesParVente, filtres = {}) {
  return new Promise((resolve, reject) => {
    const buffers = [];
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    doc.on('data', (c) => buffers.push(c));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(22).fillColor('#0f172a').text('Rapport de ventes', { align: 'center' });
    doc.moveDown(0.3);

    if (filtres.dateDebut || filtres.dateFin) {
      const periode = `Periode : ${filtres.dateDebut || 'debut'} au ${filtres.dateFin || 'aujourd\'hui'}`;
      doc.fontSize(11).fillColor('#475569').text(periode, { align: 'center' });
    }
    doc.fontSize(9).fillColor('#94a3b8').text(`Genere le ${new Date().toLocaleString('fr-FR')}`, { align: 'center' });
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

      doc.fontSize(11).fillColor('#0f172a').text(`Total vente : ${v.total.toFixed(2)} EUR`, { align: 'right' });
      doc.moveDown(0.6);
      totalPeriode += v.total;
    }

    doc.moveDown(1);
    doc.strokeColor('#1e293b').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor('#0f172a').text(
      `TOTAL PERIODE : ${totalPeriode.toFixed(2)} EUR`,
      { align: 'right' }
    );
    doc.fontSize(10).fillColor('#475569').text(
      `${ventes.length} vente${ventes.length > 1 ? 's' : ''}`,
      { align: 'right' }
    );

    doc.end();
  });
}

module.exports = { echapperCSV, ligneCSV, genererCSV, genererPDF };
