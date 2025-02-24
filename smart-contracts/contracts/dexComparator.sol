// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {KRNL, KrnlPayload, KernelParameter, KernelResponse} from "./KRNL.sol";

enum Token {
    ETH,
    BTC
}
enum Dex {
    Dex1,
    Dex2,
    Dex3
}

contract priceComparer is KRNL {
    constructor(
        address _tokenAuthorityPublicKey
    ) KRNL(_tokenAuthorityPublicKey) {}

    struct RateData {
        uint256 rate;
        uint256 timestamp;
    }

    mapping(Dex => mapping(Token => RateData)) public rates;

    function updateDexRates(
        KrnlPayload memory krnlPayload,
        Dex dex,
        Token token
    ) public onlyAuthorized(krnlPayload, abi.encode(token)) {
        // Get pair from token type
        string memory pair = token == Token.ETH ? "ETH/USD" : "BTC/USD";

           require (
       keccak256(abi.encodePacked(pair)) == keccak256(abi.encodePacked("ETH/USD")) ||
        keccak256(abi.encodePacked(pair)) == keccak256(abi.encodePacked("BTC/USD")),
        "Invalid input"
    );

        // Process kernel response
        KernelResponse[] memory responses = abi.decode(
            krnlPayload.kernelResponses,
            (KernelResponse[])
        );

        // Find matching response (same pair)
        for (uint i; i < responses.length; i++) {
            if (responses[i].kernelId != 341) continue;

            // Store the rate
            uint256 rate = abi.decode(responses[i].result, (uint256));
            rates[dex][token] = RateData(rate, block.timestamp);
            break;
        }
    }
    function getRateForDex(Dex dex, Token token) public view returns (uint256) {
        return rates[dex][token].rate;
    }

    function findBestDeal(Token token) public view returns (Dex, uint256) {
        uint256 bestPrice = type(uint256).max;
        Dex bestDex = Dex.Dex1;
        uint256 validWindow = 24 hours;

        for (uint i = 0; i < 3; i++) {
            Dex currentDex = Dex(i);
            RateData memory data = rates[currentDex][token];

            if (
                data.rate != 0 &&
                (block.timestamp - data.timestamp) <= validWindow &&
                data.rate < bestPrice
            ) {
                bestPrice = data.rate;
                bestDex = currentDex;
            }
        }

        require(bestPrice != type(uint256).max, "No valid rates available");
        return (bestDex, bestPrice);
    }

    function getAllRates()
        external
        view
        returns (
            uint256[3] memory ethRates,
            uint256[3] memory btcRates,
            uint256[3] memory timestamps
        )
    {
        for (uint i = 0; i < 3; i++) {
            Dex dex = Dex(i);
            ethRates[i] = rates[dex][Token.ETH].rate;
            btcRates[i] = rates[dex][Token.BTC].rate;
            timestamps[i] = rates[dex][Token.ETH].timestamp;
        }
    }
}
