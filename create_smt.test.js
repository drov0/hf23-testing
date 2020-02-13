var steem = require('steem');
require('dotenv').config();
steem.api.setOptions({url: process.env.TESTNET_URL, useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : process.env.CHAIN_ID});
const assert = require("assert");

var username = process.env.S_USERNAME;
var password = process.env.S_PASSWORD;
const ACTIVE = steem.auth.toWif(username,password, 'active');


function broadcast(tx, wif)
{
    return new Promise(resolve => {
        steem.broadcast.send(tx, {wif}, async function (err, result) {
            if (err) {
                return resolve({noError : false, err})
            } else {
                return resolve({noError : true , result})
            }
        });
    });
}

async function successful_smt_object_create(precision) {
    let nai_pool = await steem.api.callAsync('database_api.get_nai_pool', {});

    let nai = nai_pool.nai_pool[0];

    let tx = {
        'operations': [[
            'smt_create', {
                'control_account': username,
                'symbol': {'nai': nai.nai, 'precision': precision},
                'smt_creation_fee': {'amount': '1000', 'precision': 3, 'nai': '@@000000013'},
                'precision': precision,
                'extensions': []
            }
            ]],
    };

    let result = await broadcast(tx, ACTIVE);

     assert(result.noError);
}


async function bulk_smt_object_create() {
    let nai_pool = await steem.api.callAsync('database_api.get_nai_pool', {});

    let pool = nai_pool.nai_pool;

    let operations = []

    for (let i = 0; i < pool.length; i++) {
        operations.push([
            'smt_create', {
            'control_account': username,
            'symbol': {'nai':pool[i].nai,'precision':3},
            'smt_creation_fee': {'amount':'1000','precision':3,'nai':'@@000000013'},
            'precision': 3,
            }]
        )
    }

    let tx = {
        'operations': operations,
        'extensions': []
    };

    let result = await broadcast(tx, ACTIVE);

    assert(result.noError);
}

async function smt_object_create_wrong_nai() {
    console.log('already used nai');
    let tx = {
        'operations': [[
            'smt_create', {
                'control_account': username,
                'symbol': {'nai':'@@000000013','precision':3},
                'smt_creation_fee': {'amount':'1000','precision':3,'nai':'@@000000013'},
                'precision': 3,
            }]]
    };

    let result = await broadcast(tx, ACTIVE);

    assert(!result.noError);

    console.log('wrong nai format ');
    tx = {
        'operations': [[
            'smt_create', {
                'control_account': username,
                'symbol': {'nai':'whatever','precision':3},
                'smt_creation_fee': {'amount':'1000','precision':3,'nai':'@@000000013'},
                'precision': 3,
            }]]
    };

    result = await broadcast(tx, ACTIVE);

    assert(!result.noError);

    console.log('nai too long');
    tx = {
        'operations': [[
            'smt_create', {
                'control_account': username,
                'symbol': {'nai':'@@0000000000','precision':3},
                'smt_creation_fee': {'amount':'1000','precision':3,'nai':'@@000000013'},
                'precision': 3,
            }]]
    };

    result = await broadcast(tx, ACTIVE);

    assert(!result.noError);

    console.log("wrong nai format")

    tx = {
        'operations': [[
            'smt_create', {
                'control_account': username,
                'symbol': {'nai':'@@00000001a','precision':3},
                'smt_creation_fee': {'amount':'1000','precision':3,'nai':'@@000000013'},
                'precision': 3,
            }]]
    };

    result = await broadcast(tx, ACTIVE);

    assert(!result.noError);
}


async function wrong_precision() {
    let nai_pool = await steem.api.callAsync('database_api.get_nai_pool', {});

    let nai = nai_pool.nai_pool[0];

    console.log("precision mismatch");

    let tx = {
        'operations': [[
            'smt_create', {
                'control_account': username,
                'symbol': {'nai':nai.nai,'precision':0},
                'smt_creation_fee': {'amount':'1000','precision':3,'nai':'@@000000013'},
                'precision': 3,
            }]]
    };


    let result = await broadcast(tx, ACTIVE);
    assert(!result.noError);

    console.log("13 precision");

    tx = {
        'operations': [[
            'smt_create', {
                'control_account': username,
                'symbol': {'nai':nai.nai,'precision':13},
                'smt_creation_fee': {'amount':'1000','precision':3,'nai':'@@000000013'},
                'precision': 13,
            }]]

    };

    result = await broadcast(tx, ACTIVE);
    assert(!result.noError);

    console.log("-1 precision");

    tx = {
        'operations': [[
            'smt_create', {
                'control_account': username,
                'symbol': {'nai':nai.nai,'precision':255},
                'smt_creation_fee': {'amount':'1000','precision':3,'nai':'@@000000013'},
                'precision': 255,
            }]]

    };

    result = await broadcast(tx, ACTIVE);
    assert(!result.noError);
}

async function test() {
    await smt_object_create_wrong_nai();
    await wrong_precision();
    await successful_smt_object_create(6);
     Create 100 smts
    for (let i = 0; i < 10; i++)
       await bulk_smt_object_create()
}

test();


