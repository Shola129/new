const express = require("express");
const mysql = require("mysql");
const bodyparser = require("body-parser");
// const bcrypt = require("bcrypt");
const cookieParser=require('cookie-parser');
const multer = require("multer");
    require("dotenv").config();
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(bodyparser.urlencoded({extended:false}));
app.use(express.static("Public"));

app.get("/", (req, res)=>{
    res.sendFile(__dirname+'/Public/index.html');
})
app.get('/login', (req, res)=>{
    res.sendFile(__dirname+"/Public/Login/login.html");
})
app.get("/register", (req, res)=>{
    res.sendFile(__dirname+"/Public/Create-Account/Admin-reg.html");
})
app.get("/opt,", (req, res)=>{
    res.sendFile(__dirname+"/Public/otp.html");
});

app.get("/student", (req, res)=>{
    res.sendFile(__dirname+"/Public/Create-Account/addstudent.html")
})

app.get('/staff-login', (req, res)=>{
    res.sendFile(__dirname+'/Public/Login/staff-login.html');
})

app.get('/student-login', (req, res)=>{
    res.sendFile(__dirname+'/Public/Login/student-login.html');
})

app.get('/Admin-login', (req, res)=>{
    res.sendFile(__dirname+'/Public/Login/Admin-login.html');
})
//Upload file or images 
const storageVar = multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null, 'Public/uploads/');
    },
    filename:(req, file, cb)=>{
        cb(null, Date.now() +"_" + file.originalname);
    }
})
const fileFilterVar = (req, file, cb)=>{
    if(file.mimetype.startsWith('image/')){
        cb(null, true);
    }
    else{
        cb(new Error("only images allowed"), false);
    }
}
const upload = multer({
    storage:storageVar,
    limits:{fileSize:30*1024*1024},
    fileFilter:fileFilterVar
});

 const con = mysql.createConnection({
        host:process.env.SERVER_HOST,
        user:process.env.SERVER_USER,
        password:process.env.SERVER_PASSWORD,
        database:process.env.SERVER_DATABASE
    });

//Registration portal for admin
app.post("/registeradmin", upload.single('upload'), async(req, res)=>{
    if(!req.file){
        res.send('Select image');
        return console.log("error: 401");   
    }
    else{
        const imagePathToSa = req.file.filename;
        const {email, name,member, phone,position, passkey, password, permit} = req.body;
    console.log(email, name,member, phone, position, passkey, password);
    // const hash = bcrypt.hashSync(pass, 10);
   if(!email || !name || !member || !phone || !position || !passkey || !password || !permit){
    return res.status(400).send("please enter all required fields.");
   }
    try{
        // check for name if exist 
        const selectQuery = "SELECT * FROM admin_data WHERE name=?";
        con.query(selectQuery, [name], (errorMonitor, result)=>{
            if(errorMonitor){
                console.log(err.message);
                return res.status(500).send('Database error during selct');
            }
            if(result.length > 0){
                 console.log("user already exist");
                return res.status(409).send('User already exist');
            }
            else{
                 //authentication
            const getpass = "SELECT * FROM passkey WHERE passkey=?";
                con.query(getpass,[passkey], (err, passre)=>{
                if(err){
                    console.log(err.message);
                    return res.status(500).send('Database error during getting passkey');
                }
                else if(passre.length<1){
                        console.log("permission denied");
                        res.sendFile(__dirname+'/Public/index.html')
                            return res.status(409).send('permission denied');
                }
                 else{
                    //insert to database
                    const insertQuery = 'INSERT INTO admin_data(profile,email, name, member, phone,  position, password, passkey, permit)VALUES(?,?,?,?,?,?,?,?,?)';
                    con.query(insertQuery, [imagePathToSa, email, name, member, phone, position, password, passkey, !permit], (err, insertResult)=>{
                        if(err){
                            console.log(err.message);
                            return res.status(500).send('Database error during insert');
                        }
                        else{
                             res.status(201).send('User regsitration successfully');
                             return  res.sendFile(__dirname+'/login/Adin-login.html');
                        }
                    });
            }
                });
            }
        });
    }
    catch(error){
        res.status(500).send('server error.');
    }
    }
})

// Login for student portals
app.post('/student-login', (req, res)=>{
    const {id, password} = req.body;
    console.log(id, password);
    if(!id || !password){
        return res.status(400).json();
    }
    try{
        const studentLogin = "SELECT * FROM student_data WHERE Admission_number=? AND password=?";
        con.query(studentLogin, [id, password], (err, result)=>{
            if(err){
                console.log(err.message);
            }
            if(result.length > 0){
                 return res.status(200).json(JSON.stringify(result[0])); 
            }
            else{
                console.log('Admission number or passowrd not found');
                return res.status(404).json();
            }
        })
    }
    catch(error){
        res.status(500).send('server error.');
    }
})


