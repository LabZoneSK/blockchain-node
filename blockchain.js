const crypto = require('crypto');
const request = require('request');
const url = require('url');

/* Blockchain */
class Blockchain {
  constructor() {
    this.chain = [];
    this.current_transactions = [];
    this.nodes = new Set();

    //Create the genesis block (it does not have predecessor)
    this.createBlock(1, 100);
  }

  /**
   * Creates a new Block in the Blockchain
   * 
   * @param {int} proof The proof given by the Proof of Work algorithm 
   * @param {string} previousHash Hash of previous Block (optional) 
   */
  createBlock(proof, previousHash = '') {
    const block = {
      'index': this.chain.length + 1,
      'timestamp': Date.now(),
      'transactions': this.current_transactions,
      proof,
      previousHash,
    };

    this.current_transactions = [];

    this.chain.push(block);

    const lastBlockIndex = this.getLastBlock().index;
    return lastBlockIndex + 1;
  }

  /**
   * Creates a new transaction to go into the next mined block.
   * @param sender string Address of the Sender
   * @param recipient strin Address of the Recipient
   * @param amount int Amount
   * @returns int The index of the Block that will hold this transaction
   */
  createTrancaction(sender, recipient, amount) {
    this.current_transactions.push({
      sender,
      recipient,
      amount
    });

    return this.getLastBlock().index + 1;
  }

  /**
   * Returns last Block in the Chain
   * @returns {*} Last Block
   */
  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  proofOfWork(lastProof) {
    let proof = 0;
    while (this.validProof(lastProof, proof) === false) {
      proof += 1;
    }

    return proof;
  }

  validProof(lastProof, proof) {
    const guess = `${lastProof}${proof}`;
    const hash = crypto.createHash('sha256');
    hash.update(guess)
    const guesHash = hash.digest('hex');
    return /^0{4}.*/.test(guesHash);
  }

  registerNode(address) {
    //TODO: Make sure that nodes are unique
    const parsedUrl = url.parse(address);
    this.nodes.add(parsedUrl);
  }

  /**
   * Determines if a given blockchain is valid
   * @param {list} chain A blockchain
   * @returns {boolean} True if valid, False if not 
   */
  validChain(blockchain) {

    let lastBlock = blockchain.chain[0];
    let currenIndex = 1;

    while (currenIndex < blockchain.length) {
      const block = blockchain.chain[currenIndex];

      console.log(lastBlock);
      console.log(block);
      console.log('----------------');

      //Check that the hash of the block is correct
      if (block.previousHash !== Blockchain.bHash(lastBlock)) {
        return false;
      }

      lastBlock = block;
      currenIndex += 1;
    }

    return true;
  }

  /**
   * This is our Consensus Algorithm, it resolves conflicts
   * by replacing our chain with the longest one in the network.
   * @returns {boolean} True if our chain was replaced, False if not
   */
  resolveConflicts() {
      const neighbours = this.nodes;
      let newChain = null;

      //We are looking only for longer chains than ours
      let maxLength = this.chain.length;

      //Grab and verify the chains from all nodes in our network
      for (let node of neighbours) {
        request(`http://${node.host}/chain`, (error, response, body) => {
          const chain = JSON.parse(body);
          const length = chain.length;

          //Check if length is longer and chain is valid
          if (length > maxLength && this.validChain(chain)) {
            maxLength = length;
            newChain = chain;
          }

          if (newChain) {
            this.chain = newChain;
            return true;
          }
        });

      }

      return false;
    }
    //Static methods

  /**
   * Creates a SHA-256 hash of a Block
   * @param {Object} block
   * @returns {string} 
   */
  static bHash(block) {
    const hash = crypto.createHash('sha256');
    const blockAsString = JSON.stringify(block, Object.keys(block).sort());
    hash.update(blockAsString);
    return hash.digest('hex');
  }
}

module.exports = Blockchain;
