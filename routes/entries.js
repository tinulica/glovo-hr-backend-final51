// routes/entries.js
const express = require('express');
const auth    = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const router  = express.Router();
const prisma  = new PrismaClient();

// Add entry (all fields)
router.post('/add', auth, async (req, res) => {
  const {
    numeCompanie,
    idCurier,
    oras,
    nume,
    email,
    contActiv,
    balantaCashActuala,
    garantate,
    comenzi,
    stornoTaxaLivrare,
    bonusRecomandare,
    bonusNumarComenzi,
    bonusColantare,
    alteBonusuri,
    recalculariVenituriAnterioare,
    venituri,
    taxaLivrare,
    plataZilnicaCash,
    ajustariPerioadaAnterioara,
    tips,
    taxaDeschidereCont,
    taxaAplicatie,
    ajustariTotale,
    totalVenituriDeTransferat
  } = req.body;

  const entry = await prisma.entry.create({
    data: {
      numeCompanie,
      idCurier,
      oras,
      nume,
      email,
      contActiv,
      balantaCashActuala: parseFloat(balantaCashActuala),
      garantate: parseFloat(garantate),
      comenzi: parseInt(comenzi, 10),
      stornoTaxaLivrare: parseFloat(stornoTaxaLivrare),
      bonusRecomandare: parseFloat(bonusRecomandare),
      bonusNumarComenzi: parseFloat(bonusNumarComenzi),
      bonusColantare: parseFloat(bonusColantare),
      alteBonusuri: parseFloat(alteBonusuri),
      recalculariVenituriAnterioare: parseFloat(recalculariVenituriAnterioare),
      venituri: parseFloat(venituri),
      taxaLivrare: parseFloat(taxaLivrare),
      plataZilnicaCash: parseFloat(plataZilnicaCash),
      ajustariPerioadaAnterioara: parseFloat(ajustariPerioadaAnterioara),
      tips: parseFloat(tips),
      taxaDeschidereCont: parseFloat(taxaDeschidereCont),
      taxaAplicatie: parseFloat(taxaAplicatie),
      ajustariTotale: parseFloat(ajustariTotale),
      totalVenituriDeTransferat: parseFloat(totalVenituriDeTransferat),
      adminId: req.user.role === 'admin' ? req.user.id : req.user.ownerId,
      createdBy: req.user.id
    }
  });

  res.status(201).json(entry);
});

// List entries (unchanged—Prisma will return all fields by default)
router.get('/list', auth, async (req, res) => {
  const adminId = req.user.role === 'admin' ? req.user.id : req.user.ownerId;
  const entries = await prisma.entry.findMany({
    where: { adminId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(entries);
});

module.exports = router;
