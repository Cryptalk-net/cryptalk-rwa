import { expect } from "chai";
import { ethers } from "hardhat";
import type { MiddlemanRole } from "../typechain";

describe("MiddlemanRole access control", () => {
  let ctr: MiddlemanRole, owner, mm, other: any;

  beforeEach(async () => {
    [owner, mm, other] = await ethers.getSigners();
    const C = await ethers.getContractFactory("MiddlemanRoleMock");
    ctr = (await C.deploy()) as MiddlemanRole;
    await ctr.deployed();
  });

  it("only owner can whitelist/delist", async () => {
    // owner whitelists
    await expect(ctr.connect(owner).whitelistMiddleman(mm.address))
      .to.emit(ctr, "MiddlemanWhitelisted")
      .withArgs(mm.address);

    // non-owner cannot
    await expect(
      ctr.connect(other).whitelistMiddleman(other.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("only whitelisted can call a onlyMiddleman fn", async () => {
    await ctr.connect(owner).whitelistMiddleman(mm.address);
    await expect(ctr.connect(mm).onlyMmFunction())
      .to.emit(ctr, "CalledByMm");
    await expect(ctr.connect(other).onlyMmFunction())
      .to.be.revertedWith("Not a middleman");
  });
});
