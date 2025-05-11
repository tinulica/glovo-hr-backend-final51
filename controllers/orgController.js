// ✅ BACKEND
// File: src/controllers/authController.js (adjusted register flow)

import prisma from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password,
        organization: {
          create: {
            name: '',
            bio: '',
          },
        },
      },
      include: {
        organization: true
      }
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// ✅ BACKEND - update org
// File: src/controllers/orgController.js
export const updateOrganization = async (req, res) => {
  try {
    const { name, bio, invites } = req.body;

    const org = await prisma.organization.update({
      where: { id: req.user.orgId },
      data: {
        name,
        bio,
      },
    });

    // TODO: Optionally send invites
    res.json(org);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update organization' });
  }
};

// ✅ FRONTEND
// File: src/pages/CompleteOrganizationSetup.jsx

import React, { useState } from 'react';
import axios from 'axios';

export default function CompleteOrganizationSetup({ onComplete }) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/organization/update', { name, bio });
      onComplete();
    } catch (err) {
      alert('Failed to update organization');
    }
    setLoading(false);
  };

  return (
    <div className="org-setup-container">
      <h2>Complete Organization Setup</h2>
      <form onSubmit={handleSubmit}>
        <label>Organization Name
          <input value={name} onChange={e => setName(e.target.value)} required />
        </label>
        <label>Bio / Description
          <textarea value={bio} onChange={e => setBio(e.target.value)} />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Continue'}</button>
      </form>
    </div>
  );
}
