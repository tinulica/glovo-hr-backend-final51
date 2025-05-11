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

    // Update organization name and bio
    await prisma.organization.update({
      where: { id: req.user.orgId },
      data: {
        name,
        bio,
        hasCompletedSetup: true
      }
    })

    // Create invite tokens for any additional emails
    for (const email of invites) {
      if (!email.trim()) continue

      // Skip if user already exists
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

export default router
