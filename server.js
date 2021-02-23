const express = require("express");
const request = require("request");
const fetch = require("node-fetch");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("listening");
});

app.use(express.static('public'));
app.use(express.json({limit: '1mb'}));

app.get('/fedex/:trackingNum', (request, response) => {
    const trackingNum = request.params.trackingNum;
    var raw = "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\"\nxmlns:v16=\"http://fedex.com/ws/track/v16\">\n<soapenv:Header/>\n    <soapenv:Body>\n        <v16:TrackRequest>\n            <v16:WebAuthenticationDetail>\n                <v16:ParentCredential>\n                    <v16:Key>" + process.env.FEDEX_KEY + "</v16:Key>\n                    <v16:Password>" + process.env.FEDEX_PASSWORD + "</v16:Password>\n                </v16:ParentCredential>\n                <v16:UserCredential>\n                    <v16:Key>" + process.env.FEDEX_KEY + "</v16:Key>\n                    <v16:Password>" + process.env.FEDEX_PASSWORD + "</v16:Password>\n                </v16:UserCredential>\n            </v16:WebAuthenticationDetail>\n            <v16:ClientDetail>\n                <v16:AccountNumber>" + process.env.FEDEX_ACCOUNT_NUMBER + "</v16:AccountNumber>\n                <v16:MeterNumber>" + process.env.FEDEX_METER_NUMBER + "</v16:MeterNumber>\n            </v16:ClientDetail>\n            <v16:TransactionDetail>\n                <v16:CustomerTransactionId>Track By Number_v16</v16:CustomerTransactionId>\n                <v16:Localization>\n                    <v16:LanguageCode>EN</v16:LanguageCode>\n                    <v16:LocaleCode>US</v16:LocaleCode>\n                </v16:Localization>\n            </v16:TransactionDetail>\n            <v16:Version>\n                <v16:ServiceId>trck</v16:ServiceId>\n                <v16:Major>16</v16:Major>\n                <v16:Intermediate>0</v16:Intermediate>\n                <v16:Minor>0</v16:Minor>\n            </v16:Version>\n            <v16:SelectionDetails>\n                                <v16:PackageIdentifier>\n                    <v16:Type>TRACKING_NUMBER_OR_DOORTAG</v16:Type>\n                    <v16:Value>" + trackingNum.toString() + "</v16:Value>\n                </v16:PackageIdentifier>\n            <v16:ShipmentAccountNumber/>\n            <v16:SecureSpodAccount/>\n                <v16:Destination>\n                    <v16:GeographicCoordinates>rates evertitque\n                    aequora</v16:GeographicCoordinates>\n                </v16:Destination>\n            </v16:SelectionDetails>\n        </v16:TrackRequest>\n    </soapenv:Body>\n</soapenv:Envelope>";

    var requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/xml",
            "Cookie": "fdx_cbid=29869035001609553836771720484421; fdx_locale=en_US; _abck=6D47562C9E8077825492679183D8BF5B~-1~YAAQTRPorKOkl5Z2AQAAbin9wAUHfUamEwmkXiXEXuAO42qebf1d9IEv6brYNgqylUWXfK5eFk2e7lRWqvl9Nm/DnoCKsCccNhyf5IYO4zfz+VqS4n4DAkvCg3i8zp0QNEfzH6uUe9SkTSwhF23Q8Op7cq4AmOkyEP2XF2rEOw2P7mQYBPS+Qp9LO3rtY6c7zGFXP/RiMIQKV7FjdTBYV0PJR4VICZV9l+ys83Mx3YbS3ck8QaLYCIyi7btTZftlI+OTlD6FO77sMXKKR/qSLt3BY28=~-1~-1~-1; siteDC=wtc",
        },
        body: raw,
        redirect: 'follow',
        mode: 'cors'
    };

    fetch("https://ws.fedex.com:443/web-services", requestOptions)
        .then((res)=>{
            if(res.ok){
                return res.text();
            }else{
                console.log(res);
            }
        }).then(data => {
            response.json({
                xml: data,
            })
        }).catch((err) =>{
            console.log('ERROR:', err.message);
        });
});

app.get('/usps/:trackingNum', (request, response) => {
    const trackingNum = request.params.trackingNum;
    const uri = "http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=<TrackFieldRequest USERID='" + process.env.USPS_USERID + "'><TrackID ID=\"" + trackingNum.toString() + "\"></TrackID></TrackFieldRequest>";

    let requestOptions =  {
        method: 'GET',
        redirect: 'follow',
        mode: 'cors'
    };
    
    fetch(uri, requestOptions)
        .then((res)=>{
            if( res.ok){
                return res.text();
            } else {
                console.log(res);
            }
        }).then(data => {
            response.json({
                xml: data,
            })
        }).catch((err) =>{
            console.log('ERROR:', err.message);
        });
});

app.get('/ups/:trackingNum', (request, response) => {
    const trackingNum = request.params.trackingNum;

    const uri = 'https://onlinetools.ups.com/track/v1/details/' + trackingNum + '?locale=en_US';

    var requestOptions = {
        method: 'GET',
        headers: {
            'AccessLicenseNumber': process.env.UPS_ACCESS_LICENSE_NUMBER,
            'Username': process.env.UPS_USERNAME,
            'Password': process.env.UPS_PASSWORD
        },
        mode: 'cors'
    };

    fetch(uri, requestOptions).then((response) => {
            if (response.ok){
                return response.json();
            } else {
                console.log(response);
            }
    }).then((data) => {
            response.json({
                package: data.trackResponse.shipment[0].package[0],
            });
    }).catch((err) => {
            //alert("wrong");
            console.log('ERROR:', err.message);
    });
});

app.get('/dhl/:trackingNum', (request, response => {
    let trackingNum = request.params.trackingNum
    var myHeaders = new Headers();
    myHeaders.append("DHL-API-Key", process.env.DHL_KEY);

    var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
    };

    fetch("https://api-eu.dhl.com/track/shipments?trackingNumber=" + trackingNum, requestOptions)
    .then(res => {
        if (res.ok)
        {
            res.text()
        } else {
            console.log(res);
        }
    })
    .then(result => {
        result.json({
            shipment: result.shipment[0]
        })
    })
    .catch(error => {
        console.log('error', error)
    });
}));