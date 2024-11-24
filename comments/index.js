const express = require('express');
const bodyParser = require('body-parser');
const {randomBytes} = require('crypto');
const cors = require('cors');
const app = express();
const axios = require('axios');
app.use(bodyParser.json());
app.use(cors());

const commentsById = {};

app.get('/posts/:id/comments',(req,res)=>{
  res.send(commentsById[req.params.id] || []);
})

app.post('/posts/:id/comments',(req,res)=>{
  const commentId = randomBytes(4).toString('hex');

  const {content} = req.body;
  
  const comments = commentsById[req.params.id] || [];

  comments.push({id:commentId,content,status:'pending'});

  commentsById[req.params.id] = comments;

  axios.post('http://localhost:4005/events',{
    type:'CommentCreated',
    data:{
      id:commentId,
      content,
      postId:req.params.id,
      status:'pending'
    }
  }).catch((err)=>{
    console.log(err);
  })

  res.status(201).send(comments);
})

app.post('/events',async (req,res)=>{
  const {type,data}=req.body;
  const {postId,id,status,content}=data;
  if(type==='CommentModerated'){
    const comments = commentsById[postId];
    const comment = comments.find(comment=>{
      return comment.id===id;
    })
    comment.status=status;
  }

  await axios.post('http://localhost:4005/events',{
    type:'CommentUpdated',
    data:{
      id,
      postId,
      status,
      content
    }
  }).catch(err=>{
    console.log(err);
  })
  

  res.send({});
})

app.listen('4001',()=>{
  console.log('Listening on 4001');
})