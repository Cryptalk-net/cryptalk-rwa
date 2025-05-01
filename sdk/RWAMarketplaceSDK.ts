import { ethers } from "ethers";
import type { Provider, Signer } from "ethers";
import { RWAMARKETPLACE_ADDRESS, RWAMARKETPLACE_ABI } from "./constants";
import type { Metadata, RWA, Offer, ListingStatus } from "./types";
import { WalletClient } from "@reown/appkit";

export class RWAMarketplaceSDK {
  private contract: ethers.Contract;

  private constructor(signerOrProvider: Signer | Provider) {
    this.contract = new ethers.Contract(
      RWAMARKETPLACE_ADDRESS,
      RWAMARKETPLACE_ABI,
      signerOrProvider
    );
  }

  /** Connect using a Reown WalletClient */
  static async connect(wc: WalletClient) {
    const signer = await wc.getSigner();
    return new RWAMarketplaceSDK(signer);
  }

  /** List a new RWA */
  async listRWA(meta: Metadata): Promise<ethers.providers.TransactionResponse> {
    return this.contract.listRWA(
      meta.title,
      meta.description,
      meta.image,
      meta.tags,
      meta.category
    );
  }

  /** Fetch one RWA by ID */
  async getRWA(id: number): Promise<RWA> {
    const [ title, desc, image, tags, category, owner, status ] =
      await this.contract.getRWA(id);
    return {
      meta: { title, description: desc, image, tags, category },
      owner,
      status: status as ListingStatus
    };
  }

  /** Make an offer in $TALK */
  async makeOffer(id: number, amount: bigint) {
    return this.contract.makeOffer(id, amount);
  }

  /** Cancel your own offer */
  async cancelOffer(id: number, idx: number) {
    return this.contract.cancelOffer(id, idx);
  }

  /** Seller rejects a non-accepted offer */
  async rejectOffer(id: number, idx: number) {
    return this.contract.rejectOffer(id, idx);
  }

  /** Seller accepts an offer */
  async acceptOffer(id: number, idx: number) {
    return this.contract.acceptOffer(id, idx);
  }

  /** Middleman approves the accepted offer */
  async approveOffer(id: number) {
    return this.contract.approveOffer(id);
  }

  /** Helpers to inspect offers */
  async getOfferCount(id: number): Promise<number> {
    return (await this.contract.getOfferCount(id)).toNumber();
  }
  async getOffer(id: number, idx: number): Promise<Offer> {
    const [buyer, amount, isAccepted, isExecuted, isCancelled] =
      await this.contract.getOffer(id, idx);
    return { buyer, amount, isAccepted, isExecuted, isCancelled };
  }

  /** List all active RWA IDs */
  async getActiveRWAIds(): Promise<number[]> {
    return (await this.contract.getActiveRWAIds()).map((bn: any) => bn.toNumber());
  }
}
