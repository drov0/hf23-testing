const moment =  require("moment");

var steem = require('steem');
require('dotenv').config();
steem.api.setOptions({url: process.env.TESTNET_URL, useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : process.env.CHAIN_ID});
steem.config.set('address_prefix', 'TST');
steem.config.set('chain_id', process.env.CHAIN_ID);

const assert = require("assert");

var username = process.env.S_USERNAME;
var password = process.env.S_PASSWORD;
var ACTIVE = "";

function broadcast(tx, wif)
{
    return new Promise(resolve => {
        steem.broadcast.send(tx, {wif}, async function (err, result) {
            if (err !== null) {
                console.error(err);
                return resolve(false)
            } else {
                return resolve(true)
            }
        });
    });
}

function delegate_rc(username, nai, wif) {
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
                        "to_pool": nai,
                        "amount":
                            {
                                symbol: "VESTS",
                                amount: "500000",
                                precision: 6,
                                nai: "@@000000037"
                            }
                    }
                ]
            ),
            function(err, result) {
                console.log(err, result);
            }
        );
    })
}

async function smt_contribute(nai, amount) {
    let tx = {
        'operations': [[
            'smt_contribute', {
                'contributor' : username,
                'symbol' : {'nai':nai,'precision':3},
                'contribution_id' : 2,
                'contribution': {'amount':amount,'precision':3,'nai':'@@000000021'},
                'extensions':[]
            }]]
    }

    await broadcast(tx, ACTIVE);

    console.log(`created smt with nai : ${nai}`);

    return nai
}

async function create_smt_full_setup() {
    let nai_pool = await steem.api.callAsync('database_api.get_nai_pool', {});
    const nai = nai_pool.nai_pool[0].nai;

    let tx = {
        'operations': [[
            'smt_create', {
                'control_account': username,
                'symbol': {'nai': nai, 'precision': 3},
                'smt_creation_fee': {'amount': '1000', 'precision': 3, 'nai': '@@000000013'},
                'precision': 3,
            }]]
    };

    await broadcast(tx, ACTIVE);

    let schedule_time = moment();

    // Make sure it launches in the next 10 seconds
    schedule_time.add(2, 'hours');

    let schedule_time_str = schedule_time.format("YYYY-MM-DDTHH:mm:ss");

    tx = {
        'operations': [[
            'smt_setup_ico_tier', {
                'control_account' : username,
                'symbol' : {'nai':nai,'precision':3},
                'steem_units_cap' : 10000,
                'generation_policy' : [
                    0,
                    {
                        'generation_unit' : {
                            'steem_unit' : [
                                ['$!petanque.vesting',2],
                                ['petanque',2]
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
                        'extensions':[]
                    }
                ],
                'remove' : false,
                'extensions':[]
            }]]
    };

    await broadcast(tx, ACTIVE);

    let contrib_begin_time = moment();
    contrib_begin_time.subtract(59, 'minute');
    contrib_begin_time.subtract(50, 'second');

    tx = {
        'operations': [[
            'smt_setup', {
                'control_account': username,
                'symbol': {'nai': nai, 'precision': 3},
                'max_supply': 1000,
                'contribution_begin_time':  contrib_begin_time.format("YYYY-MM-DDTHH:mm:ss"),
                'contribution_end_time': schedule_time_str,
                'launch_time': schedule_time_str,
                'steem_units_min': 1,
                'min_unit_ratio': 1,
                'max_unit_ratio': 1,
                'extensions': []
            }]]
    };

    await broadcast(tx, ACTIVE);

    console.log(`created smt with nai : ${nai}`);

    return nai
}

async function main() {
    ACTIVE = steem.auth.toWif(username,password, 'active');
    //let nai = await create_smt_full_setup();
    smt_contribute("@@939741949", "5000")
    //await delegate_rc(username, nai, ACTIVE);
}
//  @@939741949


main();

