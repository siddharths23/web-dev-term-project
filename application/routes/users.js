var express = require("express");
var bcrypt = require("bcrypt");
const UserModel = require("../models/Users");
var router = express.Router();
var db = require("../config/database.js");
const { errorPrint, successPrint } = require("../helpers/debug/debugprinters");
/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});
router.post("/register", function (req, res, next) {
  let username = req.body.username;
  let email = req.body.email;
  let password = req.body.password;
  let cpassword = req.body.cpassword;
  //var usernameRegex = /^[a-zA-Z0-9]+$/;
  //var validuser = usernameRegex.test(username);
  /*if (validuser) {
    req.flash("error", "Please enter a valid username!");
    req.session.save((err) => {
      res.redirect("/registration");
    });
  }
  if (password != cpassword) {
    req.flash("error", "please enter matching passwords!");
    req.session.save((err) => {
      res.redirect("/registration");
    });
  } */
  UserModel.usernameExists(username)
    .then((userDoesNameExist) => {
      if (userDoesNameExist) {
        throw new UserError(
          "registration failed: username already exists",
          "/registration",
          200
        );
      } else {
        return UserModel.emailExists(email);
      }
    })
    .then((emailDoesExist) => {
      if (emailDoesExist) {
        throw new UserError(
          "registration Failed: Email already exists",
          "/registration",
          200
        );
      } else {
        return UserModel.create(username, password, email);
      }
    })
    .then((createdUserId) => {
      if (createdUserId < 0) {
        throw new UserError(
          "server error: user could not be created",
          "/registration",
          500
        );
      } else {
        successPrint("user.js --> user was created!!");
        req.flash("success", "user account has been made!");
        res.redirect("/login");
      }
    })
    .catch((err) => {
      errorPrint("user could not be made", err);
      if (err instanceof UserError) {
        errorPrint(err.getMessage());
        req.flash("error", err.getMessage());
        res.status(err.getStatus());
        res.redirect(err.getRedirectURL());
      } else {
        next(err);
      }
    });

  /*db.execute("select * from users WHERE username=?", [username])
    .then(([results, fields]) => {
      if (results && results.length == 0) {
        return db.execute("select * from users WHERE email=?", [email]);
      } else {
        throw new UserError(
          "registration failed: username already exists",
          "/registration",
          200
        );
      }
    })
    .then(([results, fields]) => {
      if (results && results.length == 0) {
        return bcrypt.hash(password, 15);
      } else {
        throw new UserError(
          "registration Failed: Email already exists",
          "/registration",
          200
        );
      }
    })
    .then(([hashedPassword]) => {
      let baseSQL =
        "INSERT INTO users (username, email, password, created) VALUES (?,?,?,now());";
      return db.execute(baseSQL, [username, email, hashedPassword]);
    })
    .then(([results, fields]) => {
      if (results && results.affectedRows) {
        console.log("user.js --> user was created!!");
        req.flash("success", "user account has been made!");
        res.redirect("/login");
      } else {
        throw new UserError(
          "server error: user could not be created",
          "/registration",
          500
        );
      }
    })
    .catch((err) => {
      errorPrint("user could not be made", err);
      if (err instanceof UserError) {
        errorPrint(err.getMessage());
        req.flash("error", err.getMessage());
        res.status(err.getStatus());
        res.redirect(err.getRedirectURL());
      } else {
        next(err);
      }
    }); */
});
router.post("/login", (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;
  /*console.log(username);
  let baseSQL = "SELECT id, username, password FROM users WHERE username=?;";
  let userId;
  db.execute(baseSQL, [username])
    .then(([results, fields]) => {
      if (results && results.length == 1) {
        let hashedPassword = results[0].password;
        userId = results[0].id;
        return bcrypt.compare(password, hashedPassword);
      } else {
        throw new UserError("Invalid username or password!", "/login", 200);
      }
    }) */
  /*if (!username) {
    req.flash("error", "Please enter a valid username!");
    req.session.save((err) => {
      res.redirect("/login");
    });
  }
  if (!password) {
    req.flash("error", "Please enter a valid password!");
    req.session.save((err) => {
      res.redirect("/login");
    });
  } */
  UserModel.authenticate(username, password)
    .then((loggedUserId) => {
      if (loggedUserId > 0) {
        successPrint("User ${username} is logged in");
        req.session.username = username;
        req.session.userId = loggedUserId;
        res.locals.logged = true;
        req.flash("success", "you have been successfully Logged in!");
        res.redirect("/");
      } else {
        throw new UserError("Invalid username or password!", "/login", 200);
      }
    })
    .catch((err) => {
      errorPrint("user login failed");
      if (err instanceof UserError) {
        errorPrint(err.getMessage());
        req.flash("error", err.getMessage());
        res.status(err.getStatus());
        res.redirect("/login");
      } else {
        next(err);
      }
    });
});
router.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      errorPrint("session cannot be destroyed");
      next(err);
    } else {
      successPrint("session was destroyed");
      res.clearCookie("csid");
      res.json({ status: "OK", message: "user is logged out" });
    }
  });
});
module.exports = router;
