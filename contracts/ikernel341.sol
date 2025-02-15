// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IKernel341 {
    /**
     * @notice Requests data from the oracle.
     * @param queryId A unique identifier for the request.
     * @param input The input data for the oracle. This is specific to the oracle and its expected format.
     */
    function requestData(bytes32 queryId, bytes calldata input) external;
}
