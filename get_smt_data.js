var steem = require('steem');
require('dotenv').config();
steem.api.setOptions({url: process.env.TESTNET_URL, useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : process.env.CHAIN_ID});
const request = require('request');
const rp = require('request-promise');

const assert = require("assert");

var username = process.env.S_USERNAME;
var password = process.env.S_PASSWORD;
var ACTIVE = "";

function get_smts(start, limit) {
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

        return resolve(tokens)
    });
}

function list_smt_token_balances(account, limit) {
    return new Promise(async resolve => {
        if (!limit) {
            limit = 1000;
        }

        let balances = (await rp({
            method: 'POST',
            uri: process.env.TESTNET_URL,
            body: {
                "jsonrpc": "2.0",
                "method": "database_api.list_smt_token_balances",
                "params": {"order": "by_account_symbol", "limit": limit, "start": ["steem.dao",{"nai": "@@844977022", "precision": 3}]},
                "id": 1
            },
            json: true
        }));
        return resolve(balances)
    });
}




async function main() {
    let token = await get_smts("@@100364445", 1);
    //let balance = await list_smt_token_balances("petanque");
    console.log(token)
}

main()