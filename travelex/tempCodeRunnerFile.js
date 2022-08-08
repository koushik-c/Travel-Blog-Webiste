
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