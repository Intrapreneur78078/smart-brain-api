const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const PORT = process.env.PORT;
app.use(bodyParser.json());
app.use(cors());
const knex = require("knex");
const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    port: 5432,
    user: "postgres",
    password: "17.DEc.2003",
    database: "smartbrain",
  },
});
db.select("*")
  .from("users")
  .then((data) => console.log(data));
app.get("/", (req, res) => {
  res.json("Everything is working");
});
app.post("/signin", (req, res) => {
    const {email,password} = req.body;
    if(!email || !password){
        return res.status(400).json('Incomplete Credentials')
    }
  db.select('email','hash').from('login')
  .where("email","=",email)
  .then(data=>{
      const isValid = bcrypt.compareSync(password,data[0].hash)
      if(isValid){
          return db.select('*').from('users')
          .where('email','=',email)
          .then(user=>{
              res.json(user[0]) 
          })
          .catch(err => res.status(400).json('unable to get user'))
      }
      else{
          res.status(400).json('wrong credentials')
      }
  })
  .catch(err => res.status(400).json('wrong credentials'))
})
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  if(!name || !email || !password){
      return res.status(400).json('Incomplete Credentials')
  }
  const hash = bcrypt.hashSync(password);
  db.transaction((trx) => {
    trx
      .insert({
        hash: hash,
        email: email,
      })
      .into("login")
      .returning("email")
      .then((loginEmail) => {
        return trx("users")
          .returning("*")
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date(),
          })
          .then((user) => {
            res.json(user[0]);
          });
      })
      .then(trx.commit)
      .catch(trx.rollback)
  }).catch((err) => res.status(400).json("unable to register"));
});
app.get("/profile/:id", (req, res) => {
  const { id } = req.params;
  // let found = false;
  db.select("*")
    .from("users")
    .where({ id: id })
    .then((user) => {
      if (user.length) {
        console.log(user);
        res.json(user[0]);
      } else {
        res.status(400).json("Not Found");
      }
    })
    .catch((err) => res.status(400).json("Error"));
  // if(!found){
  //     res.status(404).json('Not Found')
  // }
});
app.put("/image", (req, res) => {
  const { id } = req.body;
  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then((entries) => res.json(entries[0]))
    .catch((err) => res.status(400).json("Error"));
});

// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });
app.listen(PORT || 3000);
