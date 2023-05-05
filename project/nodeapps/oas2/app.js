const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const db = require('./db');
const session = require('express-session');
const app = express();
const port = 3000;
const fileUpload = require('express-fileupload');
const path = require('path')

app.use(fileUpload());
// Get images
app.use('/oas2/images', express.static(path.join(__dirname, 'images')));
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true }));
app.use(bodyParser.json());

var con = mysql.createConnection({  
 host: 'di68.brighton.domains',
 user: 'di68_oas_admin',
 password: 'Manutd0103!',
 database: 'di68_oas'
});  
con.connect(function(err) {  
    if (err) {res.send("error: "+err)}
});

app.get('/oas2', function(request, response) {
	response.sendFile(path.join(__dirname + '/index.html'));
});


// --- --- --- Index --- --- --- 

// --- --- --- Forum --- --- ---
// READ
app.get('/oas2/getforum', function(request, response) {
    const now = new Date()
    const utcMilllisecondsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
    const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000)
    
    let team = request.query.team;
    let sort = request.query.sort;
    
    let bias = request.query.bias;
    let cata = request.query.cata;
    let time = request.query.time;
    
    
    if (bias == "any"){bias = "LIKE '%'" }
    else {bias = "= "+"'"+bias+"'" }
    if (cata == "any"){cata = "LIKE '%'"}
    else {cata = "= "+"'"+cata+"'" }
    if (time = "any"){time = 0}    
    else if (time = "year"){time = (utcSecondsSinceEpoch-31536000)}
    else if (time = "month"){time = (utcSecondsSinceEpoch-2628000)}
    else if (time = "week"){time = (utcSecondsSinceEpoch-604800)}

    if (sort.includes("up")){
        sort = "DESC"
    }
    else{sort = "ASC"}
    
    let sql = "SELECT * FROM "+team + " WHERE bias "+bias+" AND cata "+cata+" AND date > "+time+" ORDER BY date "+sort
    
    con.query(sql, function (err, result) {
    if (err) {response.send({"message":sql})}
    else {
    response.send({"message":result});
    response.end();
        response.status(200)
    }

    })
});
// --- --- --- Postmaker --- --- --- 
// CREATE
app.post('/oas2/create', function(request, response) {
    const uid = request.session.identification;
    const username = request.session.username;
    const bias = request.session.team;
    const pp = request.session.pp;
    
    const now = new Date()
    const utcMilllisecondsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
    const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000)
    let filename
    
    if (!request.files || Object.keys(request.files).length === 0) {
        filename = "0"
    }
    else {
        let sampleFile;
        let uploadPath;
        
        filename = uid+"_"+utcSecondsSinceEpoch;
        sampleFile = request.files.sampleFile;
        uploadPath = __dirname + '/images/' + filename +'.png';
        
        sampleFile.mv(uploadPath, function(err) {
            if (err)
              return response.status(500).send(err);
        });
    }
    

    const forum = request.body.team;
    const cata = request.body.cata;
    
    const title = request.body.title;
	const post = request.body.post;
    
    const id = utcSecondsSinceEpoch;
    const date = utcSecondsSinceEpoch
	const imageref = filename
	const likes = 0

    var sql = `INSERT INTO ${forum} (id, uid, username, bias, date, imageref, title, post, likes, pp, cata) VALUES ("${id}", "${uid}", "${username}", "${bias}", "${date}", "${imageref}", "${title}", "${post}", "${likes}", "${pp}", "${cata}")`;
    con.query(sql, function (err, result) {
        if (err) {
            response.send("query error"+err)
        }
        else {
            response.status(200);
            response.redirect('/oas2/forum');

        }
    });
});
// --- --- --- Profile --- --- ---
// UPDATE & DELETE
app.post('/oas2/upload', async (req, res) => {
    const id = req.query.id;
    
    let sampleFile;
    let uploadPath;
    
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send(
            'No files were uploaded.'
            );
    }
    
    const now = new Date()  
    const utcMilllisecondsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)  
    const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000)
    
    const filename = id+"_"+utcSecondsSinceEpoch;
    sampleFile = req.files.sampleFile;
    uploadPath = __dirname + '/images/' + filename +'.png';
    
    sampleFile.mv(uploadPath, function(err) {
        if (err)
          return res.status(500).send(err);
    });
    var sql = "UPDATE `users` SET `pp`="+"'"+`${filename}`+"'"+"WHERE id="+`${id}`
    
    // UPDATE `users` SET `pp`= "1678742084_1678742177" WHERE `id`= 1678742084
    con.query(sql, function (err, result) {
    if (err) {res.send("query error: "+err)}
    else {
        res.end();
        res.status(200)
    }
    });
})

app.get('/oas2/info', function(request, response) {
	var id = request.session.identification;
    var sql = "SELECT * FROM users WHERE id = "+"'"+id+"'"
    
    if (request.session.loggedin) {
        con.query(sql, function (err, result) {
        if (err) {response.send({"message":"query error","message2":result})}
        else {
        response.send({"message":result});
        response.end();
            response.status(200)
        }
    
        })
    }
    else {
        response.send({"message":"login"});
    }
    
});

app.get('/oas2/logout', function(request, response) {

  request.session.destroy(function(err){
     if(err){
        response.send({"message":err});
     }
     else{
        response.send({"message":"logged out"});
        response.end();
        response.status(200);
     }
  });
  response.redirect('/oas2/login');
  response.stop();
});

