export interface Metadata {
  title: string;
  description: string;
  image: string;
  tags: string[];
  category: string;
}

export enum ListingStatus {
  Active = 0,
  PendingApproval = 1,
  Sold = 2,
}

export interface RWA {
  meta: Metadata;
  owner: string;
  status: ListingStatus;
}

export interface Offer {
  buyer: string;
  amount: bigint;
  isAccepted: boolean;
  isExecuted: boolean;
  isCancelled: boolean;
}
