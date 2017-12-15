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

app.get('/nodes/resolve', (req, res) => {
  const replaced = blockchain.resolveConflicts();

  let response = {};
  if (replaced) {
    response = {
      'message': 'Our chain was replaced',
      'new_chain': blockchain.chain
    }
  } else {
    response = {
      'message': 'Our chain is authoritative',
      'chain': blockchain.chain
    }
  }
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

app.post('/nodes/register/all', (req, res) => {
  const nodes = req.body.nodes;

  if (!nodes || nodes.length === 0) {
    res.send(JSON.stringify({
      'message': 'ERROR: Please provide a valid list of nodes.'
    }));
    return false;
  }

  nodes.map(node => blockchain.registerNode(node));

  response = {
    'message': 'New nodes have been added',
    'total_nodes': JSON.stringify(blockchain.nodes),
  }
  res.send(JSON.stringify(response));
});

app.listen(3001, () => console.log('Example app listening on port 3000!'))
