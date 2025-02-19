// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {KRNL, KrnlPayload, KernelParameter, KernelResponse} from "./KRNL.sol";


enum Token { ETH, BTC }

contract priceComparer is KRNL {

 constructor(address _tokenAuthorityPublicKey) KRNL(_tokenAuthorityPublicKey) {}

struct RateData {
  uint256 rate;
  uint256 timestamp;
}

mapping(string => RateData) public rates;

function getExchangeRate(
  KrnlPayload memory krnlPayload,
  Token token
) 

  public
  onlyAuthorized(krnlPayload, abi.encode(token))
  returns (uint256)
  {
    string memory pair;
    if (token == Token.ETH) pair = "ETH/USD";
    else if (token == Token.BTC) pair = "BTC/USD";

    // ensure input is "ETH/USD" or "BTC/USD"
    require (
       keccak256(abi.encodePacked(pair)) == keccak256(abi.encodePacked("ETH/USD")) ||
        keccak256(abi.encodePacked(pair)) == keccak256(abi.encodePacked("BTC/USD")),
        "Invalid input"
    );

    // decode kernel responses
    KernelResponse[] memory kernelResponses = abi.decode(krnlPayload.kernelResponses, (KernelResponse[]));

    uint256 rate;
      for (uint256 i; i < kernelResponses.length; i++) {
      if (kernelResponses[i].kernelId == 341) {
        rate = abi.decode(kernelResponses[i].result, (uint256));
        break;
      }
    }

    return rate;
  }

  function updateSavedRate(
    KrnlPayload memory krnlPayload, 
    Token token
  ) external {
    uint256 rate = getExchangeRate(krnlPayload, token);
    rates[tokenToString(token)] = RateData(rate, block.timestamp);
  }

  function getSavedRate(
    Token token
  ) external view returns (uint256) {
    return rates[tokenToString(token)].rate;
  }

  function tokenToString(Token token) internal pure returns (string memory) {
    if (token == Token.ETH) return "ETH/USD";
    if (token == Token.BTC) return "BTC/USD";
    revert("Invalid token");
  }
}