//login for staff
app.post('/staff-login', (req, res)=>{
    const {email, password} = req.body;
    console.log(email, password);
    if(!email || !password){
        return res.status(400).json()
    }
    try{
        const studentLogin = "SELECT * FROM staff_data WHERE email=? AND password=?";
        con.query(studentLogin, [email, password], (err, result)=>{
            if(err){
                console.log(err.message);
            }
            if(result.length > 0){
                   return res.status(200).json(JSON.stringify(result[0]));
            }
            else{
                return res.status(404).json();
            }
        })
    }
    catch(error){
        console.log(error.message);
    }
});

 // login for admin portal
 app.post('/Admin-login', (req, res)=>{
     const {email, password, passkey} = req.body;
    // console.log(email, password, passkey);
     if(!email || !password || !passkey){
         return res.status(400).json()
     }
     try{
         const studentLogin = "SELECT * FROM admin_data WHERE email=? AND password=? AND passkey=?";
         con.query(studentLogin, [email, password, passkey], (err, result)=>{
             if(err){
                 console.log(err.message);
             }
             if(result.length > 0){
                return res.status(200).json(JSON.stringify(result[0]));
             }
             else{
                 res.status(404).json();
             }
         })
     }
     catch(error){
         res.status(500).send('server error.');
     }
 });


//create account for student portal
app.post('/createstudent', upload.single('profile'),(req, res)=>{
    console.log(req.file);
    if(!req.file){
       return console.log("error: 401");
    }
    else{
        const imagePathToSave = req.file.file;
        console.log(req.file.path);
        console.log("uploads profile pic successful");
        const {name, Admission_number, dob, gender, nationality, email, phone, address, current_class, class_teacher, admission_date, guardian_name, relationship,guardian_phone, guardian_email,occupation,emergency_contact,emergency_relationship,emergency_phone, medical, cure, type_program}= req.body;
        console.log(name, Admission_number, dob, gender, nationality, email, phone, address, current_class, class_teacher, admission_date, guardian_name, relationship,guardian_phone, guardian_email,occupation,emergency_contact,emergency_relationship,emergency_phone, medical, cure, type_program);
        if(!name || !Admission_number || !dob || !gender || !nationality || !email || !phone || !address || !current_class ||  !class_teacher || !admission_date || !guardian_name || !relationship || !guardian_phone || !guardian_email || !occupation || !emergency_contact || !emergency_relationship || !emergency_phone || !medical || !cure || !type_program){
              return res.send("all field requred");
        }
        try{
             const selectAd = "SELECT * FROM student_data WHERE Admission_number=?";
             con.query(selectAd, [Admission_number], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                if(result.length > 0){
                    console.log("student already exist");
                    return res.status(409).send('User already exist');
                }
                else{
                    const insertData = "INSERT INTO student_data(profile, name, Admission_number, dob, gender, nationality, email, phone, address, current_class, class_teacher, admission_date, guardian_name, relationship,guardian_phone, guardian_email,occupation,emergency_contact,emergency_relationship,emergency_phone, medical, cure, password, type_program)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
                    con.query(insertData, [imagePathToSave, name, Admission_number, dob, gender, nationality, email, phone, address, current_class, class_teacher, admission_date, guardian_name, relationship,guardian_phone, guardian_email,occupation,emergency_contact,emergency_relationship,emergency_phone, medical, cure, name,type_program], (err, resultStudent)=>{
                        if(err){
                          return console.log(err.message);
                        }
                        console.log("account created successful");
                        return res.status(200).json();
                    } )
                }
             })
            }
        catch(error){
                res.status(500).send('server error.');
                console.log(error.message);
        }
    }
})
//create account for staff portal
app.post("/createstaff", upload.single('profile'), (req, res)=>{
    if(!req.file){
        return console.log("error: 401");
    }
    else{
        const saveProfilePath = req.file.filename;
        console.log(req.file);
        const {name, email, workplace, subject, position, class_head, status, joined, relative_phone, personal_phone, work_type, password, qualification, institution, graduation_year, address, teacher_id} = req.body;
        console.log(name, email, workplace, subject, position, class_head, status, joined, relative_phone, personal_phone, work_type, password, qualification, institution, graduation_year, address, teacher_id);
        if(!name || !email || !workplace || !subject || !position || !class_head || !status || !joined || !relative_phone || !personal_phone || !work_type || !password || !qualification || !institution || !graduation_year || !address, !teacher_id){
             return res.send("all field requred");
        }
        try{
            const selstaff = "SELECT * FROM staff_data WHERE email=?";
            con.query(selstaff, [email], (err, resultSel)=>{
                if(err){
                    return console.log(err.message);
                }
                if(resultSel.length > 0){
                    return res.send("User already exist");
                }
                else{
                    const insertStaff = "INSERT INTO staff_data(profile, name, email, formal_work, subject, position, class_head, status, time_joined, relative_phone, personal_phone, work_type, password, qualification, institution, graduation_year, address, teacher_id)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
                    con.query(insertStaff, [saveProfilePath, name, email, workplace, subject, position, class_head, status, joined, relative_phone, personal_phone, work_type, password, qualification, institution, graduation_year, address, teacher_id], (err, resultInserData)=>{
                        if(err){
                            return console.log(err.message);
                        }
                        else{
                            res.status(200).json();
                        }
                    });

                    const storeStaff = "INSERT INTO store_teachers_data(profile, name, email, formal_work, subject, position, class_head, status, time_joined, relative_phone, personal_phone, work_type, password, qualification, institution, graduation_year, address, teacher_id)VALUES(?,?,?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
                    con.query(storeStaff, [saveProfilePath, name, email, workplace, subject, position, class_head, status, joined, relative_phone, personal_phone, work_type, password, qualification, institution, graduation_year, address, teacher_id], (err2, result2)=>{
                        if(err2){
                            console.log(err2);
                        }
                        else{
                            return res.status(200).json();
                        }
                    })
                }
            })
        }
        catch(error){
                res.status(500).send('server error.');
                console.log(error.message);
        }
    }
})

