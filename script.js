var mysql = require("mysql");
var con = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'2006shola',
    database:'root'
});

con.query("CREATE TABLE IF NOT EXISTS student_application(passport VARCHAR(20),student_name VARCHAR(20), dob VARCHAR(20), gender VARCHAR(20), nationality VARCHAR(20), apply_class VARCHAR(20), current_school VARCHAR(20), current_grade VARCHAR(20), reading_level VARCHAR(20), parent_name VARCHAR(20), parent_phone VARCHAR(20), parent_occupation VARCHAR(20),address VARCHAR(20), allergies VARCHAR(100), medical_conditions VARCHAR(100), medications VARCHAR(100), declaration VARCHAR(20), permission VARCHAR(20))", (err, res)=>{
    if(err){
        console.log(err.message);
    }
    console.log("db created");
})
// con.query("CREATE TABLE IF NOT EXISTS staff_application(email VARCHAR(20), phone VARCHAR(20), address VARCHAR(50), dob VARCHAR(20), nationality VARCHAR(20), formal_position VARCHAR(70), formal_place_work VARCHAR(100), startDate VARCHAR(20), endDate VARCHAR(20), currentlyWorking VARCHAR(20), responsibilities VARCHAR(100), highestQualification VARCHAR(100),institutionName VARCHAR(100), graduationYear VARCHAR(20), certifications VARCHAR(200), teachingExperience VARCHAR(100), subjects VARCHAR(100), previousRoles VARCHAR(100), coverLetter VARCHAR(500),consent VARCHAR(20), cv VARCHAR(500))", (err, res)=>{
//     if(err){
//         console.log(err.message);
//     }
//     console.log("db created");
// })