// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ikernel341.sol";

contract DexPriceComparator {

    struct TokenPair {
        address tokenAddress;
        string fiatDenomination;
    }

    mapping(bytes32 => uint256) public prices; // queryId => price
    mapping(bytes32 => uint256) public timestamps; // queryId => timestamp
    mapping(bytes32 => bool) public priceIsValid; // queryId => isValid

    TokenPair[] public tokenPairs;

    // KRNL Integration
    address public krnlAddress;
    uint256 public kernelId;
    address public tokenAuthority; // Not really used in this example.

    // Event for price updates
    event eventPriceUpdated(address tokenAddress, string fiatDenomination, uint256 price);

    constructor(address _krnlAddress, uint256 _kernelId, address _tokenAuthority) {
        krnlAddress = _krnlAddress;
        kernelId = _kernelId;
        tokenAuthority = _tokenAuthority;
    }

    // Function to set mock prices for testing purposes
    function setMockPrice(bytes32 queryId, uint256 _price) public {
        prices[queryId] = _price;
        priceIsValid[queryId] = true;
        timestamps[queryId] = block.timestamp;
    }

    function addTokenPair(address _tokenAddress, string memory _fiatDenomination) public {
        tokenPairs.push(TokenPair(_tokenAddress, _fiatDenomination));
    }

    function requestPrice(address _tokenAddress, string memory _fiatDenomination) public {
        // Create a unique queryId
        bytes32 queryId = keccak256(abi.encodePacked(_tokenAddress, _fiatDenomination, block.timestamp));

        // Encode the input data according to the KRNL 341 documentation (in this case, token and denomination)
        bytes memory input = abi.encode(_tokenAddress, _fiatDenomination);

        // Call the KRNL contract
        IKernel341(krnlAddress).requestData(queryId, input);

        // Since this is a mock oracle, we *immediately* simulate the response.
        // In a real oracle, you'd wait for the oracle to call you back with the data.

        // For this example, we set a mock price based on the queryId
        setMockPrice(queryId, 100); // Set Mock Price

        emit eventPriceUpdated(_tokenAddress, _fiatDenomination, prices[queryId]);
    }

    function getPrice(address _tokenAddress, string memory _fiatDenomination) public view returns (uint256) {
        bytes32 queryId = keccak256(abi.encodePacked(_tokenAddress, _fiatDenomination, block.timestamp));
        return prices[queryId];
    }

    function comparePrices(address _tokenAddress, string memory _fiatDenomination) public view returns (uint256) {
        // Placeholder implementation
        bytes32 queryId = keccak256(abi.encodePacked(_tokenAddress, _fiatDenomination, block.timestamp));
        return prices[queryId];
    }

    function isValidPrice(address _tokenAddress, string memory _fiatDenomination) public view returns (bool) {
        bytes32 queryId = keccak256(abi.encodePacked(_tokenAddress, _fiatDenomination, block.timestamp));
        return priceIsValid[queryId];
    }

    // Setter functions for KRNL related parameters
    function setKRNLAddress(address _krnlAddress) public {
        krnlAddress = _krnlAddress;
    }
    function setKernelId(uint256 _kernelId) public {
        kernelId = _kernelId;
    }
    function setTokenAuthority(address _tokenAuthority) public {
        tokenAuthority = _tokenAuthority;
    }
}
