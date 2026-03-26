const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const upload = multer({ dest: '/tmp/' });


router.get("/", function (req, res) {
    res.json({
        msg: "Ring route is working"
    });
});

router.get("/getring/allrings", async function (req, res) {
    try {
        const { data, error } = await supabase
            .from('ring_inventory')
            .select('*');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(data);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ msg: "Server error" });
    }
});

router.get("/getring/:id", async function (req, res) {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('ring_inventory')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {

            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(data);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ msg: "Server error" });
    }
});

router.post("/addringemail", async function (req, res) {
    try {
        const { email } = req.body;



        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {

            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(data);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ msg: "Server error" });
    }
});

router.post("/addringemail/price", async function (req, res) {
    try {
        const { email } = req.body;


        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('currency')
            .eq('email', email)
            .single();

        if (profileError) {
            console.error('Supabase error:', profileError);
            return res.status(500).json({ error: 'Failed to fetch user profile' });
        }

        const userCurrency = profileData.currency;

        const { data: ringData, error: ringError } = await supabase
            .from('ring_inventory')
            .select('*');

        if (ringError) {
            console.error('Supabase error:', ringError);
            return res.status(500).json({ error: 'Failed to fetch ring inventory' });
        }

        const { data: exchangeRate, error: fxError } = await supabase
            .from('fx_rates')
            .select('rate')
            .eq('currency', userCurrency)
            .single();

        if (fxError) {
            console.error('Supabase error:', fxError);
            return res.status(500).json({ error: 'Failed to fetch exchange rates' });
        }

        // let exchangeRate = null;
        // for (let i = 0; i < fxData.length; i++) {
        //     if (fxData[i].currency === userCurrency) {
        //         exchangeRate = fxData[i];
        //         break;
        //     }
        // }

        const convertedRings = [];
        for (let i = 0; i < ringData.length; i++) {
            const ring = ringData[i];
            const currency = userCurrency;
            convertedRings.push({

                id: ring.id,
                created_at: ring.created_at,
                name: ring.name,
                image: ring.image,
                price: Math.ceil(ringData[i].price * exchangeRate.rate),
                currency: userCurrency,
                type: ring.type,
                cetegory: ring.category,
                description: ring.description,
                form: ring.form



            });
        }
        // return list 
        res.json(convertedRings);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ msg: "Server error" });
    }
});
// Requirements
// const multer = require('multer');
// const csv = require('csv-parser');
// const fs = require('fs');
router.post('/upload', upload.single('csvfile'), function (req, res) {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const results = [];
    const filePath = req.file.path;
    // console.log('filePath: ',filePath);


    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', function (data) {
            results.push(data);
        })
        .on('end', async function () {
            try {

                const { error } = await supabase
                    .from('ring_transaction')
                    .insert(results);


                fs.unlinkSync(filePath);

                if (error) {
                    console.error('Supabase error:', error);
                    return res.status(500).json({
                        error: 'Failed to insert data',
                        details: error.message
                    });
                }
                //    console.log(results)
                res.json({
                    msg: "CSV data uploaded successfully",
                    rowsInserted: results.length
                });
            } catch (err) {
                console.error('Server error:', err);
                fs.unlinkSync(filePath);
                res.status(500).json({ msg: "Server error" });
            }
        })
        .on('error', function (err) {
            console.error('CSV parsing error:', err);
            fs.unlinkSync(filePath);
            res.status(400).json({ error: 'Failed to parse CSV file' });
        });
});

module.exports = router;