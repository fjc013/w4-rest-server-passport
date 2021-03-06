// JavaScript File dishes.js
/*
Create a Node module named dishRouter.js that implements 
the Express router for the /dishes REST API end point.
*/

var express = require('express');
var bodyParser = require('body-parser');

// Require for JSON Web Token Authentication
var Verify = require('./verify');

// Require mongoose
var mongoose = require('mongoose');

var Dishes = require('../models/dishes');

var dishRouter = express.Router();

dishRouter.use(bodyParser.json());

dishRouter.route('/')

.get(Verify.verifyOrdinaryUser, function(req,res,next) {
    Dishes.find({})
    .populate('comments.postedBy')
    .exec(function (err, dish) {
        if (err) throw err;
        res.json(dish);
    });
})

.post(Verify.verifyOrdinaryUser,Verify.verifyAdmin, function(req, res, next){
    Dishes.create(req.body, function(err, dish) {
        if (err) throw err;
        console.log("Dish created!");
        var id = dish.id;
        
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("Added the dish with id: " + id);
    });
})

.delete(Verify.verifyOrdinaryUser,Verify.verifyAdmin, function(req, res, next){
    Dishes.remove({}, function(err, resp) {
        if (err) throw err;
        res.json(resp);
    })
});

dishRouter.route('/:dishId')

.get(Verify.verifyOrdinaryUser, function (req, res, next) {
    Dishes.findById(req.params.dishId)
    .populate('comments.postedBy')
    .exec(function (err, dish) {
        if (err) throw err;
        res.json(dish);
    });
})
.put(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){
    Dishes.findByIdAndUpdate(req.params.dishId, {
        $set: req.body
    },{
        new: true
    }, function(err, dish) {
        if (err) throw err;
        res.json(dish);
    });
})

.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){
    Dishes.findByIdAndRemove(req.params.dishid, function(err, resp) {
        if (err) throw err;
        res.json(resp);
    });
});

// handle comments

dishRouter.route('/:dishId/comments')

.all(Verify.verifyOrdinaryUser)

.get(function (req, resp, next) {
    Dishes.findById(req.params.dishId)
    .populate('comments.postedBy')
    .exec(function (err, dish) {
        if (err) throw err;
        res.json(dish.comments);
    });
})

.post(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function (req, res, next) {
    Dishes.findById(req.params.dishId, function (err, dish) {
        if (err) throw err;
        req.body.postedBy = req.decoded._doc._id;
        dish.comments.push(req.body);
        dish.save(function (err, dish) {
            if (err) throw err;
            console.log('Updated Comments!');
            res.json(dish);
        });
    });
})

.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function (req, res, next) { // must iterate through sub-documents
    Dishes.findById(req.params.dishId, function (err, dish) {
        if (err) throw err;
        for (var i = (dish.comments.length - 1); i >= 0; i--) {
            dish.comments.id(dish.comments[i]._id).remove();
        }
        dish.save(function (err, result) {
            if (err) throw err;
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.end('Deleted all comments!');
        });
    });
});

dishRouter.route('/:dishId/comments/:commentId')

.all(Verify.verifyOrdinaryUser)

.get(function (req, res, next) {
    Dishes.findById(req.params.dishId)
    .populate('comments.postedBy')
    .exec(function (err, dish) {
        if (err) throw err;
        res.json(dish.comments.id(req.params.commentId));
    });
})

// .put(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function (req, res, next) {
.put(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function (req, res, next) {
    // We delete the existing commment and insert the updated
    // comment as a new comment
    Dishes.findById(req.params.dishId, function (err, dish) {
        if (err) throw err;
        dish.comments.id(req.params.commentId).remove();
        req.body.postedBy = req.decoded._doc._id;
        dish.comments.push(req.body);
        dish.save(function (err, dish) {
            if (err) throw err;
            console.log('Updated Comments!');
            res.json(dish);
        });
    });
})

//.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function (req, res, next) {
.delete(function (req, res, next) {
    Dishes.findById(req.params.dishId, function (err, dish) {
        if (dish.comments.id(req.params.commentId).postedBy 
        != req.decoded._doc._id) {
            var err = new Error('You are not authorized to perform this operation!');
            err.status = 403;
            return next(err);
        }
        dish.comments.id(req.params.commentId).remove();
        dish.save(function (err, resp) {
            if (err) throw err;
            res.json(resp);
        });
    });
});


// fin
module.exports = dishRouter;
