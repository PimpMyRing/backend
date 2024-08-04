import { Router } from 'express';
import { Proposal } from '../utils/types';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';

const router = Router();
const dbFilePath = path.join(__dirname, '../db/proposals.json');

/**
 * Reads the proposals from the JSON file.
 * @returns {Promise<Proposal[]>} A promise that resolves to an array of proposals.
 */
const readProposalsFromFile = async (): Promise<Proposal[]> => {
  try {
    const data = await fs.readFile(dbFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading proposals from file:', err);
    return [];
  }
};

/**
 * Writes the proposals to the JSON file.
 * @param {Proposal[]} proposals - The array of proposals to be written to the file.
 * @returns {Promise<void>} A promise that resolves when the proposals have been written.
 */
const writeProposalsToFile = async (proposals: Proposal[]): Promise<void> => {
  try {
    await fs.writeFile(dbFilePath, JSON.stringify(proposals, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing proposals to file:', err);
  }
};

/**
 * GET /api/proposals
 * Retrieves all proposals.
 * @returns {Proposal[]} An array of proposals.
 */
router.get('/proposals', async (req, res) => {
  const proposals = await readProposalsFromFile();
  res.json(proposals);
});

/**
 * GET /api/proposals/:id
 * Retrieves a proposal by ID.
 * @param {string} id - The ID of the proposal to retrieve.
 * @returns {Proposal} The proposal with the specified ID, or a 404 error if not found.
 */
router.get('/proposals/:id', async (req, res) => {
  const proposals = await readProposalsFromFile();
  const proposal = proposals.find(p => p.id === req.params.id);
  if (proposal) {
    res.json(proposal);
  } else {
    res.status(404).json({ message: 'Proposal not found' });
  }
});

/**
 * POST /api/proposals
 * Creates a new proposal.
 * @param {string} title - The title of the proposal.
 * @param {string} description - The description of the proposal.
 * @param {string} publicationDate - The publication date of the proposal.
 * @param {string} closingDate - The closing date of the proposal.
 * @param {number} votes - The number of votes for the proposal.
 * @param {string} author - The author of the proposal. (can be anonymous)
 * @returns {Proposal} The newly created proposal.
 */
router.post('/proposals', async (req, res) => {
  const { title, description, publicationDate, closingDate, votes, author } = req.body;

  // Validate request body
  if (!title || !description || !author || !publicationDate || !closingDate || typeof votes !== 'number') {
    return res.status(400).json({ message: 'Invalid proposal data' });
  }

  // Create a new proposal object
  const newProposal: Proposal = {
    id: uuidv4(),
    title,
    description,
    publicationDate,
    closingDate,
    votes,
    author

  };

  // Read existing proposals, add the new one, and write back to file
  const proposals = await readProposalsFromFile();
  proposals.push(newProposal);
  await writeProposalsToFile(proposals);

  res.status(201).json(newProposal);
});

export default router;