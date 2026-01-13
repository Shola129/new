var mysql = require("mysql");
var con = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'2006shola',
    database:'root'
});
con.query("CREATE TABLE IF NOT EXISTS set_fees(fees_name VARCHAR(30), fees_value VARCHAR(30), session VARCHAR(10), classes VARCHAR(10), term VARCHAR(10), description VARCHAR(100))", (err, res)=>{
    if(err){
        console.log(err.message);
    }
    console.log("db created");
})