//jshint esversion:6
 const ejs = require("ejs");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemSchema = {
    name : String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "Cook Food"
});

const item2 = new Item({
    name: "Eat Food"
});

const defaultItems = [item1, item2];

const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req,res){

    Item.find({}, function(err, foundItems){

        if(foundItems.length=== 0){
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log("Error");
                }
                else{
                   console.log("DB Saved!");
                }
            });
            res.redirect("/");
        }
        else{
            res.render("list", {Kindofday: "Today", newListItems: foundItems});
        }
    }); 
});

app.get("/:customListName", function(req,res){
   const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err,foundList){
      if(!err){
          if(!foundList){
            const list = new List({
                name: customListName,
                items: defaultItems
            });
         
            list.save();
            res.redirect("/" + customListName);
          } else{
            res.render("list", {Kindofday: foundList.name, newListItems: foundList.items});
          }
          console.log()
      }
      else{
          console.log("Error!");
      }
  });
});

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;


    const item = new Item({
        name: itemName
    });

    if (listName === "Today"){
        item.save();
        res.redirect("/");
    }else{
     List.findOne({name: listName}, function(err, foundList){
         foundList.items.push(item);
         foundList.save();
         res.redirect("/" + listName);
     });
    }
});

app.post("/delete", function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(!err){
                console.log("Deleted");
                res.redirect("/");
            }
        });
    } else{
     List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}}, function(err,foundList){
         if(!err){
             res.redirect("/" + listName);
         }
     });
    }
    
});

app.listen(3000, function(req,res){
    console.log("Connected to port 3000");
});