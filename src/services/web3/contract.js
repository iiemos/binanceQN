import { Contract, parseEther } from 'ethers';

export class DAppContract {
  constructor(provider, contractAddress, contractAbi) {
    this.contract = new Contract(contractAddress, contractAbi, provider.getSigner());
  }

  purchaseAndBind(inviter) {
    return this.contract.purchaseAndBind(inviter, { value: parseEther('100') });
  }

  upgradeLevel(targetLevel) {
    const amount = targetLevel === 4 ? parseEther('600') : parseEther('2000');
    return this.contract.upgradeLevel(targetLevel, { value: amount });
  }

  getUserInfo(address) {
    return this.contract.users(address);
  }
}
