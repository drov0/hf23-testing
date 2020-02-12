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
                                amount: "50",
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


function get_account_names(start) {
    return new Promise(resolve => {
        steem.api.lookupAccounts(start, 1000, function(err, result) {
            return resolve(result)
        });
    });
}

async function get_account_names_bulk(count) {
    let start = "";
    let accounts = [];
    for (let i = 0; i < count; i++) {
        let result = await get_account_names(start);
        start = result[result.length - 1];
        accounts.pop(); // removing last one to prevent duplicates
        accounts = [...accounts, ...result]
    }

    return accounts
}

async function create_smt_full_setup_2k_units() {
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
    // I have a one hour offset compared to blockchain time, you might want to remove this
    schedule_time.subtract(59, 'minute');
    schedule_time.subtract(50, 'second');

    let schedule_time_str = schedule_time.format("YYYY-MM-DDTHH:mm:ss");

    // Get 2k names
    const names = await get_account_names_bulk(2);

    let token_units = [];
    token_units.push(['$market_maker', Math.floor(Math.random() * 65534) + 1]);
    token_units.push(['$rewards', Math.floor(Math.random() * 65534) + 1]);
    token_units.push(['$vesting', Math.floor(Math.random() * 65534) + 1]);

    for (let i = 0; i < names.length; i++) {
        token_units.push([`$!${names[i]}.vesting`, Math.floor(Math.random() * 65534) + 1]);
        token_units.push([names[i], Math.floor(Math.random() * 65534) + 1]);
    }

    tx = {
        'operations': [[
            'smt_setup_emissions', {
                'control_account': username,
                'symbol': {'nai': nai, 'precision': 3},
                'schedule_time': schedule_time_str,
                'emissions_unit': {
                    'token_unit': token_units
                },
                'interval_seconds': 21600,
                'emission_count':  21600,
                'lep_time' : '1970-01-01T00:00:00',
                'rep_time' : '1970-01-01T00:00:00',
                'lep_abs_amount' : 0,
                'rep_abs_amount': 0,
                'lep_rel_amount_numerator' : 1,
                'rep_rel_amount_numerator' : 0,
                'rel_amount_denom_bits' : 0,
                'remove' : false,
                'floor_emissions' : false,
            }]]
    };

    await broadcast(tx, ACTIVE);


    tx = {
        'operations': [[
            'smt_setup', {
                'control_account': username,
                'symbol': {'nai': nai, 'precision': 3},
                'max_supply': 60000000,
                'contribution_begin_time': schedule_time_str,
                'contribution_end_time': schedule_time_str,
                'launch_time': schedule_time_str,
                'steem_units_min': 0,
                'min_unit_ratio': 0,
                'max_unit_ratio': 0,
                'extensions': []
            }]]
    };

    await broadcast(tx, ACTIVE);

    console.log(`created smt with nai : ${nai}`);

    return nai
}

async function main() {
    ACTIVE = steem.auth.toWif(username,password, 'active');
    let nai = await create_smt_full_setup_2k_units();
    await delegate_rc(username, nai, ACTIVE);
}

main();

