//import { loadProvider, createProvider, createProviderCurve, getEndpointInfo, doBondage, doUnbondage } from "./provider";
const Web3 = require('web3');

import { ZapProvider } from "@zapjs/provider";
import { getWeb3Provider, Responders, ProviderData } from "./provider";
import { parseEvent, initProvider, ZapQueryEvent, ZapResponder } from "./utils";

/**
 * Handles a query
 * @param writer - HTTP Web3 instance to respond to query with
 * @param queryEvent - Web3 incoming query event
 * @returns ZapProvider instantiated
 */
export async function handleQuery(provider: ZapProvider, queryEvent: any): Promise<void> {
	const web3 = provider.zapBondage.web3;

	// Parse the event into usable variables
	const event: ZapQueryEvent = parseEvent(web3, queryEvent.returnValues);

	if ( !(event.endpoint in Responders) ) {
		console.log('Unable to find the responder for', event.endpoint);
		return;
	}

	// Call the callback
	const response: string[] = await Responders[event.endpoint].responder(web3, event);

	// Send the response
	provider.respond({
		queryId: event.queryId,
		responseParams: response,
		dynamic: true
	}).then((txid: any) => { 
		console.log('Responsed to', event.subscriber, "in transaction", txid.transactionHash);
	});
}

async function main() {
	const web3: any = new Web3(await getWeb3Provider());

	// Get the provider and contracts
	const provider = await initProvider(web3);

	const title = await provider.getTitle();

	if ( title.length == 0 ) {
		console.log("Initializing provider");
		
		await provider.initiateProvider(ProviderData);
		
		for ( const responder in Responders ) {
		 	await provider.initiateProviderCurve({
		 		endpoint: responder,
		 		term: Responders[responder].curve,
		 		from: provider.providerOwner
		 	});
		}
	}
	else {
		console.log("Oracle already exists. Listening for queries");
		
		provider.listenQueries({}, (err: any, event: any) => { 
			if ( err ) {
				throw err;
			}

			handleQuery(provider, event);
		});
	}
}

main().catch(err => console.error('zap-oracle-template error:', err));