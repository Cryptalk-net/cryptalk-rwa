import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("⛏️  Deploying RWA Marketplace with:", deployer.address);

  const TALK_ADDRESS = "0xYourTalkTokenAddressHere";

  const Market = await ethers.getContractFactory("RWAMarketplace");
  const market = await Market.deploy(TALK_ADDRESS);
  await market.deployed();

  console.log(`✅ RWAMarketplace deployed at ${market.target}`);
}

main();