app.get('/oas2/getUserPosts', function(request, response) {
    const now = new Date()
    const utcMilllisecondsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
    const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000)
    
    let team = request.query.team;
    let sort = request.query.sort;
    
    let cata = request.query.cata;
    let time = request.query.time;
    
    let id = request.session.identification;
    
    if (cata == "any"){cata = "LIKE '%'"}
    else {cata = "= "+"'"+cata+"'" }
    if (time = "any"){time = 0}    
    else if (time = "year"){time = (utcSecondsSinceEpoch-31536000)}
    else if (time = "month"){time = (utcSecondsSinceEpoch-2628000)}
    else if (time = "week"){time = (utcSecondsSinceEpoch-604800)}

    if (sort.includes("up")){
        sort = "DESC"
    }
    else{sort = "ASC"}
    
    let sql = "SELECT * FROM "+team + " WHERE uid = "+id+" AND cata "+cata+" AND date > "+time+" ORDER BY date "+sort
    
    con.query(sql, function (err, result) {
    if (err) {response.send({"message":sql})}
    else {
    response.send({"message":result});
    response.end();
        response.status(200)
    }

    })
});

app.get('/oas2/deletePost', function(request, response) {
// 	let id = request.params.id;
// 	let team = request.params.team;
	let id = request.query.id;
	let team = request.query.team;
	
	let sql = "DELETE FROM "+team+" WHERE id = "+id
    
    response.send({"message":sql})

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Number of records deleted: " + result.affectedRows);
  });
});

app.get('/oas2/bias', function(request, response) {
    
        response.send({"message":"BIAS", "message2":"BIAS 2"});
        response.end();
            response.status(200)
});

app.get('/oas2/amount2', function(request, response) {
    
        // let id = request.query.id;
        // let amount =[];
        // let results = [];
        // let teamArray =["arsenal" ,"villa" ,"bournemouth" ,"brentford" ,"brighton" ,"chelsea" ,"palace" ,"everton" ,"forest" ,"fulham" ,"leicester" ,"leeds" ,"liverpool" ,"city" ,"united" ,"newcastle" ,"southampton" ,"spurs" ,"ham" ,"wolves"];
        
        // for (let i = 0; i < teamArray.length; i++) {
    	   // let sql = "SELECT * FROM "+teamArray[i]+" WHERE uid = "+id
        //     amount.push(sql);
        // }
        
        response.end();
            response.status(200)
});

app.get('/oas2/amount', function(request, response) {
	var id = request.session.identification;
	var team = request.query.team;
    var sql = "SELECT * FROM "+team+" WHERE uid = "+"'"+id+"'"
    
    con.query(sql, function (err, result) {
    if (err) {response.send({"message":"query error","message2":result})}
    else {
    response.send({"message":result});
    response.end();
    response.status(200)
    }
    })
    

});
// --- --- --- Login --- --- --- 
app.post('/oas2/auth', function(request, response) {
	var email = request.body.email;
	var password = request.body.password;
	if (email && password) {
		con.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.identification = results[0]["id"];
				request.session.username = results[0]["username"];
				request.session.email = results[0]["email"];
				request.session.team = results[0]["team"];
                request.session.pp = results[0]["pp"];
				response.redirect('/oas2/index');
			} else {
				response.send('Incorrect email and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter email and Password!');
		response.end();
	}
});

// --- --- --- Sign up --- --- --- 
app.post('/oas2/signup', function(request, response) {
	var email = request.body.email;
	var password = request.body.password;
	var username = request.body.username;
	var team = request.body.team;
	let pp = "0"
    const now = new Date()  
    const utcMilllisecondsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)  
    const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000)
    
    var sql = `INSERT INTO users (id, email, password, username, team, pp) VALUES ("${utcSecondsSinceEpoch}", "${email}", "${password}", "${username}", "${team}", "${pp}")`;
    con.query(sql, function (err, result) {
    if (err) {response.send("query error")}
    else {
        response.status(200)
    }

    });
    response.redirect('/oas2/login');
    response.end();
});



// app.get('/oas2/data', function(request, response) {
// 	var email = request.body.email;

//     var sql = "SELECT * FROM users";
//     con.query(sql, function (err, result) {
//     if (err) {response.send({"message":"query error","message2":email})}
//     else {
//     response.send({"message":result,"message2":"this "+email});
//     response.end();
//         response.status(200)
//     }

//     })
// });

// app.get('/oas2/team', function(request, response) {
//     const team = request.query.team;
//     var sql = "SELECT * FROM "+team;
//     con.query(sql, function (err, result) {
//     if (err) {response.send({"message":"query error"})}
//     else {
//     response.send({"message":result});
//     response.end();
//         response.status(200)
//     }

//     })
// });


// app.get('/oas2/profileinfo', function(request, response) {
// 	var email = request.session.email;
//     var sql = "SELECT * FROM users WHERE email = " +"'"+"dan@dan.com"+"'"
    
//     con.query(sql, function (err, result) {
//         if (err) {response.send({"message":err,"message2":email})}
//         else {
//             response.send({"message":result});
//             response.end();
//             response.status(200)
//         }

//     })
// });


app.listen(port, () => {
    console.log(`Running at http://localhost:${port}`)
})