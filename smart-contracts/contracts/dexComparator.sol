// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ikernel341.sol";
import {KRNL, KrnlPayload, KernelParameter, KernelResponse} from "./KRNL.sol";

interface IMockOracle {
    function getRandomExchangeRate(string memory input) external view returns (uint256);
}

contract DexPriceComparator is KRNL {

    struct TokenPair {
        address tokenAddress;
        string fiatDenomination;
    }

    struct PriceData {
        uint256 price;
        uint256 timestamp;
        bool isValid;
    }

    mapping(bytes32 => PriceData) public priceData;
    mapping(address => bool) public allowedUsers;

    TokenPair[] public tokenPairs;

    // KRNL Integration
    address public constant KRNL_ADDRESS = 0x0E709e842A7126FFf74F22041Ff10A38e8348e76; // Hardcoded KRNL address
    uint256 public constant KERNEL_ID = 341; // Hardcoded Kernel ID
    address public constant TOKEN_AUTHORITY_PUBLIC_KEY = 0x0284F0F571de0b4cd50fBE62A55e04Afb3d61601; // Hardcoded Token Authority Public Key
    address public constant MOCK_ORACLE_ADDRESS = 0x0E709e842A7126FFf74F22041Ff10A38e8348e76; // Hardcoded Mock Oracle Address
    IMockOracle public mockOracle = IMockOracle(MOCK_ORACLE_ADDRESS);

    // Event for price updates
    event eventPriceUpdated(address tokenAddress, string fiatDenomination, uint256 price);

    constructor() KRNL(TOKEN_AUTHORITY_PUBLIC_KEY) {
        // mockOracle = IMockOracle(MOCK_ORACLE_ADDRESS);  // No longer needed in constructor
    }

    function addTokenPair(address _tokenAddress, string memory _fiatDenomination) public {
        tokenPairs.push(TokenPair(_tokenAddress, _fiatDenomination));
    }

    function requestPrice(
        KrnlPayload memory krnlPayload,
        address _tokenAddress,
        string memory _fiatDenomination
    )
        external
        onlyAuthorized(krnlPayload, abi.encode(_tokenAddress, _fiatDenomination))
    {
        bytes32 queryId = keccak256(abi.encodePacked(_tokenAddress, _fiatDenomination));
        bytes memory input = abi.encodePacked(string.concat(string(abi.encodePacked(_tokenAddress)), "/", _fiatDenomination));
        uint256 price = mockOracle.getRandomExchangeRate(string.concat(string(abi.encodePacked(_tokenAddress)), "/", _fiatDenomination));
        priceData[queryId] = PriceData(price, block.timestamp, true);
        emit eventPriceUpdated(_tokenAddress, _fiatDenomination, price);
    }

    function getPrice(address _tokenAddress, string memory _fiatDenomination) public view returns (uint256, uint256, bool) {
        bytes32 queryId = keccak256(abi.encodePacked(_tokenAddress, _fiatDenomination));
        return (priceData[queryId].price, priceData[queryId].timestamp, priceData[queryId].isValid);
    }

    function comparePrices(address _tokenAddress, string memory _fiatDenomination) public view returns (uint256) {
        bytes32 queryId = keccak256(abi.encodePacked(_tokenAddress, _fiatDenomination));
        return priceData[queryId].price;
    }

    function isValidPrice(address _tokenAddress, string memory _fiatDenomination) public view returns (bool) {
         bytes32 queryId = keccak256(abi.encodePacked(_tokenAddress, _fiatDenomination));
        return priceData[queryId].isValid;
    }

    function getLatestTokenPairs() public view returns (TokenPair[] memory) {
        return tokenPairs;
    }

    function registerDAppUser(KrnlPayload memory krnlPayload) external onlyAuthorized(krnlPayload, abi.encode(msg.sender)) {
        allowedUsers[msg.sender] = true;
    }

    modifier onlyAllowedUser() {
        require(allowedUsers[msg.sender], "User not registered");
        _;
    }
}