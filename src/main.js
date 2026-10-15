import {BrowserProvider, Contract, formatEther, isAddress} from 'ethers';
import characters from './characters.json';

const ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
const CHAIN_ID = '0x14a34'; // 84532 Base Sepolia
const ABI = [
  'function mint(uint256 id,uint256 quantity) payable',
  'function tokenId(uint256 character,uint256 tier) pure returns(uint256)',
  'function prices(uint256 tier) view returns(uint256)',
  'function remaining(uint256 id) view returns(uint256)',
  'function balanceOf(address account,uint256 id) view returns(uint256)',
  'function enabled(uint256 id) view returns(bool)',
  'function mintPaused() view returns(bool)'
];
const el = id=>document.getElementById(id);
const tiers=['Common','Uncommon','Rare','Legendary'];
let provider, signer, contract, account;
for (const c of characters) {
  const option=document.createElement('option');option.value=c.id;option.textContent=`#${String(c.id).padStart(2,'0')} ${c.name}`;
  el('character').append(option);
}
el('character').value='3';
function selection(){
  const character=Number(el('character').value);
  const tier=Number(el('tier').value);
  return {character,tier,id:(character-1)*4+tier+1,entry:characters.find(c=>c.id===character)};
}
function status(message){el('status').textContent=message;}
function updateCard(){
  const {character,tier,id,entry}=selection();
  if (!entry) return;
  el('cardArtwork').src=entry.image;
  el('cardArtwork').alt=`${entry.name} collectible artwork`;
  el('cardTitle').textContent=entry.name;
  el('backTitle').textContent=entry.name;
  el('backDescription').textContent=entry.description;
  el('frontSerial').textContent=`THE FEEDERS · #${String(character).padStart(2,'0')} · ${tiers[tier]}`;
  el('backSerial').textContent=`ERC-1155 · TOKEN ${id}`;
  el('backEdition').textContent=`${tiers[tier]} · ${[30,12,6,2][tier]} max`;
  el('tokenId').textContent=String(id);
}
async function refresh(){
  updateCard();el('mint').disabled=true;
  if(!contract)return;
  const {tier,id}=selection();
  try{
    const [price,remaining,enabled,paused,balance]=await Promise.all([
      contract.prices(tier),contract.remaining(id),contract.enabled(id),contract.mintPaused(),account?contract.balanceOf(account,id):Promise.resolve(null)
    ]);
    el('price').textContent=`${formatEther(price)} ETH`;
    el('remaining').textContent=String(remaining);
    el('balance').textContent=balance===null?'—':String(balance);
    el('mint').disabled=!account||paused||!enabled||remaining===0n;
    status(paused?'Minting is paused by the contract owner.':!enabled?'This edition is not enabled for minting.':'Edition ready for testnet minting.');
  }catch(e){status(`Contract read failed: ${e.shortMessage||e.message}`);}
}
async function connect(){
  if(!window.ethereum){status('Install a compatible browser wallet such as MetaMask to continue.');return;}
  if(!isAddress(ADDRESS)){status('Set VITE_CONTRACT_ADDRESS in .env to the deployed Base Sepolia contract.');return;}
  try{
    await window.ethereum.request({method:'eth_requestAccounts'});
    await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN_ID}]}).catch(async err=>{
      if(err.code!==4902)throw err;
      await window.ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:CHAIN_ID,chainName:'Base Sepolia',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:['https://sepolia.base.org'],blockExplorerUrls:['https://sepolia.basescan.org']} ]});
    });
    provider=new BrowserProvider(window.ethereum);
    const network=await provider.getNetwork();
    if(network.chainId!==84532n)throw new Error('Wrong chain; select Base Sepolia.');
    signer=await provider.getSigner();account=await signer.getAddress();
    contract=new Contract(ADDRESS,ABI,signer);
    el('connect').textContent=`Connected: ${account.slice(0,6)}…${account.slice(-4)}`;
    await refresh();
  }catch(e){status(`Wallet connection failed: ${e.shortMessage||e.message}`);}
}
async function mint(){
  if(!contract)return;
  const {id,tier}=selection();
  const qty=Number(el('quantity').value);
  if(!Number.isInteger(qty)||qty<1||qty>10){status('Quantity must be a whole number from 1 to 10.');return;}
  el('mint').disabled=true;
  try{
    const [price,remaining]=await Promise.all([contract.prices(tier),contract.remaining(id)]);
    if(BigInt(qty)>remaining)throw new Error('Requested quantity exceeds remaining supply.');
    const tx=await contract.mint(id,qty,{value:price*BigInt(qty)});
    status(`Transaction submitted: ${tx.hash}. Waiting for confirmation…`);
    await tx.wait();
    status(`Mint confirmed! Transaction: https://sepolia.basescan.org/tx/${tx.hash}`);
    await refresh();
  }catch(e){status(`Mint failed: ${e.shortMessage||e.reason||e.message}`);await refresh();}
}
el('connect').addEventListener('click',connect);
el('mint').addEventListener('click',mint);
for(const id of ['character','tier'])el(id).addEventListener('change',refresh);
if(window.ethereum){window.ethereum.on?.('accountsChanged',()=>location.reload());window.ethereum.on?.('chainChanged',()=>location.reload());}
updateCard();
if(!isAddress(ADDRESS))status('Preview mode: set VITE_CONTRACT_ADDRESS after deploying on Base Sepolia.');
