"use client";
import { ConnectButton } from "@/components/global/connect-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFunding } from "@/contexts/funding-context";
import {
	type TransactionStatuses,
	useHandleBuyFraction,
} from "@/hooks/use-buy-fraction";
import { useEthersProvider } from "@/hooks/use-ethers-provider";
import { useEthersSigner } from "@/hooks/use-ethers-signer";
import useSupportForm from "@/hooks/use-support-form";
import { cn } from "@/lib/utils";
import type { Report } from "@/types";
import { HypercertExchangeClient } from "@hypercerts-org/marketplace-sdk";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Loader2, Wallet2 } from "lucide-react";
import { sepolia } from "viem/chains";
import { useAccount, usePublicClient } from "wagmi";
import TransactionStatus from "./transaction-status";

interface SupportReportFormProps {
	drawerContainer: HTMLDivElement | null;
	hypercertId: Partial<Report>["hypercertId"];
}

const transactionStatusContent: Record<
	keyof typeof TransactionStatuses,
	{
		icon: JSX.Element;
		title: string;
		content: string;
		label: keyof typeof TransactionStatuses;
	}
> = {
	PreparingOrder: {
		label: "PreparingOrder",
		icon: <Loader2 size={36} />,
		title: "Preparing your order..",
		content: "We're preparing your order to be processed..",
	},
	SignForBuy: {
		label: "SignForBuy",
		icon: <Loader2 size={36} />,
		title: "Waiting for your signature..",
		content: "Please sign for your order to be processed..",
	},
	Approval: {
		label: "Approval",
		icon: <Loader2 size={36} />,
		title: "Waiting for your approval..",
		content:
			"We're asking for your permission to spend funds from your wallet..",
	},
	Pending: {
		label: "Pending",
		icon: <Loader2 size={36} />,
		title: "Processing..",
		content: "We're processing your transaction on-chain..",
	},
	Failed: {
		label: "Failed",
		icon: <AlertTriangle size={36} />,
		title: "Sorry! There was an issue.",
		content:
			"We ran into a problem while processing the transaction. Could you try again?",
	},
	Confirmed: {
		label: "Confirmed",
		icon: <CheckCircle size={36} />,
		title: "Thank you! We got your support.",
		content:
			"Your transaction was successful. We're grateful for your contribution!",
	},
};

async function getOrdersForReport(
	hypercertClient: HypercertExchangeClient | null,
	hypercertId: Partial<Report>["hypercertId"],
	chainId?: number,
) {
	if (!hypercertId) {
		console.warn("[Fetching orders] - No hypercert ID provided");
		return [];
	}
	if (!hypercertClient) {
		console.warn("[Fetching orders] - No hypercert client found");
		return [];
	}
	if (chainId === undefined) {
		console.warn("[Fetching orders] - No chainId provided");
		return [];
	}

	try {
		const { data: orders } = await hypercertClient.api.fetchOrdersByHypercertId(
			{
				hypercertId,
				chainId,
			},
		);
		return orders;
	} catch (error) {
		console.error("[Fetching orders] - Error fetching orders", error);
		return [];
	}
}

