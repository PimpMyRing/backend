import { ethers } from 'ethers';
import members from '../db/daoMembers.json';
import "dotenv/config";


async function dispatchEth(addresses: string[]): Promise<void> {
  if (!process.env.RPC_URL || !process.env.PRIVATE_KEY || !process.env.DISPATCHER_ADDRESS) {
    throw new Error("Missing environment variables");
  }

  const value = ethers.utils.parseEther("0.0009");

  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(process.env.DISPATCHER_ADDRESS, ["function dispatch(address[] memory _to) public payable"], signer);

  await contract.dispatch(addresses, { value: value.toBigInt() * BigInt(addresses.length) });
}

(async () => {
  if (!process.env.RPC_URL || !process.env.SBT_ADDRESS) {
    throw new Error("Missing environment variables");
  }

  // get the addresses from ../db/daoMembers.json
  const addresses = members.map((member: {
    address: string,
    privateKey: string,
    publicKey: string
  }) => member.address);

  await dispatchEth(addresses);

  console.log("Dispatched ETH to DAO members");

  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

  // mint the SBT for each address
  let cpt = 1;
  const len = members.length;
  for (const member of members) {
    const signer = new ethers.Wallet(member.privateKey, provider);
    const contract = new ethers.Contract(process.env.SBT_ADDRESS, ["function mint(uint8 level) public"], signer);
    // console.log("member.address", member.address);
    // with manual gas limit
    const result = await contract.mint(1, { gasLimit: 98000});
    await result.wait(3);
    // mint the SBT
    console.log(`${cpt}/${len}\tMinted SBT for ${member.address}`);
    cpt++;
  }
})();