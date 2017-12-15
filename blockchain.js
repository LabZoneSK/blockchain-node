const crypto = require('crypto');

/* Blockchain */
class Blockchain {
  constructor() {
    this.chain = [];
    this.current_transactions = [];

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
