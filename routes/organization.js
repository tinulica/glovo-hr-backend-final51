// src/routes/organization.js
import express from 'express'
import prisma from '../lib/prisma.js'
import auth from '../middleware/auth.js'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// POST /organizations/setup
router.post('/setup', auth, async (req, res) => {
  try {
    const { name, bio, invites = [] } = req.body

    await prisma.organization.update({
      where: { id: req.user.orgId },
      data: {
        name,
        bio,
        hasCompletedSetup: true
      }
    })

    for (const email of invites) {
      if (!email.trim()) continue

      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) continue

      await prisma.invitation.create({
        data: {
          token: uuidv4(),
          invitedEmail: email,
          inviterId: req.user.id,
          organizationId: req.user.orgId,
        }
      })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Org setup error:', err)
    res.status(500).json({ message: 'Organization setup failed' })
  }
})

// ✅ NEW: GET /organizations
router.get('/', auth, async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true
      }
    })
    res.json(orgs)
  } catch (err) {
    console.error('Fetch orgs error:', err)
    res.status(500).json({ message: 'Failed to fetch organizations' })
  }
})

export default router
