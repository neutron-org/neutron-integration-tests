import MerkleTree from 'merkletreejs';
import crypto from 'crypto';

const sha256 = (x: string): Buffer => {
  const hash = crypto.createHash('sha256');
  hash.update(x);
  return hash.digest();
};

export class Airdrop {
  private tree: MerkleTree;

  constructor(accounts: Array<{ address: string; amount: string }>) {
    const leaves = accounts.map((a) => sha256(a.address + a.amount));
    this.tree = new MerkleTree(leaves, sha256, { sort: true });
  }

  public getMerkleRoot(): string {
    return this.tree.getHexRoot().replace('0x', '');
  }

  public getMerkleProof(account: {
    address: string;
    amount: string;
  }): string[] {
    return this.tree
      .getHexProof(sha256(account.address + account.amount))
      .map((v) => v.replace('0x', ''));
  }
}

export const getTimestamp = (secondsFromNow: number): number =>
  (Date.now() / 1000 + secondsFromNow) | 0;