app.post('/Admin-info', (req, res)=>{
        const {email} = req.body;
        console.log(email);
        if(!email){
            res.status(401).json();
        }
        else{
            const qry = "SELECT * FROM admin_data WHERE email=?";
            con.query(qry, [email], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result[0]));
                }
            })
        }
});

app.post('/principal-info', (req, res)=>{
       try{
            const {email} = req.body;
            console.log(email);
            if(!email){
                res.status(401).json();
            }
            else{
                const qry = "SELECT * FROM hod_hm WHERE email=?";
                con.query(qry, [email], (err, result)=>{
                    if(err){
                        console.log(err.message);
                    }
                    if(result.length > 0){
                        // console.log(result[0]);
                        res.status(200).json(JSON.stringify(result[0]));
                    }
                })
            }
        }
       catch(err){
        console.log(err.message);
       }
})


//display student id on the admin dashbord
app.post('/get-student-info-by-id', (req, res)=>{
    const {Admission_number} = req.body;
    // console.log(Admission_number);
    if(!Admission_number){
        res.status(400).json("data empty");
    }
    else{
        try{
            const qry = "SELECT * FROM student_data WHERE admission_number=?";
            con.query(qry, [Admission_number], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result[0]));
                    // console.log(result[0]);
                }
                else if(result.length < 1){ 
                    res.status(404).json();
                }
            })
        }
        catch(err){
            console.log(err.message);
        }
    }
});

app.post('/get-all-student-info-by-id', (req, res)=>{
    const {Admission_number} = req.body;
    console.log(Admission_number);
    if(!Admission_number){
        res.status(400).json("data empty");
    }
    else{
        try{
            const qry = "SELECT * FROM student_data WHERE admission_number=?";
            con.query(qry, [Admission_number], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result[0]));
                    // console.log(result[0]);
                }
                else if(result.length < 1){ 
                    res.status(404).json();
                }
            })
        }
        catch(err){
            console.log(err.message);
        }
    }
});

//searching for the own class 
app.post('/student-profile-class', (req, res)=>{
    const {classes} = req.body;
    // console.log(classes);
    if(!classes){
        res.status(400).json();
    }
    else{
        try{
            const qry = "SELECT * FROM student_data WHERE current_class=?";
            con.query(qry, [classes], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                if(result.length > 0){
                    // console.log(result);
                     return res.status(200).json(JSON.stringify(result));
                }
                else{
                    res.status(404).json();
                }
            })
        }
        catch(error){
            console.log(error.message);
        }
    }
});

