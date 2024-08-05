import { Router } from 'express';
import fs from 'fs-extra';
import path from 'path';

const router = Router();
const daoMembersDbFilePath = path.join(__dirname, '../db/daoMembers.json');

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
 * GET /api/discussions/:proposalId
 * Retrieves the discussion associated with a specific proposal.
 * @param {string} proposalId - The ID of the proposal whose discussion is to be retrieved.
 * @returns {Discussion} - The discussion associated with the specified proposal, or a 404 error if not found.
 */
router.get('/ring', async (req, res) => {
  try{
    const daoMembers: string[] = await readFromFile(daoMembersDbFilePath);
    res.json(daoMembers.slice(0,19).map((member: any) => member.publicKey));
  } catch (err) {
    console.error(err);

    res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;