const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const app = express();
const morgan = require("morgan");
const Blog = require("./models/blog");
const Auth = require("./models/auth");

//storing database api in url
const url = "mongodb://127.0.0.1:27017/mernprc";
app.listen(3000);

//image storage using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./Images");
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const cors = require("cors");
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// connecting node with mongodb
mongoose.connect(url, { useNewUrlParser: true });
const con = mongoose.connection;

con.on("open", () => {
  console.log("connected.....");
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.set("view engine", "ejs");
app.use("/Images", express.static("Images"));
let uid;

//redirect to signin form
app.get("/", (req, res) => {
  res.redirect("/signin");
});

//rendering signin form
app.get("/signin", (req, res) => {
  res.render("signin", { title: "Sign In" });
});

//checking auth using post method
app.post("/signin/checkout", (req, res) => {
  let x = 0;
  console.log(req.body);
  Auth.find()
    .then((result) => {
      result.forEach((item) => {
        if (
          item.email === req.body.email &&
          item.password === req.body.password
        ) {
          uid = item._id.toString();
          console.log(uid);
          x = 1;
        }
      });
      if (x) res.redirect("/blogs");
      else res.redirect("/signin");
    })
    .catch((err) => {
      console.log(err);
    });
});

//rendering signup form
app.get("/signup", (req, res) => {
  res.render("signup", { title: "Sign Up" });
});

//creation of new account and login
app.post("/signup/checkout", (req, res) => {
  const auth = new Auth(req.body);
  auth
    .save()
    .then((result) => {
      console.log(result);
      uid = result._id.toString();
      console.log(uid);
      res.redirect("/blogs");
    })
    .catch((err) => {
      console.log(err);
    });
});

//retriving all blogs in database
app.get("/blogs", (req, resp) => {
  Blog.find()
    .then((result) => {
      let arr = new Set();
      result.forEach((item) => {
        arr.add(item.location);
      });
      console.log(Array(arr));
      console.log(result);
      resp.render("index", { title: "Home", blogs: result, locs: [...arr] });
     
    })
    .catch((err) => {
      console.log(err);
    });
});

//retriving blogs of user only in database
app.get("/myblogs", (req, resp) => {
  Blog.find()
    .then((result) => {
      let arr = [];
      result.forEach((item) => {
        if (item.uid === uid) arr.push(item);
      });
      console.log(Array(arr));
      resp.render("myblogs", { title: "My Blogs", blogs: arr });
    })
    .catch((err) => {
      console.log(err);
    });
});

//retriving blogs using location as id from database
app.get("/blog/:id", (req, resp) => {
  const id = req.params.id;
  if (id === "all") resp.redirect("/blogs");
  Blog.find()
    .then((result) => {
      let arr = [];
      let set = new Set();
      result.forEach((item) => {
        if (item.location === id) arr.push(item);
        set.add(item.location);
      });
      resp.render("index", { title: "Home", blogs: arr, locs: [...set] });
    })
    .catch((err) => {
      console.log(err);
    });
});


//create a new blog and add it to the database
app.post("/blogs", upload.single("image"), (req, resp) => {
  req.body.uid = uid;
  req.body.image = req.file.filename;
  const blog = new Blog(req.body);
  blog
    .save()
    .then((result) => {
      resp.redirect("/blogs");
    })
    .catch((err) => {
      console.log(err);
    });
});

//finding blog by id and rendering update form
app.get("/blogs/update/:id", (req, res) => {
  const id = req.params.id;
  Blog.findById(id)
    .then((result) => {
      res.render("update", { title: "Update Blog", blog: result });
    })
    .catch((err) => {
      console.log(err);
    });
});

//updating the blog and modifying it in the database
app.post("/blogs/update/:id", upload.single("image"), (req, resp) => {
  console.log(req);
  const id = req.params.id;
  req.body.image = req.file.filename;
  const blog = new Blog(req.body);
  Blog.findByIdAndUpdate(id, req.body)
    .then((result) => {
      resp.redirect("/blogs");
    })
    .catch((err) => {
      console.log(err);
    });
});

//rendering the blog creation form
app.get("/blogs/create", (req, res) => {
  res.render("create", { title: "Create a new blog" });
});

//rendering the blog using blog id
app.get("/blogs/:id", (req, res) => {
  const id = req.params.id;
  Blog.findById(id)
    .then((result) => {
      res.render("details", { title: "Blog Details", blog: result, uid: uid });
    })
    .catch((err) => {
      console.log(err);
    });
});

//deleting the blog using blog id
app.delete("/blogs/:id", (req, res) => {
  const id = req.params.id;
  Blog.findByIdAndDelete(id)
    .then((result) => {
      res.json({ redirect: "/blogs" });
    })
    .catch((err) => {
      console.log(err);
    });
});

//rendering details of user using id
app.get("/myprofile", (req, resp) => {
  Auth.findById(uid)
    .then((result) => {
      resp.render("myprofile", {
        title: "My Profile",
        detail: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

//finding user by id and rendering update form
app.get("/profile_upd_form/:id", (req, res) => {
  const id = req.params.id;
  Auth.findById(id)
    .then((result) => {
      res.render("profile_update", { title: "Update Profile", dets: result });
    })
    .catch((err) => {
      console.log(err);
    });
});

//updating the user and modifying it in the database
app.post("/profile_upd/:id", (req, res) => {
  const id = req.params.id;
  Auth.findByIdAndUpdate(id, req.body)
    .then((result) => {
      res.redirect("/myprofile");
    })
    .catch((err) => {
      console.log(err);
    });
});

//delete user profile and all his blogs in database
app.delete("/profile/:id", (req, res) => {
  const id = req.params.id;

  Blog.deleteMany({ uid: id }).then((res) => console.log(res));

  Auth.findByIdAndDelete(id)
    .then((result) => {
      res.json({ redirect: "/signin" });
    })
    .catch((err) => {
      console.log(err);
    });
});

//rendering about page
app.get("/about", (req, res) => {
  res.render("about", { title: "About" });
});

// 404 page
app.use((req, res) => {
  res.status(404).render("404", { title: "404" });
});
