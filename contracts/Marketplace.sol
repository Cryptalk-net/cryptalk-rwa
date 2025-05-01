// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./DataTypes.sol";
import "./MiddlemanRole.sol";

contract RWAMarketplace is MiddlemanRole {
    IERC20 public immutable TALK;
    uint256 private nextRwaId = 1;

    mapping(uint256 => DataTypes.RWA) public rwas;
    mapping(uint256 => DataTypes.Offer[]) private offers;

    event RWAListed(uint256 indexed rwaId, address indexed seller);
    event OfferMade(uint256 indexed rwaId, uint256 indexed offerIdx, address indexed buyer, uint256 amount);
    event OfferCancelled(uint256 indexed rwaId, uint256 indexed offerIdx);
    event OfferRejected(uint256 indexed rwaId, uint256 indexed offerIdx);
    event OfferAccepted(uint256 indexed rwaId, uint256 indexed offerIdx);
    event OfferApproved(uint256 indexed rwaId, uint256 indexed offerIdx);

    // Explicitly call parent constructors
    constructor(IERC20 _talk) MiddlemanRole() {
        TALK = _talk;
    }

    function listRWA(
        string calldata title,
        string calldata description,
        string calldata image,
        string[] calldata tags,
        string calldata category
    ) external {
        uint256 id = nextRwaId++;
        DataTypes.Metadata memory m = DataTypes.Metadata({
            title: title,
            description: description,
            image: image,
            tags: tags,
            category: category
        });
        rwas[id] = DataTypes.RWA({ metadata: m, owner: msg.sender, status: DataTypes.ListingStatus.Active });
        emit RWAListed(id, msg.sender);
    }

    function makeOffer(uint256 _rwaId, uint256 _amount) external {
        DataTypes.RWA storage r = rwas[_rwaId];
        require(r.status == DataTypes.ListingStatus.Active, "not for sale");
        require(_amount > 0, "zero amount");

        TALK.transferFrom(msg.sender, address(this), _amount);

        offers[_rwaId].push(DataTypes.Offer({
            buyer: msg.sender,
            amount: _amount,
            isAccepted: false,
            isExecuted: false,
            isCancelled: false
        }));

        emit OfferMade(_rwaId, offers[_rwaId].length - 1, msg.sender, _amount);
    }

    function cancelOffer(uint256 _rwaId, uint256 _offerIdx) external {
        DataTypes.Offer storage o = offers[_rwaId][_offerIdx];
        require(o.buyer == msg.sender, "not your offer");
        require(!o.isAccepted && !o.isCancelled, "cannot cancel");

        o.isCancelled = true;
        TALK.transfer(msg.sender, o.amount);

        emit OfferCancelled(_rwaId, _offerIdx);
    }

    function rejectOffer(uint256 _rwaId, uint256 _offerIdx) external {
        DataTypes.RWA storage r = rwas[_rwaId];
        require(r.owner == msg.sender, "not seller");

        DataTypes.Offer storage o = offers[_rwaId][_offerIdx];
        require(!o.isAccepted && !o.isCancelled, "cannot reject");

        o.isCancelled = true;
        TALK.transfer(o.buyer, o.amount);

        emit OfferRejected(_rwaId, _offerIdx);
    }

    function acceptOffer(uint256 _rwaId, uint256 _offerIdx) external {
        DataTypes.RWA storage r = rwas[_rwaId];
        require(r.owner == msg.sender, "not seller");
        require(r.status == DataTypes.ListingStatus.Active, "invalid status");

        DataTypes.Offer storage chosen = offers[_rwaId][_offerIdx];
        require(!chosen.isCancelled && !chosen.isAccepted, "bad offer");

        chosen.isAccepted = true;
        r.status = DataTypes.ListingStatus.PendingApproval;

        emit OfferAccepted(_rwaId, _offerIdx);

        for (uint256 i = 0; i < offers[_rwaId].length; i++) {
            if (i != _offerIdx) {
                DataTypes.Offer storage o = offers[_rwaId][i];
                if (!o.isCancelled && !o.isAccepted) {
                    o.isCancelled = true;
                    TALK.transfer(o.buyer, o.amount);
                    emit OfferRejected(_rwaId, i);
                }
            }
        }
    }

    function approveOffer(uint256 _rwaId) external {
        require(isMiddleman[msg.sender], "not middleman");

        DataTypes.RWA storage r = rwas[_rwaId];
        require(r.status == DataTypes.ListingStatus.PendingApproval, "not pending");

        uint256 idx = _getAcceptedOfferIndex(_rwaId);

        DataTypes.Offer storage o = offers[_rwaId][idx];
        require(!o.isExecuted, "already executed");

        o.isExecuted = true;
        r.status = DataTypes.ListingStatus.Sold;

        address seller = r.owner;
        r.owner = o.buyer;

        TALK.transfer(seller, o.amount);

        emit OfferApproved(_rwaId, idx);
    }

    function _getAcceptedOfferIndex(uint256 _rwaId) internal view returns (uint256) {
        for (uint256 i = 0; i < offers[_rwaId].length; i++) {
            if (offers[_rwaId][i].isAccepted) {
                return i;
            }
        }
        revert("no accepted offer");
    }

    function getOfferCount(uint256 _rwaId) external view returns (uint256) {
        return offers[_rwaId].length;
    }

    function getOffer(uint256 _rwaId, uint256 _offerIdx)
        external
        view
        returns (address buyer, uint256 amount, bool isAccepted, bool isExecuted, bool isCancelled)
    {
        DataTypes.Offer storage o = offers[_rwaId][_offerIdx];
        return (o.buyer, o.amount, o.isAccepted, o.isExecuted, o.isCancelled);
    }

    function getRWA(uint256 _rwaId)
        external
        view
        returns (
            string memory title,
            string memory description,
            string memory image,
            string[] memory tags,
            string memory category,
            address owner,
            DataTypes.ListingStatus status
        )
    {
        DataTypes.RWA storage r = rwas[_rwaId];
        return (
            r.metadata.title,
            r.metadata.description,
            r.metadata.image,
            r.metadata.tags,
            r.metadata.category,
            r.owner,
            r.status
        );
    }

    function getActiveRWAIds() external view returns (uint256[] memory) {
        uint256 total = nextRwaId - 1;
        uint256 count;
        for (uint256 i = 1; i <= total; i++) {
            if (rwas[i].status == DataTypes.ListingStatus.Active) {
                count++;
            }
        }

        uint256[] memory list = new uint256[](count);
        uint256 j;
        for (uint256 i = 1; i <= total; i++) {
            if (rwas[i].status == DataTypes.ListingStatus.Active) {
                list[j++] = i;
            }
        }
        return list;
    }
}