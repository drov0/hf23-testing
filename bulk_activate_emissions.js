var steem = require('steem');

require('dotenv').config();
steem.api.setOptions({url: process.env.TESTNET_URL, useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : process.env.CHAIN_ID});
const request = require('request');
const rp = require('request-promise');

var username = process.env.S_USERNAME;
var password = process.env.S_PASSWORD;
var ACTIVE = ""
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
        })).result.tokens;

        let launched_smts = [];

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].token.phase === "launch_success") {
                launched_smts.push(tokens[i])
            }
        }

        return resolve({launched_smts, index: tokens[limit - 1].token.liquid_symbol.nai})
    });
}

async function get_all_launched_smts() {
    let launched_smts = [];
    let start = "@@100003008";

    for (let i = 0; i < 250; i++)
    {
        let result = await get_launched_smts(start, 1000);
        start = result.index;
        launched_smts = [...launched_smts, ...result.launched_smts];
        let nais = launched_smts.map(el => el.token.liquid_symbol.nai);
        jsondb.push("/launched_smts", nais);
        console.log(launched_smts.length)
    }
    return launched_smts
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
                                    amount: "1848808844",
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

    await broadcast(tx, ACTIVE)

}

async function bulk_activate_smts() {
    ACTIVE = await steem.auth.toWif(username,password, 'active');
    let smts = await get_all_launched_smts()

    //await bulk_delegate_rc(username, ACTIVE, nais)

    //console.log(smts);
}

bulk_activate_smts();