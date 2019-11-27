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

async function wrong_precision() {
    let nai_pool = await steem.api.callAsync('database_api.get_nai_pool', {});

    let nai = nai_pool.nai_pool[0];

    console.log("creating smt object");

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


    tx = {
        'operations': [[
            'smt_setup', {
                'control_account' : username,
                'symbol' : {'nai':nai,'precision':3},
                'max_supply' : '1000000000000000',
                'initial_generation_policy' : [
                    0,
                    {
                        'pre_soft_cap_unit' : {
                            'steem_unit' : [
                                ['$!alice.vesting',2],
                                ['$market_maker',2],
                                ['alice',2]
                            ],
                            'token_unit' : [
                                ['$!alice.vesting',2],
                                ['$from',2],
                                ['$from.vesting',2],
                                ['$market_maker',2],
                                ['$rewards',2],
                                ['alice',2]
                            ]
                        },
                        'post_soft_cap_unit' : {
                            'steem_unit' : [
                                ['$!alice.vesting',1],
                                ['$market_maker',1],
                                ['alice',1]
                            ],
                            'token_unit' : [
                                ['$!alice.vesting',1],
                                ['$from',1],
                                ['$from.vesting',1],
                                ['$market_maker',1],
                                ['$rewards',1],
                                ['alice',1]
                            ]
                        },
                        'min_unit_ratio' : 50,
                        'max_unit_ratio' : 100,
                        'extensions':[]
                    }],
                'contribution_begin_time' : '2020-12-21T00:00:00',
                'contribution_end_time' : '2021-12-21T00:00:00',
                'launch_time' : '2021-12-22T00:00:00',
                'steem_units_min' : 0,
                'steem_units_soft_cap' : 2000,
                'steem_units_hard_cap' : 10000,
                'extensions':[]
            }]]
    }

    result = await broadcast(tx, ACTIVE);

    console.log(result.result);

    assert(!result.error);
}

function test() {
    //smt_object_create_wrong_nai()
    //wrong_precision()
}

test();