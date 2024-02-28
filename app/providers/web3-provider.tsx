import { createWeb3Modal } from "@web3modal/wagmi/react";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { http, WagmiProvider, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { metaMask } from 'wagmi/connectors'

declare module "wagmi" {
	interface Register {
		config: typeof config;
	}
}


// 1. Get projectId at https://cloud.walletconnect.com
const projectId = "id";

// 2. Create wagmiConfig
const metadata = {
	name: "VoiceDeck",
	description: "VoiceDeck Description",
	url: "https://voicedeck.org/", // origin must match your domain & subdomain
	icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// const chains = [sepolia] as const;

const config = createConfig({
	chains: [sepolia],
	connectors: [metaMask()],
	transports: {
	  [sepolia.id]: http(),

	},
  })


// 3. Create modal
createWeb3Modal({
	wagmiConfig: config,
	projectId,
});

const Web3Provider = ({ children }: { children: React.ReactNode }) => {
	return <WagmiProvider config={config}>{children}</WagmiProvider>;
};

export default Web3Provider;
