import { Router } from 'express';
import { Proposal, Discussion } from '../utils/types';
import fs from 'fs-extra';
import path from 'path';

const router = Router();
const proposalsDbFilePath = path.join(__dirname, '../db/proposals.json');
const discussionsDbFilePath = path.join(__dirname, '../db/discussions.json');

/**
 * Reads the data from the specified JSON file.
 * @param {string} filePath - The path to the JSON file.
 * @returns {Promise<T>} - A promise that resolves to the data read from the file.
 */
const readFromFile = async <T>(filePath: string): Promise<T> => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading from file ${filePath}:`, err);
    return {} as T;
  }
};

/**
 * Writes the data to the specified JSON file.
 * @param {string} filePath - The path to the JSON file.
 * @param {T} data - The data to write to the file.
 * @returns {Promise<void>} - A promise that resolves when the data is written to the file.
 */
const writeToFile = async <T>(filePath: string, data: T): Promise<void> => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing to file ${filePath}:`, err);
  }
};

/**
 * GET /api/proposals
 * Retrieves all proposals.
 * @returns {Proposal[]} An array of proposals.
 */
router.get('/proposals', async (req, res) => {
  const proposals = await readFromFile<{ "10": Proposal[], "8453": Proposal[], "11155420": Proposal[] }>(proposalsDbFilePath);
  res.json(proposals);
});

/**
 * GET /api/proposals/:chainId/:id
 * Retrieves a proposal by ID.
 * @param {string} chainId - The chain ID of the proposal.
 * @param {string} id - The ID of the proposal to retrieve.
 * @returns {Proposal} The proposal with the specified ID, or a 404 error if not found.
 */
router.get('/proposals/:chainId/:id', async (req, res) => {
  const { chainId, id } = req.params;

  if (chainId != "10" && chainId != "8453" && chainId != "11155420") {
    return res.status(404).json({ message: 'Unknown chain id' });
  }

  const proposals = await readFromFile<{ "10": Proposal[], "8453": Proposal[], "11155420": Proposal[] }>(proposalsDbFilePath);
  const proposal = proposals[chainId].find(p => p.id === id);

  if (proposal) {
    res.json(proposal);
  } else {
    res.status(404).json({ message: 'Proposal not found' });
  }
});

/**
 * POST /api/proposals/:chainId
 * Creates a new proposal and the associated discussion structure.
 * @param {string} chainId - The chain ID where the proposal is being created.
 * @returns {Proposal} The newly created proposal.
 */
router.post('/proposals/:chainId', async (req, res) => {
  const { title, description, publicationDate, closingDate, votes, author, proposalId } = req.body;
  const { chainId } = req.params;

  // Validate request body
  if (
    !title ||
    !author ||
    !publicationDate ||
    !closingDate ||
    typeof votes !== 'number' ||
    typeof proposalId !== 'number' ||
    (chainId !== "10" && chainId !== "8453" && chainId !== "11155420")
  ) {
    return res.status(400).json({ message: 'Invalid proposal data' });
  }

  // Create a new proposal object
  const newProposal: Proposal = {
    id: proposalId.toString(),
    title,
    description,
    publicationDate,
    closingDate,
    votes,
    author
  };

  // Read existing proposals, add the new one, and write back to file
  const proposals = await readFromFile<{ "10": Proposal[], "8453": Proposal[], "11155420": Proposal[] }>(proposalsDbFilePath);
  proposals[chainId].push(newProposal);
  await writeToFile(proposalsDbFilePath, proposals);

  // Now create the associated discussion structure
  const discussions = await readFromFile<{ "10": Discussion[], "8453": Discussion[], "11155420": Discussion[] }>(discussionsDbFilePath);

  // Ensure the discussion structure exists for this chainId
  if (!discussions[chainId]) {
    discussions[chainId] = [];
  }

  // Add the new discussion structure
  discussions[chainId].push({
    proposalId: proposalId.toString(),
    messages: []
  });

  // Write the updated discussions back to file
  await writeToFile(discussionsDbFilePath, discussions);

  res.status(201).json(newProposal);
});

/**
 * PATCH /api/proposals/:chainId/:id/vote
 * Increments the vote count of a proposal by 1.
 * NEEDS ONCHAIN CHECK - POC only
 * @param {string} chainId - The chain ID where the proposal is located.
 * @param {string} id - The ID of the proposal to increment the vote count.
 * @returns {Proposal} The updated proposal, or a 404 error if not found.
 */
router.patch('/proposals/:chainId/:id/vote', async (req, res) => {
  const { chainId, id } = req.params;

  if (chainId != "10" && chainId != "8453" && chainId != "11155420") {
    return res.status(404).json({ message: 'Unknown chain id' });
  }

  const proposals = await readFromFile<{ "10": Proposal[], "8453": Proposal[], "11155420": Proposal[] }>(proposalsDbFilePath);
  const proposalIndex = proposals[chainId].findIndex(p => p.id === id);

  if (proposalIndex === -1) {
    return res.status(404).json({ message: 'Proposal not found' });
  }

  proposals[chainId][proposalIndex].votes += 1;
  await writeToFile(proposalsDbFilePath, proposals);

  res.json(proposals[chainId][proposalIndex]);
});

export default router;