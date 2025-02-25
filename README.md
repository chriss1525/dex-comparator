# DEX Price Comparer with KRNL Protocol Integration

This project demonstrates the integration of KRNL Protocol for secure price data retrieval in a decentralized exchange (DEX) price comparison system.

## Project Overview

The project consists of three main smart contracts:

1. **KRNL.sol**: Base contract implementing KRNL Protocol's authorization logic
2. **dexComparator.sol**: Main contract handling price comparison functionality
3. **tokenAuthority.sol**: Manages signing and verification of kernel executions
4. ***Frontend***: React-based frontend for user interaction

### Smart Contract Architecture

- **KRNL Contract**: Implements payload verification and authorization checks
- **DEX Comparator**: Handles ETH/USD and BTC/USD price data retrieval through kernel execution
- **Token Authority**: Manages keypairs, whitelisting, and signing of kernel responses

### Deployments

- DEX Comparator: [Sepolia](https://sepolia.etherscan.io/address/0x5653CE584604792237420B9D9bfF3D2197Ec1fdc#code)
- Token Authority: [Oasis Sapphire Testnet](https://explorer.oasis.io/testnet/sapphire/address/0x0BF8100A95472583955285804761cCE56c7426Ce/code#code)
- KRNL Platform Registration: Smart Contract ID 4614
- DApp platform Registration: DApp ID 4394

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

The KRNL Protocol documentation has significantly improved, providing a solid foundation for:

- Smart contract deployment
- Kernel building
- Token authority setup

### Integration Experience

Initially, integrating the dApp presented some challenges. However, with continued development, really hands on developer support and an improved DApp integration documentation, the frontend is now successfully connected to the smart contracts, enabling the retrieval and display of price data.


#### Current Implementation Status

- Smart contracts successfully deployed and verified
- Token Authority operational on Oasis Sapphire
- KRNL Platform registration complete
- Frontend successfully connected to smart contracts and displaying data
- Mock oracle kernel price retrieval implemented

#### Development Focus

The current implementation prioritizes core functionality:

- Mock oracle kernel price retrieval
- Basic frontend structure
- Protected method interaction

The UI development is ongoing and will continue to be enhanced.

### Documentation Contribution

This project aims to document the integration process thoroughly to benefit future developers working with the KRNL Protocol. The detailed implementation steps and encountered challenges serve as practical reference points for the community.

## How to Interact

First make sure you have MetaMask installed in your browser.

### Frontend Setup

```bash
cd client/dex-price-comparer
pnpm install
pnpm dev
```

Environment Variables
```bash
NEXT_PUBLIC_ENTRY_ID=your_entry_id
NEXT_PUBLIC_KRNL_ACCESS_TOKEN=your_access_token
NEXT_PUBLIC_WALLET_ADDRESS=your_wallet_address
```

## Next Steps

- Write a price comparison kernel that expands the coin list
- Add additional DEX integrations
- Improve error handling and user feedback
- Enhance the UI with more visual elements and responsive design
