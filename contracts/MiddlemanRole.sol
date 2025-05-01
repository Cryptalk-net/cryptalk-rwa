// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MiddlemanRole is Ownable {
    mapping(address => bool) public isMiddleman;

    event MiddlemanWhitelisted(address indexed mm);
    event MiddlemanDelisted(address indexed mm);

    constructor() payable Ownable(msg.sender) {}

    function whitelistMiddleman(address _mm) external onlyOwner {
        isMiddleman[_mm] = true;
        emit MiddlemanWhitelisted(_mm);
    }

    function delistMiddleman(address _mm) external onlyOwner {
        isMiddleman[_mm] = false;
        emit MiddlemanDelisted(_mm);
    }
}
