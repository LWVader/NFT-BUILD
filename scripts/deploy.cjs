const hre = require('hardhat');
require('dotenv').config();
async function main() {
  const baseURI = process.env.METADATA_BASE_URI;
  if (!baseURI || !baseURI.endsWith('/')) throw new Error('Set METADATA_BASE_URI to a pinned directory ending in /');
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error('Configure DEPLOYER_PRIVATE_KEY');
  const factory = await hre.ethers.getContractFactory('TheFeeders');
  const contract = await factory.deploy(baseURI, deployer.address);
  await contract.waitForDeployment();
  console.log('Network: Base Sepolia (84532)');
  console.log('Contract:', await contract.getAddress());
  console.log('Minting starts PAUSED; enable editions and unpause explicitly after reviewing metadata.');
}
main().catch(e => {console.error(e); process.exitCode=1;});
