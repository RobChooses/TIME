# TIMe: Today in Memes

Project submission for the EthGlobal Agent Hackathon 2025

## Overview

TIMe is a news aggregation site that uses an automonous AI agent to scan the web for the latest news every hour. It finds the most interesting news article that could create a funny, viral meme and passes this to dall-e 3 to generate an image. This is then deployed as a meme NFT on Base Sepolia testnet, allowing users to mint them.

## Tech Stack

It uses the following tech stack:

- Coinbase CDP and AgentKit for the agent wallet
- Dall-e 3 for the meme NFT images
- Tavily for the news aggregation
- NFTs are deployed on Base Sepolia testnet


## How to run

1. Clone the repository
2. Install the dependencies
3. Run the agent

```bash
cd agent
npm install
npm start
```
