const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const secp = require('@noble/secp256k1');
const {keccak_256} = require('@noble/hashes/sha3');
const {bytesToHex} = require('@noble/hashes/utils');

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

// Generate account storage
const privateKeys = [];
const balances = [100, 50, 75];
const publicKeys = [];

// Start log
console.log("Available Accounts\n" + "====================");

for (let i = 0; i < balances.length; i++) {

  // Generare pub:priv key pairs
  const privateKey = secp.utils.randomPrivateKey();
  const publicKey = secp.getPublicKey(privateKey);

  // Store key pairs
  privateKeys[i] = privateKey;
  publicKeys[i] = publicKey;

  // Continue log
  console.log(`${Buffer.from(privateKey).toString('hex')}`);
  console.log(`${Buffer.from(publicKey).toString('hex')}`);
  // console.log(`0x${Buffer.from(privateKey).toString('hex')}`);
  // console.log(`0x${Buffer.from(publicKey).toString('hex').slice(-40)}`);
  console.log(`Balance: ${balances[i]}`);
}

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {

  // Add signature to client/index.js
  const {sender, recipient, amount, signature} = req.body;
  // Hash a message to create input for recoverPublicKey
  const msgHash = bytesToHex(keccak_256(JSON.stringify({sender, recipient, amount})));
  // recoverPublicKey finds the assosciated public key of a signing private key
  const recoveredPublicKey = secp.recoverPublicKey(msgHash, signature);

  if(balances[recoveredPublicKey]) {
    balances[sender] -= amount;
    balances[recipient] = (balances[recipient] || 0) + +amount;
    res.send({ balance: balances[sender] });
  }
  console.log("Address was not found in server");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
