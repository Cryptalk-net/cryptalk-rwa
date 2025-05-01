import { expect } from "chai";
import { ethers } from "hardhat";
import type { RWAMarketplace, ERC20Mock } from "../typechain";

describe("RWAMarketplace end-to-end", () => {
  let talk: ERC20Mock;
  let market: RWAMarketplace;
  let owner, seller, buyer, middleman, other: any;

  beforeEach(async () => {
    [owner, seller, buyer, middleman, other] = await ethers.getSigners();

    // Deploy a mock TALK token
    const ERC20 = await ethers.getContractFactory("ERC20Mock");
    talk = (await ERC20.deploy("TalkToken", "TALK", seller.address, 0)) as ERC20Mock;
    await talk.deployed();

    // Deploy the marketplace
    const Market = await ethers.getContractFactory("RWAMarketplace");
    market = (await Market.deploy(talk.address)) as RWAMarketplace;
    await market.deployed();

    // Mint some TALK for buyer
    await talk.connect(seller).mint(buyer.address, ethers.parseEther("1000"));

    // Whitelist middleman
    await market.connect(owner).whitelistMiddleman(middleman.address);
  });

  it("lets a seller list, buyer offer, seller accept, middleman approve", async () => {
    // Seller lists an RWA
    await market.connect(seller).listRWA(
      "House", "Nice house", "ipfs://img", ["real-estate"], "property"
    );
    expect(await market.getActiveRWAIds()).to.eql([1]);

    // Buyer approves marketplace to spend TALK
    await talk.connect(buyer).approve(market.target, ethers.parseEther("100"));

    // Buyer makes an offer of 100 TALK
    await market.connect(buyer).makeOffer(1, ethers.parseEther("100"));
    expect(await market.getOfferCount(1)).to.equal(1);

    // Seller accepts the offer
    await market.connect(seller).acceptOffer(1, 0);
    const rwa = await market.getRWA(1);
    expect(rwa.status).to.equal(1); // PendingApproval

    // Middleman approves
    await market.connect(middleman).approveOffer(1);
    const rwa2 = await market.getRWA(1);
    expect(rwa2.owner).to.equal(buyer.address);
    expect(rwa2.status).to.equal(2); // Sold

    // Seller received funds
    const sellerBal = await talk.balanceOf(seller.address);
    expect(sellerBal).to.equal(ethers.parseEther("100"));
  });

  it("allows buyer to cancel and seller to eject offers", async () => {
    await market.connect(seller).listRWA("X","Y","Z",[], "cat");
    await talk.connect(buyer).approve(market.target, ethers.parseEther("50"));
    await market.connect(buyer).makeOffer(1, ethers.parseEther("50"));

    // Buyer cancels
    await market.connect(buyer).cancelOffer(1, 0);
    const o = await market.getOffer(1, 0);
    expect(o.isCancelled).to.be.true;

    // New offer
    await talk.connect(buyer).approve(market.target, ethers.parseEther("20"));
    await market.connect(buyer).makeOffer(1, ethers.parseEther("20"));

    // Seller ejects
    await market.connect(seller).ejectOffer(1, 1);
    const o2 = await market.getOffer(1, 1);
    expect(o2.isCancelled).to.be.true;
  });
});
