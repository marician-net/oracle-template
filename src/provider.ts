import { requestPromise, ZapQueryEvent, ZapResponder } from "./utils";

const HDWalletProviderMem = require("truffle-hdwallet-provider");

/* Sample HTTP data provider */
const CMC_URL: string = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=ZAP&convert=";
/* CoinMarketCap API Key (test use only) */
const CMC_KEY: string = "&CMC_PRO_API_KEY=1b1593df-f732-4a58-8b84-dbc3bd896741";

/* Put your mnemonic here */
const mnemonic: string = "rally later assist feature wait primary addict sister remove language piece drink";

/* Uses the CoinMarketCap API to get the current exchange ratio of ZAP to another base currency */
async function getZapPrice(base:string): Promise<number>{
	try {
		const body: any = await requestPromise(CMC_URL + base + CMC_KEY);
		const json: any = JSON.parse(body);
		return json.data["ZAP"].quote[base].price;
	}
	catch (err) {
		return 0;
	}
}

async function priceResponder(web3: any, event: ZapQueryEvent): Promise<string[]> {
	const { queryId,
			query,
			endpoint,
			subscriber,
			endpointParams,
			onchainSub } = event;

	console.log(`Received query to ${endpoint} from ${onchainSub ? 'contract' : 'person'} at address ${subscriber}`);
	console.log(`Query ${queryId.substring(0, 8)}...: "${query}". Parameters: ${endpointParams}`);

	const zapPer: number = await getZapPrice(query);	
	const perZap = web3.utils.toWei((1 / zapPer).toString());

	console.log(`Ratio of ZAP/${query}: ${zapPer}`);
	console.log(`1 ${query} = ${perZap} Wei ZAP`);

	return [web3.utils.padLeft(web3.utils.toHex(perZap), 64)];
}

export const Responders: ZapResponder = {
	"zapprice": {
		responder: priceResponder,
		curve: [3, 0, 0, 2, 1000]
	}
};

export const ProviderData: any = {
	title: "Template-Oracle",
	public_key: "abcdef",
	endpoint: "no-op",
	endpoint_params: []
};

export async function getWeb3Provider() {	
	const INFURA_WS = "wss://kovan.infura.io/ws/xeb916AFjrcttuQlezyq";
	return new HDWalletProviderMem(mnemonic, INFURA_WS);
}