import "@typechain/hardhat";

export default {
  solidity: "0.8.17",
  typechain: {
    outDir: "typechain",        // where to put generated files
    target: "ethers-v6"         // generate bindings for ethers.js v6
  }
};
