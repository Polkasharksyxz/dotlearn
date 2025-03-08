import process from "node:process";
import { getWsProvider } from "polkadot-api/ws-provider/web";


// import { createClient, type PolkadotClient } from "polkadot-api"; //original
// TODO: Import `dot` from `"@polkadot-api/descriptors"`.
// TODO: Import the type `SS58String` from `"polkadot-api"`.

import {
  createClient,
  type PolkadotClient,
  type SS58String,
} from "polkadot-api";

// TODO: Import `people` from `"@polkadot-api/descriptors"`;
import { dot, people, collectives } from "@polkadot-api/descriptors";

function makeClient(endpoint: string): PolkadotClient {
  console.log(`Connecting to endpoint: ${endpoint}`);
  const provider = getWsProvider(endpoint);
  const client = createClient(provider);
  return client;
}

// TODO:
// - Create a new `async` function` named `printChainInfo`.
//   - It should accept a parameter `client` of type `PolkadotClient`.
// - Write the logic for `printChainInfo`.
//   - Call the `getChainSpecData` method, which is exposed on `client`. **IMPORTANT NOTE:** This method is used in this tutorial, but it should not be used in production apps.
//   - `await` the result, and assign the output to a new constant `chainSpec`.
//   - Call the `getFinalizedBlock` method, which is exposed on `client`.
//   - `await` the result, and assign the output to a new constant `finalizedBlock`.
//   - Print `chainSpec.name` and `finalizedBlock.number` with a friendly message.

async function printChainInfo(client: PolkadotClient) {
  
  const chainSpec = await client.getChainSpecData();
  const finalizedBlock = await client.getFinalizedBlock();
  console.log(
    `Connected to ${chainSpec.name} at block ${finalizedBlock.number}.\n`
  );
}
// / TODO:
// - Create a new `async` function called `getBalance`:
//   - It accepts two parameters:
//     - A parameter named `polkadotClient` which is of type `PolkadotClient`.
//     - A parameter named `address` which is of type `SS58String` which we imported above.
//   - It returns a `Promise<BigInt>`.
// - Write the logic of the `getBalance` function:
//   - Call the `getTypedApi` method on the `polkadotClient` variable.
//     - The `getTypedApi` method should include the parameter `dot`, which we imported above.
//     - Assign the result to a new constant `dotApi`.
//   - Call `dotApi.query.System.Account.getValue(address)`.
//   - `await` the result, and assign it to a new constant `accountInfo`.
//   - Extract the `free` and `reserved` balance from `accountInfo.data`.
//   - Return the sum of `free` and `reserved`.
async function getBalance(
  polkadotClient: PolkadotClient,
  address: SS58String
): Promise<BigInt> {
  const dotApi = polkadotClient.getTypedApi(dot);
  const accountInfo = await dotApi.query.System.Account.getValue(address);
  const { free, reserved } = accountInfo.data;
  return free + reserved;
}
// TODO:
// - Create a new `async` function called `getDisplayName`:
//   - It accepts two parameters:
//     - `peopleClient` which is of type `PolkadotClient`.
//     - `address` which is of type `SS58String`.
//   - It returns a `Promise<string | undefined>`.
// - Write the logic of the `getDisplayName` function:
//   - Call the `getTypedApi` method on the `peopleClient` variable.
//     - The `getTypedApi` method should include the parameter `people`, which we imported above.
//     - Assign the result to a new constant `peopleApi`.
//   - Call `peopleApi.query.Identity.IdentityOf.getValue(address)`.
//   - `await` the result, and assign it to a new constant `accountInfo`.
//   - Extract the display name with: `accountInfo?.[0].info.display.value?.asText()`
//     - Assign the result to a new constant `displayName`.
//   - Return the `displayName` constant.
async function getDisplayName(
  peopleClient: PolkadotClient,
  address: SS58String
): Promise<string | undefined> {
  const peopleApi = peopleClient.getTypedApi(people);
  const accountInfo = await peopleApi.query.Identity.IdentityOf.getValue(
    address
  );
  const displayName = accountInfo?.[0].info.display.value?.asText();
  return displayName;
}

