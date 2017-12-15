const uuidv4 = require('uuid/v4');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();

const Blockchain = require('./blockchain');

const blockchain = new Blockchain();

//Create unique identifier for the Node
const nodeID = uuidv4().replace(new RegExp('-', 'g'), '');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send('Node ID: ' + nodeID));

app.get('/mine', (req, res) => {
  //Run PoW algorithm
  const lastBlock = blockchain.getLastBlock();
  const lastProof = lastBlock.proof;

  const proof = blockchain.proofOfWork(lastProof);

  //Receive reward
  const sender = '0';
  const recipient = nodeID;
  const amount = 1;
  blockchain.createTrancaction(sender, recipient, amount);

  //Forge the new Block by adding it to the chain
  const previousHash = Blockchain.bHash(lastBlock);
  const block = blockchain.createBlock(proof, previousHash);

  const response = {
    'message': 'New Block Forged',
    'index': block.index,
    'transactions': block.transactions,
    'proof': block.proof,
    'previous_hash': block.previousHash,
  };

  res.send(JSON.stringify(response));
});

app.get('/chain', (req, res) => {
  const response = {
    'chain': blockchain.chain,
    'length': blockchain.chain.length
  };

  res.send(JSON.stringify(response));
});

app.post('/transaction/new', (req, res) => {
  const sender = req.body.sender;
  const recipient = req.body.recipient;
  const amount = req.body.amount;

  const index = blockchain.createTrancaction(sender, recipient, amount);

  const response = {
    'message': `Transaction will be added to Block ${index}`
  };
  res.send(JSON.stringify(response));
});

app.listen(3000, () => console.log('Example app listening on port 3000!'))
