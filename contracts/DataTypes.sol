// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library DataTypes {
    enum ListingStatus { Active, PendingApproval, Sold }

    struct Metadata {
        string title;
        string description;
        string image;
        string[] tags;
        string category;
    }

    struct RWA {
        Metadata metadata;
        address owner;
        ListingStatus status;
    }

    struct Offer {
        address buyer;
        uint256 amount;
        bool isAccepted;
        bool isExecuted;
        bool isCancelled;
    }
}