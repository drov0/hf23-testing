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

    let operations = [];

    for (let i = 0; i < pool.length; i++) {
        // Random precision
        const precision = Math.floor(Math.random()*12);
        operations.push([
            'smt_create', {
                'control_account': username,
                'symbol': {'nai':pool[i].nai,'precision': precision},
                'smt_creation_fee': {'amount':'1000','precision':3,'nai':'@@000000013'},
                'precision': precision,
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

/*
    The objective of this test is to create as many smt as possible in order to drastically increase the chances of having a nai collision
 */
async function nai_collision_test() {
    let created = 0;
    while (true) {
        await bulk_smt_object_create();
        created += 10;
        console.log(`created ${created} smts`);
        await wait(3);
    }
}

nai_collision_test();


