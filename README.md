# DEX Price Compararer with KRNL Protocol Integration

This project demonstrates the integration of KRNL Protocol for secure price data retrieval in a decentralized exchange (DEX) price comparison system.

## Project Overview

The project consists of three main smart contracts:

1. **KRNL.sol**: Base contract implementing KRNL Protocol's authorization logic
2. **dexComparator.sol**: Main contract handling price comparison functionality
3. **tokenAuthority.sol**: Manages signing and verification of kernel executions

### Smart Contract Architecture

- **KRNL Contract**: Implements payload verification and authorization checks
- **DEX Comparator**: Handles ETH/USD and BTC/USD price data retrieval through kernel execution
- **Token Authority**: Manages keypairs, whitelisting, and signing of kernel responses

### Deployments

- DEX Comparator: [Sepolia](https://sepolia.etherscan.io/address/0xdD870eB3378cfae3E7beE375279aB22cf5712401#code)
- Token Authority: [Oasis Sapphire Testnet](https://explorer.oasis.io/testnet/sapphire/address/0x4c9AD908A26a9c560cc7c341f1f971A4Be10DAC8/code#code)
- KRNL Platform Registration: Smart Contract ID 3581

## KRNL Protocol Integration

### Key Components

1. Token Authority Setup:

- Generates signing keypairs
- Manages whitelisting of kernel nodes
- Validates kernel executions

2. Smart Contract Protection:

- Implements onlyAuthorized modifier
- Verifies kernel responses
- Handles payload validation

## dApp Integration

The frontend integration is built with Next.js and demonstrates the kernel execution flow:

1. Receive platform credentials:

- Entry ID
- Access Token
- Kernel Payload Structure

2. Execute kernels through KRNL SDK:

```typescript
const executionResult = await provider.executeKernels(
  entryId,
  accessToken,
  {
    senderAddress: walletAddress,
    kernelPayload: {
      "341": {
        functionParams: abiEncodedString,
      },
    },
  },
  abiEncodedString
);
```

3. Use Kernel Response to query smart contract Methods

```typescript
const krnlPayload = {
    auth: executionResult.auth,
    kernelResponses: executionResult.kernel_responses,
    kernelParams: executionResult.kernel_params,
};


let tx: any;

const updateSavedRate = contract.getFunction("updateSavedRate");

console.log(await contract.getAddress());

if (updateSavedRate) {
    tx = await updateSavedRate(krnlPayload, TokenMapping.BTC);
    }
```

## Development Journey & Challenges

### Documentation Insights
The documentation provides strong foundational guidance for:
- Smart contract deployment
- Kernel building
- Token authority setup

### Integration Challenges
While building the dApp integration, several areas emerged that would benefit from expanded documentation:

#### Technical Documentation Needs
- Specific RPC URL configuration guidance
- Contract configuration steps post-signer/provider setup
- Practical examples of function call data encoding
- Common error resolution patterns for protected method interactions

#### Current Implementation Status
- Smart contracts successfully deployed and verified
- Token Authority operational on Oasis Sapphire
- KRNL Platform registration complete (ID: 3581)
- Frontend shell implemented for initial testing
- Blocked at protected method calls due to signature verification issues

#### Development Focus
The current implementation prioritizes core functionality verification:
- Mock oracle kernel price retrieval testing
- Basic frontend structure
- Protected method interaction testing

The UI development is intentionally minimal until core kernel interactions are validated. This approach allows for focused debugging and ensures foundational protocol integration works before expanding the user interface.

### Documentation Contribution
This project aims to document the integration process thoroughly to benefit future developers working with the KRNL Protocol. The detailed implementation steps and encountered challenges serve as practical reference points for the community.

## How to Interact
 First make sure you have metamask installed in your browser.

### Frontend Setup

cd client/dex-price-comparer
npm install
npm run dev


Environment Variables
NEXT_PUBLIC_ENTRY_ID=your_entry_id
NEXT_PUBLIC_KRNL_ACCESS_TOKEN=your_access_token
NEXT_PUBLIC_WALLET_ADDRESS=your_wallet_address


## Next Steps

- Resolve signature verification issues
- Write a price comparisson kernel that expands the coin list
- Add additional DEX integrations
- Improve error handling and user feedback
