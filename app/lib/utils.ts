import { HypercertExchangeClient, Taker } from "@hypercerts-org/marketplace-sdk";
import { type ClassValue, clsx } from "clsx";
import { ContractMethod, ContractTransactionResponse, Overrides, ethers } from "ethers";
import { twMerge } from "tailwind-merge";
import { Address, createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { fetchReportBySlug } from "~/impact-reports.server";
import { Order } from "~/types";


export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(d: Date) {
	const date = new Date(d);
	return date
		.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short", // "Oct"
			day: "numeric",
		})
		.toUpperCase();
}

export const formatCurrency = (value: number, currencyCode = "USD") => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currencyCode,
		minimumFractionDigits: 2,
	}).format(value);
};


// Impact Report Support Execution Example


// note:
//  * amount should come from the user input
//  * buyerAddress should come from the user's wallet
export const orderExample = async () => {
	const report = await fetchReportBySlug("example-slug");
	const buyerAddress = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
	// 100 USD
	const amount = 100;

	if (report.order) {
	const call = createTakerOrder(report.order, buyerAddress, amount);

	// frontend should ask user to sign the transaction
	// after the user signs the transaction, tx will be sent to the blockchain
	const tx = await call();

	await client.waitForTransactionReceipt({
		hash: tx.hash as `0x${string}`,
	  });
	}		
}

//
// Main Functions
//
export const createTakerOrder = (makerOrder: Order, takerAddress: Address, amount: number): any => {
	const hypercertExchangeClient = getHypercertExchangeClient();

  	const pricePerUnit = makerOrder.price;
  
    // Create taker bid
  const takerOrder = hypercertExchangeClient.createFractionalSaleTakerBid(
    makerOrder,
    takerAddress,
    amount,
    pricePerUnit
  );

  takerOrder.additionalParameters

  const call = prepareOrderExecution(makerOrder, takerOrder);

 
  return call;
}

export const prepareOrderExecution = (makerOrder: Order, takerOrder: Taker): any => {
	
	// real signer from user wallet should be used here
	const hypercertExchangeClient = getHypercertExchangeClient();

	const { call } = hypercertExchangeClient.executeOrder(
		makerOrder,
		takerOrder,
		makerOrder.signature
	);

	return call;
}


// 
// auxiliary functions and variables
//
const client = createPublicClient({ 
	chain: sepolia, 
	transport: http(), 
  }) 

  let hypercertExchangeClient: HypercertExchangeClient | null = null;


interface ProviderAndSigner {
	provider: ethers.Provider;
	signer: ethers.Signer;

}

interface getProviderAndSignerFunc {
	(): ProviderAndSigner;
}

const getProviderAndSignerExample: getProviderAndSignerFunc = () => {
	const provider = new ethers.JsonRpcProvider(
		"https://ethereum-sepolia.publicnode.com",
	);
	const signer = new ethers.Wallet(
		"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		provider,
	);
	return { provider, signer };
}




/**
 * Retrieves the singleton instance of the getHypercertExchangeClient.
 */
export const getHypercertExchangeClient = (): HypercertExchangeClient => {
	if (hypercertExchangeClient) {
		return hypercertExchangeClient;
	}

	hypercertExchangeClient = new HypercertExchangeClient(
		sepolia.id,
		getProviderAndSignerExample().provider,
		getProviderAndSignerExample().signer,
	);

	return hypercertExchangeClient;
};
