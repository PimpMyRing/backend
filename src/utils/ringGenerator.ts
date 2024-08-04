import {ethers } from 'ethers';


// generates 100 random wallets and return then as :
// {
//     address: string;
//     privateKey: string;
//     publicKey: string; // compressed public key
// }[]

const generateWallets = (n: number) => {
    const wallets = [];
    for (let i = 0; i < n; i++) {
        const wallet = ethers.Wallet.createRandom();
        wallets.push({
            address: wallet.address,
            privateKey: wallet.privateKey,
            // compressed public key
            publicKey: ethers.utils.computePublicKey(wallet.publicKey, true),
        });
    }
    return wallets;
}

const wallets = generateWallets(100);


// sanity check:
// for each wallet, check if the public key can be used to recover the address
wallets.forEach((wallet) => {
    const address = ethers.utils.computeAddress(wallet.publicKey);
    if (address !== wallet.address) {
        console.log('Error: address mismatch: ', wallet.address, address);
    }
});

console.log(wallets);
