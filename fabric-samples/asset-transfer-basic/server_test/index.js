
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

app.post('/register_patient', async(req, res)=> {
    const { nid_no } = req.body;

    try {
        const response = await axios.post('http://localhost:4000/get_citizen_info', { nid_no });
        res.json(response.data);
        test_object(response.data);

    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "NID Server Error" });
    }
})

function test_object(object) {
    console.log(object.name);
    console.log(object.nid_no)
}


app.listen(8000, () => console.log("NID Server running on port 8000"));
