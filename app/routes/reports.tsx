import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { ClientLoaderFunction, Link, useLoaderData } from "@remix-run/react";
import { useMemo } from "react";
import ReportCard from "~/components/reports/report-card";
import ReportsHeader from "~/components/reports/reports-header";
import VoicedeckStats from "~/components/reports/voicedeck-stats";
import { siteConfig } from "~/config/site";
import { getNumberOfContributors } from "~/directus.server";
import { Report } from "~/types";
import { fetchReports } from "../impact-reports.server";


import {
	BaseError,
	useAccount,
	useAccountEffect,
	useBalance,
	useBlockNumber,
	useChainId,
	useConnect,
	useConnections,
	useConnectorClient,
	useDisconnect,
	useEnsName,
	useReadContract,
	useReadContracts,
	useSendTransaction,
	useSignMessage,
	useSwitchAccount,
	useSwitchChain,
	useWaitForTransactionReceipt,
	useWriteContract,
  } from 'wagmi'
  import { sepolia } from 'wagmi/chains'

export const meta: MetaFunction = () => {
	return [
		{ title: "VoiceDeck" },
		{ name: "description", content: "Welcome to VoiceDeck!" },
	];
};

export const loader: LoaderFunction = async () => {
	return null;
};


function BlockNumber() {
	const { data: default_ } = useBlockNumber({ watch: true })
	const { data: account_ } = useBlockNumber({
	  watch: true,
	})
	const { data: sepolia_ } = useBlockNumber({
	  chainId: sepolia.id,
	  watch: true,
	})

	return (
	  <div>
		<h2>Block Number</h2>

		<div>Block Number (Default Chain): {default_?.toString()}</div>
		<div>Block Number (Account Chain): {account_?.toString()}</div>
		<div>Block Number (Sepolia): {sepolia_?.toString()}</div>
	  </div>
	)
  }



import { HypercertExchangeClient } from "@hypercerts-org/marketplace-sdk";
import { ethers } from "ethers";


async function getOrder() {

  // 0x42FbF4d890B4EFA0FB0b56a9Cc2c5EB0e07C1536

    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia.publicnode.com");
    const signer = new ethers.Wallet("privatekey", provider);

    //0x42FbF4d890B4EFA0FB0b56a9Cc2c5EB0e07C1536
    console.log(`seller address : ${await signer.getAddress()}`);

    const hypercertExchangeClient = new HypercertExchangeClient(
        sepolia.id,
        provider,
        signer
      );

    const response =
    await hypercertExchangeClient.api.fetchOrdersByHypercertId({
      hypercertId: "0xa16dfb32eb140a6f3f2ac68f41dad8c7e83c4941-39472754562828861761751454462085112528896",
      chainId: sepolia.id,
    });

    console.log(`response: ${JSON.stringify(response, null, 2)}`);
    if (response.data) {
      return response.data[3];
  } else {
      // Handle the case where response.data is null
      console.error('response.data is null');
      throw new Error('response.data is null');
  }
}

// async function composeOrder(hcid: string, address: string, amount: number) {
  async function preprocess() {
  const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia.publicnode.com");
  const signer = new ethers.Wallet("<your-privatekey>", provider);

  const hypercertExchangeClient = new HypercertExchangeClient(
      sepolia.id,
      provider,
      signer
    );

  //
  const order = await getOrder();

  const address = "0x8B014474b731BdCdF42ED35719FA37A638B33d97";
  const unitAmount = 2;
  const pricePerUnit = order.price;


  const takerOrder = hypercertExchangeClient.createFractionalSaleTakerBid(
    order,
    address,
    unitAmount,
    pricePerUnit
  );

  const { call } = hypercertExchangeClient.executeOrder(
    order,
    takerOrder,
    order.signature
  );

  return call;
}

function Buy() {

  let hash;
  async function submit() {



    const call = await preprocess();

    hash = await call();
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  return (
    <div>
		<br/>
		<br/>
		<br/>
      <h2>Buy Hypercert</h2>
        <button onSubmit={submit}  type="submit">
          {'[[[Click me to support buy fraction!]]]'}
        </button>
      {hash && <div>Transaction Hash: {hash}</div>}
      {isConfirming && 'Waiting for confirmation...'}
      {isConfirmed && 'Transaction confirmed.'}

    </div>
  )
}

function Connect() {
	const chainId = useChainId()
	const { connectors, connect, status, error } = useConnect()

	return (
	  <div>
		<h2>Connect</h2>
		{connectors.map((connector) => (
		  <button
			key={connector.uid}
			onClick={() => connect({ connector, chainId })}
			type="button"
		  >
			{connector.name+" here"}
		  </button>
		))}
		<div>{status}</div>
		<div>{error?.message}</div>
	  </div>
	)
  }

export default function Reports() {
	return (
		<div>
		<Connect />
		<BlockNumber/>
		{/* <Buy/> */}
		</div>
	);
}