// TODO:
// - Create a new type safe `interface` called `FellowshipMember`.
//   - It has two fields:
//     - `address` which is of type `SS58String`.
//     - `rank` which is of type `number`.
interface FellowshipMember {
  address: SS58String;
  rank: number;
}

// TODO:
// - Create a new `async` function `getFellowshipMembers`:
//   - It has a single parameter `collectivesClient` of type `PolkadotClient`.
//   - It returns an array of fellowship members: `Promise<FellowshipMember[]>`.
// - Write the logic of the `getFellowshipMembers` function:
//   - Call the `getTypedApi` method on the `collectivesClient` variable.
//     - The `getTypedApi` method should include the parameter `collectives`, which we imported above.
//     - Assign the result to a new constant `collectivesApi`.
//   - Call `collectivesApi.query.FellowshipCollective.Members.getEntries()`.
//   - `await` the result, and assign it to a new constant `rawMembers`.
//   - Extract the `address` and `rank` from `rawMembers`:
//     - `map` the items of `rawMembers` to access the individual members `m`.
//     - You can access the `address` of the member by calling `m.keyArgs[0]`.
//     - You can access the `rank` of the member by calling `m.value`.
//     - Assign the mapped data to a new constant `fellowshipMembers`.
//       - Make sure the data is in the structure of `FellowshipMember`.
//   - Return the `fellowshipMembers` constant.
async function getFellowshipMembers(
  collectivesClient: PolkadotClient
): Promise<FellowshipMember[]> {
  const collectivesApi = collectivesClient.getTypedApi(collectives);
  const rawMembers =
    await collectivesApi.query.FellowshipCollective.Members.getEntries();
  const data = rawMembers.map((m) => {
    return { address: m.keyArgs[0], rank: m.value };
  });
  return data;
}
// TODO: Create a new `async` function named `main` with the following logic:
//   - Call `makeClient` with endpoint `"wss://rpc.polkadot.io"`.
//   - Assign the result to a new constant named `polkadotClient`.
//   - Use `console.log({ polkadotClient });` to take a peek at the methods exposed by the client.

// TODO: Call the `main` function so it runs when executing this file.
async function main() {
  const polkadotClient = makeClient("wss://rpc.polkadot.io");
  await printChainInfo(polkadotClient);

  const peopleClient = makeClient("wss://polkadot-people-rpc.polkadot.io");
  await printChainInfo(peopleClient);
  
    // TODO:
  // - Call `getFellowshipMembers` with the parameter `collectivesClient`.
  // - `await` the result, and assign it to a new constant `members`.
  const collectivesClient = makeClient(
    "wss://polkadot-collectives-rpc.polkadot.io"
  );
  await printChainInfo(collectivesClient);

  const members = await getFellowshipMembers(collectivesClient);

    // TODO:
  // - Create a new constant `table` which is an empty array that we will fill.
  // - Create a `for` loop over `members`, extracting the `address` and `rank`.
  // - Rather than use the hardcoded address below, use the `address` variable from `members`.
  // - Bring the logic to get the `balance` and `displayName` into your loop.
  // - Replace our `console.log`, and instead `push` all of the data into the `table` array.
  //   - `table.push({ rank, displayName, address, balance })`
  console.log("Generating table...");
  const table = [];
  for (const { address, rank } of members) {
    const balance = await getBalance(polkadotClient, address);
    const displayName = await getDisplayName(peopleClient, address);
    table.push({ rank, displayName, address, balance });
  }
   // TODO:
  // - We can sort the table by `rank`: `table.sort((a, b) => b.rank - a.rank)`.
  // - Finally, print the table using `console.table(table)`, rather than `console.log`.
  
  table.sort((a, b) => b.rank - a.rank);
  console.table(table);

  console.log(`Done!`);
  process.exit(0);
}

main();
