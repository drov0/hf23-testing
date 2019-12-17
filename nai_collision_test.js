var steem = require('steem');
require('dotenv').config();
steem.api.setOptions({url: 'https://testnet.steemitdev.com/', useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : "abc93c9021bbd9a8dd21c438ee3c480a661ca1966b5e4e838326dcf42a3dac2d"});
steem.config.set('address_prefix', 'TST')
steem.config.set('chain_id', 'abc93c9021bbd9a8dd21c438ee3c480a661ca1966b5e4e838326dcf42a3dac2d');

const assert = require("assert");

var username = process.env.S_USERNAME;
var password = process.env.S_PASSWORD;
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
        'operations': operations
    };

    let result = await broadcast(tx, ACTIVE);

    assert(result.error);
}



function wait(time)
{
    return new Promise(resolve => {
        setTimeout(() => resolve('☕'), time*1000); // miliseconds to seconds
    });
}

async function nai_collision_test() {
    while (true) {
        await bulk_smt_object_create();
        await wait(3);
    }
}

nai_collision_test();


