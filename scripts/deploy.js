const hre = require("hardhat");

async function main() {
  const CocoaChain = await hre.ethers.getContractFactory("CocoaChain");
  const cocoa = await CocoaChain.deploy();

  await cocoa.waitForDeployment();   // <-- THIS is the correct one now

  console.log("CocoaChain deployed to:", cocoa.target);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
