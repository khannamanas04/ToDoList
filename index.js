require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//creating new database
const connectDB = async ()=>{
  const conn = mongoose.connect(process.env.MONGO_URI,{useNewUrlParser:true});
}
//creating schema
const itemsSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  }
});
//Mongoose model
const Item = mongoose.model("Item",itemsSchema);
const item1 = new Item({
  name:"Welcome to TodoList"
});
const item2 = new Item({
  name:"Hit the + button to add to TodoList"
});
const item3 = new Item({
  name:" <-- Hit this to delete an item"
});

const defaultItems = [item1,item2,item3];

//Dynamic routes list
const listSchema = {
  name:String,
  items:[itemsSchema]
};

const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) {
  
  Item.find()
  .then(function(foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItems);
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.listName;
  // const item = new Item({
  //   name : itemName
  // });
 
  if(listName === "Today"){
    const item = new Item({
      name : itemName
    });
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name : listName}).then(function(foundList){
      const item = new Item({
        name : itemName
      });
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});


app.post("/delete", function(req, res){
  const checkedListName = req.body.listName;
  const checkedItemId = req.body.checkbox;

  if(checkedListName==="Today"){
    //In the default list
    del().catch(err => console.log(err));

    async function del(){
      await Item.deleteOne({_id: checkedItemId});
      res.redirect("/");
    }
  } else{
    //In the custom list

    update().catch(err => console.log(err));

    async function update(){
      await List.findOneAndUpdate({name: checkedListName}, {$pull: {items: {_id: checkedItemId}}});
      res.redirect("/" + checkedListName);
    }
  }

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
 
  List.findOne({name: customListName})
    .then(foundList => {
      if(!foundList){
 
        const list = new List({
          name: customListName,
          items: defaultItems
        });
 
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    })
    .catch((err) => {
      console.log(err);
    });
 
 
});

app.get("/about", function(req, res){
  res.render("about");
});

connectDB().then(()=>{
  app.listen(PORT, function() {
    console.log(`Server started on port ${PORT}`);
  });
})

