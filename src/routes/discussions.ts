import { Router } from 'express';
import { Discussion, Message, Proposal } from '../utils/types';
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
    return [] as unknown as T;
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
 * Verifies if a proposal with the given ID exists within the specified chain.
 * @param {string} proposalId - The ID of the proposal to check.
 * @param {string} chainId - The chain ID to check in the proposals.
 * @returns {Promise<boolean>} - A promise that resolves to true if the proposal exists, otherwise false.
 */
const proposalExists = async (proposalId: string, chainId: string): Promise<boolean> => {
  const proposals = await readFromFile<{ [key: string]: Proposal[] }>(proposalsDbFilePath);
  const chainProposals = proposals[chainId];
  
  if (!Array.isArray(chainProposals)) {
    console.error(`Invalid proposals data format for chainId ${chainId}. Expected an array.`);
    return false;
  }

  return chainProposals.some(p => p.id === proposalId);
};

/**
 * GET /api/discussions/:chainId/:proposalId
 * Retrieves the discussion associated with a specific proposal within the specified chain.
 * @param {string} chainId - The chain ID to check in the discussions.
 * @param {string} proposalId - The ID of the proposal whose discussion is to be retrieved.
 * @returns {Discussion} - The discussion associated with the specified proposal, or a 404 error if not found.
 */
router.get('/discussions/:chainId/:proposalId', async (req, res) => {
  const { proposalId, chainId } = req.params;
  const discussions = await readFromFile<{ [key: string]: Discussion[] }>(discussionsDbFilePath);
  
  if (!discussions[chainId]) {
    return res.status(404).json({ message: 'Unknown chain id' });
  }

  const discussion = discussions[chainId].find(d => d.proposalId === proposalId);
  if (discussion) {
    res.json(discussion);
  } else {
    res.status(404).json({ message: 'Discussion not found' });
  }
});

/**
 * POST /api/discussions/:chainId/:proposalId/messages
 * Adds a new message to the discussion associated with a specific proposal within the specified chain.
 * @param {string} chainId - The chain ID to check in the discussions.
 * @param {string} proposalId - The ID of the proposal to which the message is to be added.
 * @param {string} body - The body of the message.
 * @param {string} sender - The sender of the message.
 * @param {string} date - The date the message was sent.
 * @returns {Message} - The newly added message, or a 400 error if the message data is invalid, or a 404 error if the proposal is not found.
 */
router.post('/discussions/:chainId/:proposalId/messages', async (req, res) => {
  const { proposalId, chainId } = req.params;
  const { body, sender, date } = req.body;

  if (!body || !sender || !date) {
    return res.status(400).json({ message: 'Invalid message data' });
  }

  if (!await proposalExists(proposalId, chainId)) {
    return res.status(404).json({ message: 'Proposal not found' });
  }

  const newMessage: Message = { body, sender, date };

  const discussions = await readFromFile<{ [key: string]: Discussion[] }>(discussionsDbFilePath);
  
  if (!(chainId in discussions)) {
    discussions[chainId] = [];
  }
  
  let discussion = discussions[chainId].find(d => d.proposalId === proposalId);

  if (discussion) {
    discussion.messages.push(newMessage);
  } else {
    discussion = {
      proposalId,
      messages: [newMessage],
    };
    discussions[chainId].push(discussion);
  }

  await writeToFile(discussionsDbFilePath, discussions);

  res.status(201).json(newMessage);
});

export default router;