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

// Create pri:pub key pairs
let privateKey1 = secp.utils.randomPrivateKey();
let privateKey2 = secp.utils.randomPrivateKey();
let privateKey3 = secp.utils.randomPrivateKey();
let publicKey1 = secp.getPublicKey(privateKey1);
let publicKey2 = secp.getPublicKey(privateKey2);
let publicKey3 = secp.getPublicKey(privateKey3);

// Convert to Ethereum addresses
privateKey1 = '0x' + Buffer.from(privateKey1).toString('hex');
privateKey2 = '0x' + Buffer.from(privateKey2).toString('hex');
privateKey3 = '0x' + Buffer.from(privateKey3).toString('hex');
publicKey1 = '0x' + Buffer.from(publicKey1).toString('hex').slice(-40);
publicKey2 = '0x' + Buffer.from(publicKey2).toString('hex').slice(-40);
publicKey3 = '0x' + Buffer.from(publicKey3).toString('hex').slice(-40);

const balances = {
  [publicKey1]: 100,
  [publicKey2]: 50,
  [publicKey3]: 75,
}

// Logging accounts
console.log('Available Accounts');
console.log('==================');
console.log(JSON.parse(JSON.stringify(balances)));
console.log('Private Keys');
console.log('==================');
console.log(privateKey1);
console.log(privateKey2);
console.log(privateKey3);

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
