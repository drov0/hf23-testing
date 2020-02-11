require('dotenv').config();
var steem = require('steem');
var dstem = require('dsteem');

steem.api.setOptions({url: process.env.TESTNET_URL, useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : process.env.CHAIN_ID});
const request = require('request');
var rp = require('request-promise');

const assert = require("assert");

var username = process.env.S_USERNAME;
var password = process.env.S_PASSWORD;
var ACTIVE = ""


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


async function get_launched_smts(start, limit) {
    if (!limit) {
        limit = 1000;
    }
    //let account = await steem.api.callAsync('condenser_api.get_accounts', [[username]]);
    let tokens = await steem.api.callAsync('database_api.list_smt_tokens', {params : {limit: limit, order: "by_symbol", "start": start}})

    console.log(tokens)

}

async function bulk_delegate_rc(username, wif, nais) {
    let tx = {
        'operations': [
            [
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
                                "to_pool": nais[0],
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
            ]
        ]
    };

    await broadcast(tx, ACTIVE)

}

async function bulk_activate_smts() {
    let smts = await get_launched_smts(0)
    //await bulk_delegate_rc(username, ACTIVE, ["@@683994926"])

    console.log(smts);
}

bulk_activate_smts();