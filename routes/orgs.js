// src/routes/orgs.js
import express from 'express';
import { getAllOrganizations } from '../controllers/orgsController.js';

const router = express.Router();

router.get('/', getAllOrganizations);

export default router;
