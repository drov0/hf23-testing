const moment =  require("moment");

var steem = require('steem');
require('dotenv').config();
steem.api.setOptions({url: 'https://testnet.steemitdev.com/', useAppbaseApi :  true, address_prefix : 'TST', 'chain_id' : "abc93c9021bbd9a8dd21c438ee3c480a661ca1966b5e4e838326dcf42a3dac2d"});
steem.config.set('address_prefix', 'TST');
steem.config.set('chain_id', 'abc93c9021bbd9a8dd21c438ee3c480a661ca1966b5e4e838326dcf42a3dac2d');

const assert = require("assert");

var username = process.env.S_USERNAME;
var password = process.env.S_PASSWORD;
const ACTIVE = steem.auth.toWif(username,password, 'active');

function broadcast(tx, wif)
{
    return new Promise(resolve => {
        steem.broadcast.send(tx, {wif}, async function (err, result) {
            if (err !== null) {
                console.error(err)
                return resolve(false)
            } else {
                return resolve(true)
            }
        });
    });
}


async function bulk_smt_object_create() {
    let nai_pool = await steem.api.callAsync('database_api.get_nai_pool', {});

    let pool = nai_pool.nai_pool;

    let operations = [];
    let smts = []

    for (let i = 0; i < pool.length; i++) {

        // Random precision
        const precision = Math.floor(Math.random() * 12);
        smts.push({nai: pool[i].nai, precision: precision});
        operations.push([
            'smt_create', {
                'control_account': username,
                'symbol': {'nai': pool[i].nai, 'precision': precision},
                'smt_creation_fee': {'amount': '1000', 'precision': 3, 'nai': '@@000000013'},
                'precision': precision,
            }]
        )
    }

    let tx = {
        'operations': operations
    };

    await broadcast(tx, ACTIVE);


    for (let i = 0; i < smts.length; i++) {
        operations = [];

        // Generate random number of emissions
        let emission_count = Math.floor(Math.random() * 10) + 1;
        let schedule_time = moment();

        for (let k = 0; k < emission_count; k++) {
            let emission = Math.floor(Math.random() * 4294967295);

            // All the emissions will happen in the next 10 days
            const hours_to_add = Math.floor(Math.random() * 240);
            // Minimum between two emissions is 6 hours, so min is 7
            schedule_time.add('hours', (hours_to_add < 7 ? 7 : hours_to_add));
            let schedule_time_str = schedule_time.format("YYYY-MM-DDTHH:mm:ss");

            let token_units = [];

            while (token_units.length === 0) {
                if (Math.random() > 0.5)
                    token_units.push(['$market_maker', Math.floor(Math.random() * 65534) + 1]);
                if (Math.random() > 0.5)
                    token_units.push(['$rewards', Math.floor(Math.random() * 65534) + 1]);
                if (Math.random() > 0.5)
                    token_units.push(['$vesting', Math.floor(Math.random() * 65534) + 1]);
                if (Math.random() > 0.5)
                    token_units.push(['petanque', Math.floor(Math.random() * 65534) + 1]);
                if (Math.random() > 0.5)
                    token_units.push(['howo', Math.floor(Math.random() * 65534) + 1]);
            }

            let tx = {
                'operations': [[
                    'smt_setup_emissions', {
                        'control_account': username,
                        'symbol': {'nai': smts[i].nai, 'precision': smts[i].precision},
                        'schedule_time': schedule_time_str,
                        'emissions_unit': {
                            'token_unit': token_units
                        },
                        'interval_seconds': (emission < 21600 ? 21600 : emission),
                        'interval_count': Math.floor(Math.random() * 4294967295),
                        'lep_time': '1970-01-01T00:00:00',
                        'lep_abs_amount': 0,
                        'lep_rel_amount_numerator': 1,
                        'rep_time': '1970-01-01T00:00:00',
                        'rep_abs_amount': 0,
                        'rep_rel_amount_numerator': 0,
                        'rel_amount_denom_bits': 0,
                        'remove': false,
                        'floor_emissions': Math.random() > 0.5,
                        'extensions': []
                    }]]
            }

            await broadcast(tx, ACTIVE);
            await wait(3); // Wait 3 seconds for emission to be stored

        }


    }


    operations = [];

    for (let i = 0; i < smts.length; i++) {
        let launch_time = moment().add('days', Math.floor(Math.random() * 10) + 1);
        launch_time = launch_time.format("YYYY-MM-DDTHH:mm:ss");

        operations.push(
            [
                'smt_setup', {
                'control_account': username,
                'symbol': {'nai': smts[i].nai, 'precision': smts[i].precision},
                'max_supply': Math.floor(Math.random() * 9999999999) + 1,
                'contribution_begin_time': launch_time,
                'contribution_end_time': launch_time,
                'launch_time': launch_time,
                'steem_units_min': 0,
                'min_unit_ratio': 0,
                'max_unit_ratio': 0,
                'extensions': []
            }]
        )
    }

    tx = {
        'operations': operations
    };

    await broadcast(tx, ACTIVE);
}

function wait(time)
{
    return new Promise(resolve => {
        setTimeout(() => resolve('☕'), time*1000); // miliseconds to seconds
    });
}

/*
    The objective of this test is to create a lot of smts with lots of different params
 */
async function bulk_full_setup() {
    let created = 0;
    while (true) {
        await bulk_smt_object_create();
        created += 10;
        console.log(`created ${created} smts`);
        await wait(3);
    }

}

bulk_full_setup();


