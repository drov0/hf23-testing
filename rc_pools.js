const moment =  require("moment");

var steem = require('steem');
require('dotenv').config();
steem.api.setOptions({url: process.env.TESTNET_URL, useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : process.env.CHAIN_ID});
steem.config.set('address_prefix', 'TST');
steem.config.set('chain_id', process.env.CHAIN_ID);

const request = require('request');
const rp = require('request-promise');

const assert = require("assert");

var username = process.env.S_USERNAME;
var password = process.env.S_PASSWORD;
var ACTIVE = "";

function delegate_to_pool(username,wif, pool, amount, ) {
    return new Promise(resolve => {
        steem.broadcast.customJson(
            wif,
            [username], // Required_auths
            [], // Required Posting Auths
            'rc', // Id
            JSON.stringify
            (
                [
                    "delegate_to_pool",
                    {
                        "from_account": username,
                        "to_pool": pool,
                        "amount":
                            {
                                symbol: "VESTS",
                                amount: amount,
                                precision: 6,
                                nai: "@@000000037"
                            }
                    }
                ]
            ),
            function(err, result) {
                if (err !== null) {
                    console.error(err);
                    return resolve(false)
                } else {
                    return resolve(true)
                }
            }
        );
    })
}


function find_rc_accounts(accounts) {
    return new Promise(async resolve => {
        let balances = (await rp({
            method: 'POST',
            uri: process.env.TESTNET_URL,
            body: {
                "jsonrpc": "2.0",
                "method": "rc_api.find_rc_accounts",
                "params": {accounts},
                "id": 1
            },
            json: true
        }));
        return resolve(balances)
    });
}

function get_resource_pool() {
    return new Promise(async resolve => {
        let balances = (await rp({
            method: 'POST',
            uri: process.env.TESTNET_URL,
            body: {
                "jsonrpc": "2.0",
                "method": "rc_api.get_resource_pool",
                "id": 1
            },
            json: true
        }));
        return resolve(balances)
    });
}


async function main() {
    ACTIVE = steem.auth.toWif(username,password, 'active');
    //await delegate_to_pool(username, ACTIVE, "@@844977022", "103986000419")
    let rc_accounts = await get_resource_pool()
    console.log(rc_accounts)
}

main();

