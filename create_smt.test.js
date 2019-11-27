var steem = require('steem');
require('dotenv').config();
steem.api.setOptions({url: 'https://testnet.steemitdev.com/', useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : "0feb08c380aeb483b61a34cccb7271a3a99c47052bea529c4a891622f2c50d75"});
steem.config.set('address_prefix', 'TST')
steem.config.set('chain_id', '91a2c4c8f514efbc2c0f8ce87e19cfba12f83dbd32bbebe5cf3534faac7826b0');

const assert = require("assert");

var username = process.env.S_USERNAME;
var password = process.env.S_PASSWORD;
const POSTING = steem.auth.toWif(username,password, 'posting');
const ACTIVE = steem.auth.toWif(username,password, 'active');


function broadcast(tx, wif)
{
    return new Promise(resolve => {
        steem.broadcast.send(tx, {wif}, async function (result, err) {
            if (!err) {
                return resolve({error : false, result})
            } else {
                return resolve({error : true , err})
            }
        });
    });
}

async function successful_smt_object_create() {
    let nai_pool = await steem.api.callAsync('database_api.get_nai_pool', {});

    let nai = nai_pool.nai_pool[0];

    let tx = {
        'operations': [[
            'smt_create', {
                'control_account': username,
                'symbol': {'nai':nai.nai,'precision':3},
                'smt_creation_fee': {'amount':'1000','precision':3,'nai':'@@000000013'},
                'precision': 3,
            }]]
    };

    let result = await broadcast(tx, ACTIVE);

    assert(result.error);
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

    assert(!result.error);

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

    assert(!result.error);

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

    assert(!result.error);

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

    assert(!result.error);
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
    assert(!result.error);

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
    assert(!result.error);

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

    console.log(result.result);

    assert(!result.error);
}

function test() {
    smt_object_create_wrong_nai()
    wrong_precision()
}

test();