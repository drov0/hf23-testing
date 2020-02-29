var steem = require('steem');

require('dotenv').config();
steem.api.setOptions({url: process.env.TESTNET_URL, useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : process.env.CHAIN_ID});
const request = require('request');
const rp = require('request-promise');

var username = process.env.S_USERNAME;
var password = process.env.S_PASSWORD;
var ACTIVE = steem.auth.toWif(username,password, 'active');
let JsonDB  = require('node-json-db').JsonDB;
let Config = require('node-json-db/dist/lib/JsonDBConfig').Config
var jsondb = new JsonDB(new Config("db", true, false, '/'));

function broadcast(tx, wif)
{
    return new Promise(resolve => {
        steem.broadcast.send(tx, {wif}, async function (err, result) {
            if (err !== null) {
                console.error(err)
                return resolve(false)
            } else {
                return resolve(true)
            }
        });
    });
}


function get_launched_smts(start, limit) {
    return new Promise(async resolve => {
        if (!limit) {
            limit = 1000;
        }
        if (!start) {
            start = "@@100003008"
        }
        let tokens = (await rp({
            method: 'POST',
            uri: process.env.TESTNET_URL,
            body: {
                "jsonrpc": "2.0",
                "method": "database_api.list_smt_tokens",
                "params": {"order": "by_symbol", "limit": limit, "start": {"nai": start, "precision": 5}},
                "id": 1
            },
            json: true
        })).result;

        if (tokens === undefined) {
            console.log("failed to fetch, retry")
            return resolve({launched_smts: [], index: start, end: false})
        }
        tokens = tokens.tokens;

        let launched_smts = [];

        if (tokens.length !== limit)
        {
            console.log(tokens[tokens.length -1].token.liquid_symbol.nai)
        }

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].token.phase === "launch_success") {
                launched_smts.push(tokens[i])
            }
        }

        return resolve({launched_smts, index: tokens[tokens.length - 1].token.liquid_symbol.nai, end : tokens.length !== limit})
    });
}

async function get_all_launched_smts() {
    let result_nais = [];
    let start = "@@100003008";

    while (true) {
        let result = await get_launched_smts(start, 1000);
        start = result.index;
        let nais = result.launched_smts.map(el => el.token.liquid_symbol.nai);
        result_nais = [...result_nais, ...nais];
        console.log(result_nais.length);

        // This is just because I didn't want to activate more than 100k feel free to change this
        if (result_nais.length > 100000) {
            break;
        }
        if (result.end === true) {
            break;
        }
    }
    return result_nais
}

async function bulk_delegate_rc(username, wif, nais) {
    let op = [];

    for (let i = 0; i < nais.length; i++) {
        op.push([
            "custom_json",
            {
                "id": "rc",
                "required_posting_auths": [],
                "required_auths": [username],
                "json": JSON.stringify
                (
                    [
                        "delegate_to_pool",
                        {
                            "from_account": username,
                            "to_pool": nais[i],
                            "amount":
                                {
                                    symbol: "VESTS",
                                    amount: "5000",
                                    precision: 6,
                                    nai: "@@000000037"
                                }
                        }
                    ]
                )
            }
        ])
    }

    let tx = {
        'operations': op
    };

    return await broadcast(tx, wif)

}

function wait(time)
{
    return new Promise(resolve => {
        setTimeout(() => resolve('☕'), time*1000); // miliseconds to seconds
    });
}

async function createAccounts(prefix , amount, start) {
    let i = start;

    // Generate the keypairs
    let publicKeys = steem.auth.generateKeys(username, password, ['posting', 'owner', 'active', 'memo']);

    // Create the key objects
    let owner = {
        weight_threshold: 1,
        account_auths: [],
        key_auths: [[publicKeys.owner, 1]]
    };
    let active = {
        weight_threshold: 1,
        account_auths: [],
        key_auths: [[publicKeys.active, 1]]
    };
    let posting = {
        weight_threshold: 1,
        account_auths: [],
        key_auths: [[publicKeys.posting, 1]]
    };

    while (i < amount) {
        let ops = [];
        for (let k = i; k < i+40; k++) {
            ops.push([
                'account_create', {
                    'fee': "0.000 TESTS",
                    'creator': username,
                    'new_account_name': prefix + k,
                    'owner': owner,
                    'active': active,
                    'posting': posting,
                    'memo_key': publicKeys.memo,
                    'json_metadata': "",
                    'extensions': []
                }]);
        }
        let tx = {'operations': ops};

        let result = await broadcast(tx, ACTIVE);

        if (result !== true) {
            console.log(`error while creating ${prefix + i}`);
            continue
        }
        i += 40;
        console.log(i)
    }
}

async function delegate_to_accounts(prefix , count, start, amount) {
    let i = start;

    while (i < count) {
        let ops = [];
        for (let k = i; k < i+50; k++) {
            ops.push([
                'delegate_vesting_shares', {
                    'delegator': username,
                    'delegatee': prefix + k,
                    'vesting_shares': amount,
                    'extensions': []
                }]);
        }
        let tx = {'operations': ops};

        let result = await broadcast(tx, ACTIVE);

        if (result !== true) {
            console.log(`error while delegating to  ${prefix + i}`);
            continue
        }
        i += 50;
        console.log(i)
    }
}

async function bulk_activate_smts() {
    let result_nais_fetched = await get_all_launched_smts();
    let result_nais = []
    for (let i = 0; i < 100000; i++) {
        result_nais.push(result_nais_fetched[i])
    }

    console.log("Data collection finished, delegating...");
    let activated_smts = 0;
    let current_round = 0;
    let account_prefix = 1;
    let active_key = steem.auth.toWif("howotest1","test", 'active');
    let current_account = "howotest"+account_prefix;
    while (true) {
        let nais = result_nais.slice(activated_smts, activated_smts + 5);

        let result = await bulk_delegate_rc(current_account, active_key, nais);
        if (result !== true) {
            console.log(nais);
            continue
        }

        activated_smts += 5;
        current_round += 5;
        if (current_round === 40) {
            account_prefix += 1;
            current_account = "howotest"+account_prefix;
            current_round = 0;
            active_key = steem.auth.toWif(current_account,"test", 'active');
        }
        if (activated_smts === 100000) {
            break;
        }
        console.log(activated_smts);
    }

    console.log("finished");
    await wait(500000) // Here because pm2 restarts the process automatically and I cba to find a better way for now
}

bulk_activate_smts();