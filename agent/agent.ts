import {
  AgentKit,
  CdpWalletProvider,
  walletActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  erc20ActionProvider,
  erc721ActionProvider
} from "@coinbase/agentkit";
  
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as readline from "readline";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { DallEAPIWrapper } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import path from 'path';
import { parseJSON } from './utils';

dotenv.config();

/**
 * Validates that required environment variables are set
 *
 * @throws {Error} - If required environment variables are missing
 * @returns {void}
 */
function validateEnvironment(): void {
  const missingVars: string[] = [];

  // Check required variables
  const requiredVars = [
    "OPENAI_API_KEY", 
    "CDP_API_KEY_NAME", 
    "CDP_API_KEY_PRIVATE_KEY",
    "TAVILY_API_KEY"
  ];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach(varName => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }

  // Warn about optional NETWORK_ID
  if (!process.env.NETWORK_ID) {
    console.warn("Warning: NETWORK_ID not set, defaulting to base-sepolia testnet");
  }

  // Warn about optional AGENT_INTERVAL_SECONDS
  if (!process.env.AGENT_INTERVAL_SECONDS) {
    console.warn("Warning: AGENT_INTERVAL_SECONDS not set, defaulting to 3600 seconds (1 hour)");
  }
}
  
// Add this right after imports and before any other code
validateEnvironment();
  
// Configure a file to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = "wallet_data.txt";

// Add this type for our filtered headlines
interface NewsHeadline {
  title: string;
  category: "crypto" | "technology" | "AI" | "sports" | "celebrity" | "politics";
  sourceUrl: string;
  content:string;
  memeHeadline: string;
}

// Add these interfaces after existing interfaces
interface MemeGeneration {
  headline: NewsHeadline;
  imageUrl: string;
}

/**
 * Initialize the agent with CDP Agentkit
 *
 * @returns Agent executor and config
 */