const SupportReportForm = ({
	drawerContainer,
	hypercertId,
}: SupportReportFormProps) => {
	const { address, isConnected, chainId } = useAccount();
	const provider = useEthersProvider({ chainId });
	const signer = useEthersSigner({ chainId });
	const publicClient = usePublicClient({ chainId });
	const { dollarAmountNeeded, pricePerUnit } = useFunding();

	const HCExchangeClient = new HypercertExchangeClient(
		chainId ?? sepolia.id,
		// @ts-ignore
		provider,
		signer,
	);

	const { handleBuyFraction, transactionStatus, transactionHash } =
		useHandleBuyFraction(publicClient, HCExchangeClient);

	const {
		isPending: isOrdersPending,
		error: orderError,
		data: orders,
	} = useQuery({
		queryKey: ["ordersFromHypercert"],
		queryFn: () =>
			getOrdersForReport(
				HCExchangeClient,
				// TODO: Replace with actual hypercert ID
				"0xa16dfb32eb140a6f3f2ac68f41dad8c7e83c4941-39472754562828861761751454462085112528896",
				// "0xa16dfb32eb140a6f3f2ac68f41dad8c7e83c4941-67375908650345815765748172271490105868288",
				chainId,
			),
	});

	const { form, onSubmit, isProcessing } = useSupportForm(
		Number(dollarAmountNeeded),
		pricePerUnit,
		orders?.[5],
		handleBuyFraction,
		address,
		hypercertId,
	);

	if (orderError || orders?.length === 0) {
		return (
			<div className="flex flex-col gap-4 p-3">
				<div className="flex flex-col gap-4 justify-center items-center">
					<h4 className="font-bold text-center">
						We could't find an order for this report. Please send the link to
						this report to the team!
					</h4>
				</div>
			</div>
		);
	}

	if (!isConnected && !address) {
		return (
			<div className="flex flex-col gap-4 p-3">
				<div className="flex flex-col gap-4 justify-center items-center">
					<h4 className="font-bold text-center">
						Connect your wallet to support this report
					</h4>
					<ConnectButton />
				</div>
			</div>
		);
	}

	return (
		<section>
			{!isProcessing && (
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-4"
					>
						<FormField
							control={form.control}
							name="fractionPayment"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Support amount</FormLabel>
									<div className="grid grid-cols-5 gap-4">
										{[5, 10, 20, 50, 100].map((amount) => (
											<Button
												key={amount}
												disabled={amount > Number(dollarAmountNeeded)}
												type="button"
												variant={
													form.watch("fractionPayment") === amount
														? "default"
														: "outline"
												}
												className={cn(
													"flex justify-center items-center h-10 rounded-lg font-bold transition-colors duration-200",
													form.watch("fractionPayment") === amount
														? "bg-vd-beige-600 text-white hover:bg-vd-beige-700"
														: "text-primary hover:bg-vd-beige-200 hover:text-primary",
													amount > Number(dollarAmountNeeded)
														? "cursor-not-allowed disabled:opacity-15"
														: "",
												)}
												onClick={() => form.setValue("fractionPayment", amount)}
											>
												${amount}
											</Button>
										))}
									</div>
									<FormControl>
										<Input
											type="number"
											placeholder="Enter amount"
											{...field}
											className="w-full px-4 py-2 border border-vd-blue-400 rounded-lg"
										/>
									</FormControl>
									<FormDescription>
										Donation amount in $USD | Max ${dollarAmountNeeded}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="comment"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Message (optional)</FormLabel>
									<FormControl>
										<Textarea
											rows={3}
											placeholder="Leave a message with your donation"
											{...field}
											className="w-full px-4 py-2 border rounded-lg resize-none"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* <FormField
							control={form.control}
							name="hideName"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between">
									<div className="space-y-0.5">
										<FormLabel>Hide my name from the donation</FormLabel>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/> */}
						{/* <FormField
							control={form.control}
							name="hideAmount"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between">
									<div className="space-y-0.5">
										<FormLabel>Hide the amount from the donation</FormLabel>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/> */}
						<Alert className="bg-vd-beige-100">
							<AlertTitle className="font-semibold">Please note</AlertTitle>
							<AlertDescription>
								You will need WETH on the Sepolia testnet.
							</AlertDescription>
							<AlertDescription className="flex gap-2 py-1">
								<p className="font-semibold">Links:</p>
								<a
									href="https://www.alchemy.com/faucets/ethereum-sepolia"
									target="_blank"
									rel="noreferrer"
									className="underline"
								>
									Sepolia Faucet
								</a>
								<p className="text-stone-400">|</p>
								<a
									href="https://weth.altlayer.io/transfer"
									target="_blank"
									rel="noreferrer"
									className="underline"
								>
									ETH to WETH
								</a>
							</AlertDescription>
							<div className="p-2" />
							<Button className="w-full py-6 flex gap-2" type="submit">
								<Wallet2 />
								Send from wallet
							</Button>
						</Alert>
					</form>
				</Form>
			)}
			{isProcessing && (
				<TransactionStatus
					statusContent={transactionStatusContent[transactionStatus]}
					transactionHash={transactionHash}
				/>
			)}
		</section>
	);
};

export default SupportReportForm;
