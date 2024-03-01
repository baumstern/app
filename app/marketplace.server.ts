import { HypercertExchangeClient } from "@hypercerts-org/marketplace-sdk";
import { ethers } from "ethers";
import { sepolia } from "viem/chains";

import { Order, Report } from "./types";

let orders: (Order | null)[] | null = null;

let hypercertExchangeClient: HypercertExchangeClient | null = null;

const provider = new ethers.JsonRpcProvider(
	process.env.ETHEREUM_RPC_URL as string,
);

// here we use placeholder private key for the signer because we are not actually signing any transactions
const signer = new ethers.Wallet(
	"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	provider,
);

/**
 * Fetches the order corresponding to the given hypercert ID.
 * @param hypercertId The hypercert ID.
 * @returns A promise that resolves to the order.
 */
export async function fetchOrder(hypercertId: string): Promise<Order | null> {
	const hypercertExchangeClient = getHypercertExchangeClient();

	const response = await hypercertExchangeClient.api.fetchOrdersByHypercertId({
		hypercertId: hypercertId,
		chainId: sepolia.id,
	});

	if (response.data && response.data.length > 0) {
		if (response.data.length > 1) {
			console.warn(
				`[server] ${response.data.length} orders found for hypercert ${hypercertId}`,
			);
		}
		// Assuming there is only one item per order for the VoiceDeck use case
		return { hypercertId, ...response.data[0] } as Order;
	}
	return null;
}

/**
 * Fetches all orders of impact reports from the Hypercerts marketplace.
 * @param reports The impact reports.
 * @returns A promise that resolves to an array of orders.
 */
export async function getOrders(reports: Report[]): Promise<(Order | null)[]> {
	try {
		if (orders) {
			console.log(
				"[server] Hypercert orders already exist, no need to fetch from remote",
			);
			console.log(`[server] Existing Hypercert orders: ${orders.length}`);
		} else {
			// fetch only orders for reports that are not fully funded
			orders = await Promise.all(
				reports.map((report) =>
					report.fundedSoFar < report.totalCost
						? fetchOrder(report.hypercertId)
						: null,
				),
			);
			console.log(`[server] total orders: ${orders.length}`);
			console.log(`[server] orders: ${JSON.stringify(orders, null, 2)}`);
		}
		return orders;
	} catch (error) {
		console.error(`[server] Failed to fetch orders: ${error}`);
		throw new Error(`[server] Failed to fetch orders: ${error}`);
	}
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
		provider,
		signer,
	);

	return hypercertExchangeClient;
};