async function initializeAgent() {
  try {
    // Initialize LLM
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

    let walletDataStr: string | null = null;

    // Read existing wallet data if available
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      } catch (error) {
        console.error("Error reading wallet data:", error);
        // Continue without wallet data
      }
    }

    // Configure CDP Wallet Provider
    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);

    // Initialize AgentKit
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        walletActionProvider(),
        erc20ActionProvider(),
        erc721ActionProvider(),
        cdpApiActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
        cdpWalletActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      ],
    });

    const tavilySearch = new TavilySearchResults({
      topic: "news",
      maxResults: 10,
      searchDepth: "deep",
      includeAnswer: true,
      includeRawContent: true,
      includeImages: true,
      apiKey: process.env.TAVILY_API_KEY
    });


    const tools = await getLangChainTools(agentkit);
    tools.push(tavilySearch);

    // Store buffered conversation history in memory
    const memory = new MemorySaver();
    const agentConfig = { configurable: { thread_id: "CDP AgentKit Chatbot Example!" } };

    // Create React Agent using the LLM and CDP AgentKit tools
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        You are an agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
        empowered to interact onchain using your tools. Be concise and helpful with your responses. Refrain from 
        restating your tools' descriptions unless it is explicitly requested. Do not send transactions, send NFTs or ETH
        unless explicitly requested. Show balance and wallet address before any other action.`
    });

    // Save wallet data
    const exportedWallet = await walletProvider.exportWallet();
    
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error; // Re-throw to be handled by caller
  }
}

// Add new function to generate meme image
async function generateMemeImage(headline: NewsHeadline): Promise<MemeGeneration | null> {
  const tool = new DallEAPIWrapper({
    n: 1,
    modelName: "dall-e-3",
    openAIApiKey: process.env.OPENAI_API_KEY, 
    size: "1792x1024"
  });

  // Create a meme-style prompt from the headline
  const imagePrompt = PromptTemplate.fromTemplate(`
    Create a funny meme-style image for this headline: . 
    Context: ${headline.content}
    Style: Modern meme aesthetic, bold and engaging, suitable for social media, 
    high contrast, with room for text overlay. Make it humorous but appropriate.:

    ### Dall-E Prompt Template

    **Title of the Blog Post**: "${headline.title}"

    **Preferred Color Scheme and Art Style**: Photo realistic, modern, meme-style 

    Do not add any text to the image.

    `);

  try {
    console.log('!!!! Preparing meme prompt with headline:', headline);
    const memePrompt = await imagePrompt.format({ headline });
    const response = await tool.invoke(memePrompt);

    console.log('**** response ****', response);

    return {
      headline,
      imageUrl: response
    };
  } catch (error) {
    console.error("Error generating meme image:", error);
    console.log("Skipping this headline due to image generation failure");
    return null;  // Return null instead of throwing
  }
}

// Add function to process headlines and generate memes
async function processHeadlinesAndGenerateMemes(agentResponse: string): Promise<MemeGeneration[]> {
  try {
    const headlines = parseJSON(agentResponse) as NewsHeadline[];
    
    if (!Array.isArray(headlines)) {
      throw new Error("Invalid headlines format");
    }

    // Generate memes and filter out null results
    const memePromises = headlines.map(headline => generateMemeImage(headline));
    const results = await Promise.all(memePromises);
    return results.filter((result): result is MemeGeneration => result !== null);
  } catch (error) {
    console.error("Error processing headlines:", error);
    return []; // Return empty array instead of throwing
  }
}

async function deployNFTForMeme(agent: any, config: any, meme: MemeGeneration): Promise<void> {
  try {
    const deployPrompt = `
      Create a unique NFT symbol from the headline.

      Deploy a new NFT contract with the following details and return the NFT contract address. If it already exists, return the existing NFT contract address not wallet address.
      - Contract Name: ${meme.headline.title}
      - Contract Symbol: <contractSymbol>
      - Token URI: ${meme.imageUrl}

      After deploying the NFT, mint one NFTs to the wallet address.
    `;

    const stream = await agent.stream({ messages: [new HumanMessage(deployPrompt)] }, config);
    
    console.log(`\nDeploying NFT for meme: ${meme.headline.memeHeadline}`);
    for await (const chunk of stream) {
      if ("agent" in chunk) {
        console.log(chunk.agent.messages[0].content);
      } else if ("tools" in chunk) {
        console.log(chunk.tools.messages[0].content);
      }
      console.log("-------------------");
    }
  } catch (error) {
    console.error("Error deploying NFT:", error);
  }
}

/**
 * Run the agent autonomously with specified intervals
 */
async function runAutonomousMode(agent: any, config: any) {
  const intervalSeconds = parseInt(process.env.AGENT_INTERVAL_SECONDS || "3600", 10);
  console.log(`Starting autonomous mode... (Running every ${intervalSeconds} seconds)`);
  
  while (true) {
    try {
      const thought =
        `
        Important, first tell me your wallet address and balance, and retrieve an amount form faucet'
        Search for today's news headlines that would make good memes. Focus on crypto, technology, AI, 
        sports, celebrity, and politics news that are funny or noteworthy. Avoid tragic, war, sexist, racist, terrorism, violent acts, sensitive topics and importantly specific individuals and names.
        Articles must be from the past 24 hours.

        Only response in JSON with these properties and ensure that the values can be safely parsed later.

        ALso remove any text that could fail an image generation safety guard such as a person's name or company name.
        {"title": <The headline text>, 
         "category": <"crypto"|"technology"|"AI"|"sports"|"celebrity"|"politics">,
        "sourceUrl": <The URL of the article>,
        "content": <brief summary of the article>
        "memeHeadline": <a funny, meme-style headline that could be used for a meme image>}

        Return 3-5 headlines in this format.`;

      const stream = await agent.stream({ messages: [new HumanMessage(thought)] }, config);
      let agentResponse = '';

      // Collect the full response
      for await (const chunk of stream) {
        if ("agent" in chunk) {
          agentResponse += chunk.agent.messages[0].content;
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }

      // Process headlines and generate memes
      console.log("Generating memes from headlines...");
      const memes = await processHeadlinesAndGenerateMemes(agentResponse);
      
      // Log generated memes
      memes.forEach((meme, index) => {
        console.log(`\nMeme ${index + 1}:`);
        console.log(`Title: ${meme.headline.title}`);
        console.log(`Category: ${meme.headline.category}`);
        console.log(`Image URL: ${meme.imageUrl}`);
        console.log(`Meme Headline: ${meme.headline.memeHeadline}`);
      });

      // Deploy NFTs using the agent
      console.log("Deploying NFTs for memes...");
      for (const meme of memes) {
        await deployNFTForMeme(agent, config, meme);
      }

      // Wait for next interval
      await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      process.exit(1);
    }
  }
}

/**
 * Run the agent interactively based on user input
 */
async function runChatMode(agent: any, config: any) {
  console.log("Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  try {
    while (true) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      const stream = await agent.stream({ messages: [new HumanMessage(userInput)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    const { agent, config } = await initializeAgent();
    await runAutonomousMode(agent, config);

  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

// Start the agent when running directly
if (require.main === module) {
  console.log("Starting Agent...");
  main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
