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


function delegate_from_pool(from_pool ,wif, to_account, slot, max_mana) {
    return new Promise(resolve => {
        steem.broadcast.customJson(
            wif,
            [username], // Required_auths
            [], // Required Posting Auths
            'rc', // Id
            JSON.stringify
            (
                [
                    "delegate_drc_from_pool",
                    {
                        "from_pool": from_pool,
                        "to_account": to_account,
                        "asset_symbol": {'nai': "@@000000037", 'precision': 6},
                        "to_slot": slot,
                        "drc_max_mana": max_mana,
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

function set_slot_delegator(from_pool ,to_account, slot, signer, wif) {
    return new Promise(resolve => {
        steem.broadcast.customJson(
            wif,
            [signer], // Required_auths
            [], // Required Posting Auths
            'rc', // Id
            JSON.stringify
            (
                [
                    "set_slot_delegator",
                    {
                        "from_pool": from_pool,
                        "to_account": to_account,
                        "to_slot": slot,
                        "signer": signer,
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

// Used to refresh rc
function transfer(wif, from, to, amount, memo)
{
    steem.broadcast.transfer(wif, from, to, amount, memo, function(err, result) {
        console.log(err, result);
    });
}

async function main() {

    ACTIVE = steem.auth.toWif(username,password, 'active');
    //set_slot_delegator("howotestnet", "howotestnet", 2, username, ACTIVE)
    await delegate_to_pool(username, ACTIVE, "@@725113729", "14380868")
    //transfer(ACTIVE, username, "howotestnet1", "1.000 TESTS", "")
    //delegate_from_pool(username, ACTIVE, "howotestnet", 2, 0)
}

main();