//display all the teacher info 
app.post('/teacher-info', (req, res)=>{
    // const {Data} = req.body;
    try{
        const qry = "SELECT * FROM store_teachers_data";
        con.query(qry, (err, result)=>{
            if(err){
                console.log(err);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }
    catch(err){
        console.log(err.message);
    }
});
//updateing of student account

//deleting of teacher from the first db

//transcation history
app.post('/last-20-transcation', (req, res)=>{
    const {offset, limit} = req.body;
    // console.log(offset, limit)
    let offSetToUse;
    if(offset!==''){
        offSetToUse=offset;
    }
    else{
        offSetToUse=parseInt(offset)+parseInt(limit);
    }
    try{
        const qry = `SELECT * FROM transcation ORDER BY id DESC LIMIT ${limit}  OFFSET ${offset}`;
        con.query(qry, (error, result)=>{
            if(error){
                console.log(error.message);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }
    catch(err){
        console.log(err.message);
    }
})

//transcation for a particular day

app.post('/transcation-day', (req, res)=>{
    const {date} = req.body;
    console.log(date);
    if(!date){
        res.status(400).json();
    }
    else{
        try{
            const qry = "SELECT * FROM transcation WHERE date=?";
            con.query(qry, [date], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                }
                else{
                    return res.status(404).json();
                }
            })
        }
        catch(error){
            console.log(error.message);
        }
    }
})

//transcation for a particular term or session
app.post('/particular-term-and-session', (req, res)=>{
    const {session , term , week} = req.body;
    if(!session){
        res.status(400).json();
    }
    else{
      const qry = "SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
      con.query(qry, [session, term, week], (err, result)=>{
            if(err){
                console.log(err.message);
            }
             if(result.length > 0){
                     res.status(200).json(JSON.stringify(result));
            }
            else{
                res.status(404).json();
            }
      })   
    }
});

app.post('/dened-staff-access', (req, res)=>{
    const {email} = req.body;
    // console.log(email);
    if(!email){
        return res.status(400).json();
    }
    else{
        try{
            const qry = "DELETE FROM staff_data WHERE email=?";
            con.query(qry, [email], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                if(result.length < 1 || result.length===0){
                    return res.status(404).json({success:false, message:'Record not found'});
                }
                else{
                    return res.status(200).json({success:true, message:'Record deleted successfully', result:`${result}`});
                }
            })
        }
        catch(err){
            console.log(err.message);
        }
    }
})

//expenses history
app.post('/last-20-expenses', (req, res)=>{
    try{
        const offset=0;
        const limit =50;
        const qry = `SELECT * FROM expenses ORDER BY id DESC LIMIT 3`;
        con.query(qry, (error, result)=>{
            if(error){
                console.log(error.message);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }
    catch(err){
        console.log(err.message);
    }
})

//expenses for a particular day
app.post('/expenses-for-a-particular-day', (req, res)=>{
    const {date} = req.body;
    if(!date){
        res.status(400).json();
    }
    else{
        try{
            const qry = "SELECT * FROM expenses WHERE date=?";
            con.query(qry, [date], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                }
                else{
                    return res.status(404).json();
                }
            })
        }
        catch(error){
            console.log(error.message);
        }
    }
})

//expenses for a particular term or session or week
app.post('/expenses-particular-term-and-session', (req, res)=>{
    const {session , term} = req.body;
  
        // res.status(400).json();
 
      const qry = "SELECT * FROM expenses WHERE session=? AND term=?";
      con.query(qry, [session, term], (err, result)=>{
            if(err){
                console.log(err.message);
            }
            if(result.length > 0){
                res.status(200).json(JSON.stringify(result));
            }
            else{
                res.status(402).json();
            }
      })   
    
});

//blacklist report by admin

app.post('/submit-report', (req, res)=>{
    const {report_type, student_name, student_id, student_class, date, description, approval_by, approval_name} = req.body;
    // console.log(report_type, student_name, student_id, student_class, date, description, approval_by, approval_name);
    if(!report_type || !student_name || !student_id || !student_class || !date || !description || !approval_by || !approval_name){
        return res.status(400).json({message:'all field required'});
    }
    else{
        const qry = "INSERT INTO black_list_record(student_id, name, class, date, description, approval_position, approval_name, cime_type)VALUES(?,?,?,?,?,?,?,?)";
        con.query(qry, [student_id, student_name, student_class, date, description, approval_by, approval_name, report_type], (err, result)=>{
            if(err){
                console.log(err.message);
            }
            return res.status(200).json();
        })
    }
});

app.post('/total-income', (req, res)=>{
    try{
        const qry = "SELECT * FROM transcation";
        con.query(qry, (err, result)=>{
            if(err){
                console.log(err.message);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }   
    catch(err){
        console.log(err.message);
    }
});


app.post('/total-spent', (req, res)=>{
    try{
        const qry = "SELECT * FROM expenses";
        con.query(qry, (err, result)=>{
            if(err){
                console.log(err.message);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }   
    catch(err){
        console.log(err.message);
    }
});

app.post('/report', (req, res)=>{
    // ER_WRONG_VALUE_COUNT_ON_ROW: Column count doesn't match value count at row 1 so I added teacher5 and teacher5_remark to the database table

    const {name, title, teacher_id,date, class1, class1_num, class2, class2_num, class3, class3_num, class4, class4_num, class5, class5_num, complaints, teacher1, teacher1_remark, teacher2, teacher2_remark, teacher3, teacher3_remark, teacher4, teacher4_remark,  department, comment ,teacher5 ,teacher5_remark} = req.body;
      console.log(name, title, teacher_id,date, class1, class1_num, class2, class2_num, class3, class3_num, class4, class4_num, class5, class5_num, complaints, teacher1 ,teacher1_remark ,teacher2 ,teacher2_remark ,teacher3 ,teacher3_remark ,teacher4 ,teacher4_remark ,teacher5 ,teacher5_remark ,department, comment);
    const qry = "INSERT INTO report(name,title ,teacher_id,date,class1,class1_num,class2,class2_num,class3,class3_num,class4,class4_num,class5,class5_num ,complaints ,teacher1 ,teacher1_remark ,teacher2 ,teacher2_remark ,teacher3 ,teacher3_remark ,teacher4 ,teacher4_remark ,department  ,comment  ,teacher5  ,teacher5_remark)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        con.query(qry,[name,title ,teacher_id,date,class1,class1_num,class2,class2_num,class3,class3_num,class4,class4_num,class5,class5_num ,complaints ,teacher1 ,teacher1_remark ,teacher2 ,teacher2_remark ,teacher3 ,teacher3_remark ,teacher4 ,teacher4_remark ,department  ,comment  ,teacher5  ,teacher5_remark], (err,result)=>{
            if(err){
                console.log(err.message);
            }
            else{
                res.status(200).json();
            }
        })
});

app.post('/hod-hm-info', (req, res)=>{
    const {email, position} = req.body;
    console.log(email, position);
    if(!email||!position){
        res.status(400).json();
    }
    else{
        const qry = "SELECT * FROM hod_hm WHERE email=? AND position=?";
        con.query(qry, [email, position], (err, result)=>{
            if(err){
                console.log(err.message);
            }
            if(result.length > 0){
                res.status(200).json(JSON.stringify(result[0]));
            }
            else{
                res.status(404).json();
            }
        })
    }
})



//login for hod's and hm
app.post('/hod-hm-login', (req, res)=>{
    const {email, password, position} = req.body;
    console.log(email, password, position);
    if(!email || !password, !position){
        res.status(400).json();
    }
    else{
        const qry = 'SELECT * FROM hod_hm WHERE email=? AND password=? AND position=?';
        con.query(qry, [email, password, position], (err, result)=>{
            if(err){
                console.log(err.message);
            }
            if(result.length > 0){
                return res.status(200).json(JSON.stringify(result[0]));
            }
            else{
                return res.status(404).json();
            }
        })
    }
});
//register for hod, supervisor, hm, principal, vise-principal 
app.post('/hod-hm-register', upload.single('upload'), (req, res)=>{
     const saveProfilePath = req.file.filename;
    const {name, position, phone, email, permit, member, password, qualification, year_services, teacher_id} = req.body;
    console.log(name, position, phone, email, permit, member, password, qualification, year_services, teacher_id);
    if(!name || !position || !phone || !email || !permit|| !member|| !password ||!qualification || !year_services || !teacher_id){
        res.status(400).json();
    }
    else{
        try{
            const qry ="SELECT * FROM hod_hm WHERE email=? AND position=?";
            con.query(qry, [email, position], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                if(result.length > 0){
                    return res.status(403).json();
                }
                else{
                    const insert ="INSERT INTO hod_hm(profile, name, position, phone, email, approval,member_since, password,qualification, year_services, teacher_id)VALUES(?,?,?,?,?,?,?,?,?,?,?)";
                    con.query(insert, [saveProfilePath, name, position, phone, email, permit, member, password, qualification, year_services], (err, result)=>{
                        if(err){
                            console.log(err.message);
                        }
                        else{
                           return res.status(200).json();
                        }
                    })
                }
            })
        }
        catch(err){
            console.log(message.err);
        }
    }
});

app.post('/senior-hod-report', (req, res)=>{
    const {department}=req.body;
    try{
        const qry  = "SELECT * FROM report WHERE department=? ORDER BY id DESC";
        con.query(qry, [department], (err, result)=>{
            if(err){
                console.log(err.message);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }
    catch(err){
        console.log(err.message);
    }
});

app.post('/junior-hod-report', (req, res)=>{
    const {department}=req.body;
    try{
        const qry  = "SELECT * FROM report WHERE department=? ORDER BY id DESC";
        con.query(qry, [department], (err, result)=>{
            if(err){
                console.log(err.message);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }
    catch(err){
        console.log(err.message);
    }
});

app.post('/primary-hm-report', (req, res)=>{
    const {department}=req.body;
    try{
        const qry  = "SELECT * FROM report WHERE department=? ORDER BY id DESC";
        con.query(qry,[department], (err, result)=>{
            if(err){
                console.log(err.message);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }
    catch(err){
        console.log(err.message);
    }
});

app.post('/pre-primary-hm-report', (req, res)=>{
    const {department}=req.body;
    try{
        const qry  = "SELECT * FROM report WHERE department=? ORDER BY id DESC";
        con.query(qry, [department],  (err, result)=>{
            if(err){
                console.log(err.message);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }
    catch(err){
        console.log(err.message);
    }
});

app.post('/total-student', (req, res)=>{
    try{
        const qry = "SELECT * FROM student_data";
        con.query(qry, (err, result)=>{
            if(err){
                console.log(err.message);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }
    catch(err){
        console.log(err.message);
    }
})

app.post('/total-staff', (req, res)=>{
    try{
        const qry = "SELECT * FROM store_teachers_data";
        con.query(qry, (err, result)=>{
            if(err){
                console.log(err.message);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }
    catch(err){
        console.log(err.message);
    }
});

app.post('/report-all', (req, res)=>{
    const {date, department} = req.body;
    // console.log(date, department);
    if(!date || !department){
        res.status(400).json();
    }
    else{
        try{
            const qry = "SELECT * FROM report WHERE date=? AND department=?";
            con.query(qry, [date,department], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result[0]));
                    // console.log(result[0]);
                }
                else if(result.length < 1){ 
                    res.status(404).json();
                }
            })
        }
        catch(err){
            console.log(err.message);
        }
    }
});

app.post('/bursar-info', (req, res)=>{
    const {email} = req.body;
    // console.log(email);
    if(!email){
        return res.status(400).json();
    }
    else{
        try{
            const qry = "SELECT * FROM staff_data WHERE email=?";
            con.query(qry, [email], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                else{
                    res.status(200).json(JSON.stringify(result[0]));
                }
            })
        }
        catch(err){
            console.log(err.message);
        }
    }
})

//insert payment transcation into db

app.post('/payment-income', (req, res)=>{
    const {name, admission_number, category, description, classes, paymentMethod, party, receiver, amount, type, date, session, term, week, Surbordinate_name, time, transaction_id} = req.body;
    // console.log(name, admission_number, category, description, classes, paymentMethod, party, receiver, amount, type, date, session, term, week, Surbordinate_name, transaction_id);
    if(!name || !admission_number || !category || !description || !classes || !paymentMethod || ! party || !receiver || !amount || !type ||!date || !session || !term || !week || !Surbordinate_name || !transaction_id){
        return res.status(400).json();
    }
    else{
        try{
            const check = "SELECT * FROM student_data WHERE Admission_number=? AND name=?";
            con.query(check, [admission_number, name, classes], (err, resultCheck)=>{
                if(err){
                    console.log(err.message);
                }
                if(resultCheck.length > 0){
                    const insert = "INSERT INTO transcation(name, admission_number, category, description, class, method,  sender, receiver, amount, type, date, session, term, week, Surbordinate, time, transaction_id)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
                    con.query(insert, [name, admission_number, category, description, classes, paymentMethod, party, receiver, amount, type, date, session, term, week, Surbordinate_name, time, transaction_id], (err, resultInsert)=>{
                        const dataToReturn = {
                            date:date,
                            transaction_id:transaction_id,
                            time:time
                        }
                        if(err){
                            console.log(err.message);
                        }
                        else{
                            // console.log(resultInsert[0]);
                            return res.status(200).json(JSON.stringify(dataToReturn));
                        }
                    })
                }
                else{
                    return res.status(404).json();
                }
            })
        }
        catch(err){
            console.log(err.message);
        }
    }
});

app.post('/OutCome-payment', upload.single('receipt'), (req, res)=>{
     const saveReceipt = req.file;
    //  console.log(saveReceipt);
     const receiptName = saveReceipt.filename;
     const {type, amount, party, category, description, transaction_id, time, date, session, term, week, receiver, approval, method, surbordinate_name} = req.body;
    //  console.log(type, amount, party, category, description, transaction_id, time, date, session, term, week, receiver, approval);
     if(!type || !amount || !party || !category || !description || !transaction_id || !time || !date  || !session || !term || !week || !receiver || !approval || !method){
        res.status(400).json();
     }
     else{
        try{
            const qry = "INSERT INTO expenses(type, amount, party, category, description, transaction_id, time, date, session, term, week, receiver, approval, method, surbordinate, receipt)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
            con.query(qry, [type, amount, party, category, description, transaction_id, time, date, session, term, week, receiver, approval, method, surbordinate_name ||'none', receiptName], (err, result)=>{
                const dataToReturn = {
                            date:date,
                            transaction_id:transaction_id,
                            time:time
                        } 
                if(err){
                    console.log(err.message);
                 }
                 
                 else{
                    res.status(200).json(JSON.stringify(dataToReturn));
                 }
            })
        }
        catch(err){
            console.log(err.message);
        }
     }
});

app.post('/generate-receipt', (req, res)=>{
    const {transaction_id, type} = req.body;
    // console.log(transaction_id, type);
    if(!transaction_id || !type){
        return res.status(400).json();
    }
    else{
        try{
            const query = "SELECT * FROM transcation WHERE transaction_id=? AND type=?";
            con.query(query, [transaction_id, type], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                if(result.length > 0){
                    return res.status(200).json(JSON.stringify(result[0]));
                }
            })
        }
        catch(err){
            console.log(err);
        }
    }
})


app.post('/generate-receipt-outcome', (req, res)=>{
    const {transaction_id, type} = req.body;
     console.log(transaction_id, type);
    if(!transaction_id || !type){
        return res.status(400).json();
    }
    else{
        try{
            const query = "SELECT * FROM expenses WHERE transaction_id=? AND type=?";
            con.query(query, [transaction_id, type], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                if(result.length > 0){
                    return res.status(200).json(JSON.stringify(result[0]));
                }
            })
        }
        catch(err){
            console.log(err);
        }
    }
});

app.post('/transaction-record', (req, res)=>{
    const {classes, session, term} = req.body;
    // console.log(classes, session, term);
    if(!classes || !session || !term){
        res.status(400).json();
    }
    else{
        const qry ="SELECT * FROM student_data WHERE current_class=?";
        con.query(qry, [classes], (err, result)=>{
            if(err){
                console.log(err.message);
            }
            if(result.length > 0){
                res.status(200).json(JSON.stringify(result));
            }
            else{
                res.status(404).json();
            }
        })
    }
});

app.post('/get-transaction', (req, res)=>{
    const {admission_number, session, term} = req.body;
    console.log(admission_number, session, term);
    if(!admission_number || !session || !term){
        res.status(400).json();
    }
    else{
        const qry = "SELECT * FROM transcation WHERE admission_number=? AND session=? AND term=?";
        con.query(qry, [admission_number, session, term], (err, result)=>{
            if(err){
                console.log(err.message);
            }
            if(result.length > 0){
                res.status(200).json(JSON.stringify(result));
            }
            else{
                res.status(404).json();
            }
        })
    }
});

app.post('/set-fees', (req, res)=>{
    const {fees_name, fees_value, session, classes, term, description} =req.body;
    // console.log(fees_name, fees_value, session, classes, term, description);
    
    if(!fees_name || !fees_value || !session || !classes || !term){
        res.status(400).json();
    }
    else{
        try{
            const qry ="INSERT INTO set_fees(fees_name, fees_value, session, classes, term, description)VALUES(?,?,?,?,?,?)";
            con.query(qry, [fees_name, fees_value, session, classes, term, description], (err, result)=>{
                if(err){
                    console.log(err);
                }
                else{
                    res.status(200).json();
                }
            })
        }
        catch(err){
            console.log(err.message);
        }
    }
});


app.post('/get-all-fees', (req, res)=>{
    try{
        const qry ="SELECT * FROM set_fees";
        con.query(qry, (err, result)=>{
            if(err){
                console.log(err);
            }
            {
                res.status(200).json(JSON.stringify(result));
            }
        })
    }
    catch(err){
        console.log(err);
    }
});

app.post('/get-specific-class', (res, req)=>{
    const {classes} = req.body;
    console.log(classes);
    if(!classes){
        res.status(400).json();
    }
    else{
        try{
            const qry = "SELCET * FROM set_fees WHERE class=?";
            con.query(qry, [classes], (err, result)=>{
                if(err){
                    console.log(err.message);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result[0]));
                }
                else{
                    res.status(404),json();
                }
            })
        }
        catch(err){
            console.log(err.message);
        }
    }
});

app.post('/delete-set-fees', (req, res)=>{
    const {term, session, classes} = req.body;
    if(!term || !session || !classes){
        res.status(400).json(); 
    }
    else{
        const qry = "DELETE FROM set_fees WHERE term=? AND session=? AND classes=?";
        con.query(qry, [term, session, classes], (err, result)=>{
            if(err){

            }
            else{
                res.status(200).json();
            }
        })
    }
});

app.post('/total-income-week-one', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
            con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-two', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
           con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-three', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
           con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-four', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
            con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-five', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
           con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-six', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
            con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-seven', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
           con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-eight', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
            con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-nine', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
            con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-ten', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
            con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-eleven', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
           con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-twelve', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
            con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-thirteen', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
            con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-fourteen', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
            con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
})

app.post('/total-income-week-fifteen', (req, res)=>{
    const {session, term, week} = req.body;
        if(!session || !term || !week){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=? AND week=?";
           con.query(qry, [session, term, week], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
});


app.post("/total-income-for-term", (req, res)=>{
    const {session, term} = req.body;
    // console.log(session, term);
        if(!session || !term){
            res.status(400).json();
        }
        else{
            const qry="SELECT * FROM transcation WHERE session=? AND term=?";
           con.query(qry, [session, term], (err, result)=>{
                if(err){
                    console.log(err);
                }
                if(result.length > 0){
                    res.status(200).json(JSON.stringify(result));
                    // console.log(result);
                }
                else{
                    res.status(404).json();
                }
            })
        }
});

app.post('/income-pass-code', (req, res)=>{
    const {passcode} = req.body;
    // console.log(passcode);
    if(!passcode){
        res.status(400).json()
    }
    else{
        const qry = "SELECT * FROM passkey WHERE passcode=?";
        con.query(qry, [passcode], (err, result)=>{
            if(err){
                console.log(err);
            }
            if(result.length > 0){
                // console.log('success');
                const d = {
                    success:true
                }
                return res.status(200).json(JSON.stringify(d));
                
            }
            else{
                res.status(404).json();
            }
        })
    }
});

app.post('/transaction-record-admin', (req, res)=>{
    const {classes, session, term} = req.body;
    // console.log(classes, session, term);
    if(!classes){
        res.status(400).json();
    }
    else{
        const qry ="SELECT * FROM student_data WHERE current_class=?";
        con.query(qry, [classes], (err, result)=>{
            if(err){
                console.log(err.message);
            }
            if(result.length > 0){
                res.status(200).json(JSON.stringify(result));
                // console.log(result);
            }
            else{
                res.status(404).json();
            }
        })
    }
});

app.post('/fixed-amount-particular-class-term-session', (req, res)=>{
    const {classes, session, term} = req.body;
    console.log(classes, session, term);
    if(!classes || !session || !term){
        res.status(400).json();
    }
    else{
        const qry = "SELECT * FROM set_fees WHERE classes=? AND session=? AND term=?";
        con.query(qry, [classes, session, term], (err, result)=>{
            if(err){
                console.log(err);
            }
            if(result.length > 0){
                res.status(200).json(JSON.stringify(result));
            }
            else{
                res.status(404).json();
            }
        })
    }
})

app.post('/totalAdminStaff', (req, res)=>{
    // const {Data} = req.body;
    try{
        const qry = "SELECT * FROM hod_hm";
        con.query(qry, (err, result)=>{
            if(err){
                console.log(err);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }
    catch(err){
        console.log(err.message);
    }
});

app.post('/totalActiveStaff', (req, res)=>{
    // const {Data} = req.body;
    try{
        const qry = "SELECT * FROM staff_data";
        con.query(qry, (err, result)=>{
            if(err){
                console.log(err);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }
    catch(err){
        console.log(err.message);
    }
});

app.post('/student-info', (req, res)=>{
    // const {Data} = req.body;
    try{
        const qry = "SELECT * FROM student_data";
        con.query(qry, (err, result)=>{
            if(err){
                console.log(err);
            }
            else{
                res.status(200).json(JSON.stringify(result));
            }
        })
    }
    catch(err){
        console.log(err.message);
    }
});

app.listen(process.env.PORT, ()=>{
    console.log("started");
});