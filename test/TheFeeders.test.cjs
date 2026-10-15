const {expect}=require('chai');
const hre=require('hardhat');
describe('TheFeeders ERC-1155',function(){
  let nft,owner,buyer;
  beforeEach(async function(){
    [owner,buyer]=await hre.ethers.getSigners();
    nft=await hre.ethers.deployContract('TheFeeders',['ipfs://example/',owner.address]);
    await nft.waitForDeployment();
  });
  it('maps all 52 characters and four tiers to unique IDs',async function(){
    expect(await nft.tokenId(1,0)).to.equal(1n);
    expect(await nft.tokenId(3,2)).to.equal(11n);
    expect(await nft.tokenId(52,3)).to.equal(208n);
    expect(await nft.uri(11)).to.equal('ipfs://example/11.json');
  });
  it('starts paused and editions disabled',async function(){
    expect(await nft.mintPaused()).to.equal(true);
    await expectRevert(nft.connect(buyer).mint(1,1,{value:1n}));
  });
  it('mints exact payment, tracks balances and caps',async function(){
    await nft.setEditionEnabled(1,true);
    await nft.setMintPaused(false);
    const price=await nft.prices(0);
    await nft.connect(buyer).mint(1,10,{value:price*10n});
    expect(await nft.balanceOf(buyer.address,1)).to.equal(10n);
    expect(await nft.remaining(1)).to.equal(20n);
    await expectRevert(nft.connect(buyer).mint(1,1,{value:0}));
    await nft.connect(buyer).mint(1,10,{value:price*10n});
    await nft.connect(buyer).mint(1,10,{value:price*10n});
    await expectRevert(nft.connect(buyer).mint(1,1,{value:price}));
  });
  it('enforces access control and quantity bounds',async function(){
    await expectRevert(nft.connect(buyer).setMintPaused(false));
    await nft.setEditionEnabled(4,true);
    await nft.setMintPaused(false);
    await expectRevert(nft.connect(buyer).mint(4,0));
    await expectRevert(nft.connect(buyer).mint(4,3,{value:(await nft.prices(3))*3n}));
  });
  it('allows owner withdrawal',async function(){
    await nft.setEditionEnabled(1,true);await nft.setMintPaused(false);
    const price=await nft.prices(0);
    await nft.connect(buyer).mint(1,1,{value:price});
    await nft.withdraw(owner.address);
    expect(await hre.ethers.provider.getBalance(await nft.getAddress())).to.equal(0n);
  });
});
async function expectRevert(promise){
  let reverted=false;
  try{await promise;}catch{reverted=true;}
  expect(reverted).to.equal(true);
}
