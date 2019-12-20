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
        const precision = Math.floor(Math.random()*12);
        smts.push({nai:pool[i].nai, precision: precision});
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

    await broadcast(tx, ACTIVE);

    operations = [];

    for (let i = 0; i < smts.length; i++) {
        // Random precision
        const precision = Math.floor(Math.random()*12);

        let emission = Math.floor(Math.random()*50000)
        let schedule_time = moment().add('days', Math.floor(Math.random()*30)+1);
        schedule_time = schedule_time.format("YYYY-MM-DDTHH:mm:ss");

        operations.push([
            'smt_setup_emissions', {
                'control_account' : username,
                'symbol' : {'nai':smts[i].nai,'precision':smts[i].precision},
                'schedule_time' : schedule_time,
                'emissions_unit' : {
                    'token_unit' : [
                        ['$market_maker',Math.floor(Math.random()*10)+1],
                        ['$rewards',Math.floor(Math.random()*10)+1],
                        ['$vesting',Math.floor(Math.random()*10)+1],
                        ['petanque',Math.floor(Math.random()*10)+1],
                    ]
                },
                'interval_seconds' : (emission < 21600 ? 21600 : emission),
                'interval_count' : 1,
                'lep_time' : '1970-01-01T00:00:00',
                'rep_time' : '1970-01-01T00:00:00',
                'lep_abs_amount' : 0,
                'rep_abs_amount': 0,
                'lep_rel_amount_numerator' : 1,
                'rep_rel_amount_numerator' : 0,
                'rel_amount_denom_bits' : 0,
                'remove' : false,
                'floor_emissions' : false,
                'extensions':[]
            }]
        )
    }

    tx = {
        'operations': operations
    };

    await broadcast(tx, ACTIVE);


    operations = []

    for (let i = 0; i < smts.length; i++) {
        let launch_time = moment().add('days', Math.floor(Math.random()*30)+1);
        launch_time = launch_time.format("YYYY-MM-DDTHH:mm:ss");

        operations.push([
            'smt_setup', {
                'control_account' : username,
                'symbol' : {'nai':smts[i].nai,'precision': smts[i].precision},
                'max_supply' : Math.floor(Math.random()*9999999999)+1,
                'contribution_begin_time' : launch_time,
                'contribution_end_time' : launch_time,
                'launch_time' : launch_time,
                'steem_units_min' : 0,
                'min_unit_ratio' : 0,
                'max_unit_ratio' : 0,
                'extensions':[]
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


