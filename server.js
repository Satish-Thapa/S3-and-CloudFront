import express from 'express'

import multer from 'multer' //to process the data sent 
import sharp from 'sharp'
import crypto from 'crypto'

import dotenv from 'dotenv'
import AWS from 'aws-sdk';

// import { PrismaClient } from '@prisma/client'
import { uploadFile, deleteFile, getObjectSignedUrl } from './s3.js'
import  getSignedCookies  from './signedcookies.js'
import { url } from 'inspector'

const app = express()
// const prisma = new PrismaClient()

const storage = multer.memoryStorage() //keep image in memory 
const upload = multer({ storage: storage }) //upload image to memory


const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex') //new name for file

app.get("/api/posts/:id", async (req, res) => {
  const id = req.params.id 
  console.log(id)
  // const posts = await prisma.posts.findMany({orderBy: [{ created: 'desc'}]})
  // for (let post of posts) {
  //   post.imageUrl = await getObjectSignedUrl(post.imageName)
  // }

  const url = await getObjectSignedUrl(id)
  console.log(url);
  res.send(url)
})


app.post('/api/posts', upload.single('image'), async (req, res) => {
  const file = req.file
  const caption = req.body.caption //
  const imageName = generateFileName()  
 console.log(file);
 console.log("-----------------------");

 console.log(file.buffer);
  const fileBuffer = await sharp(file.buffer)
    .resize({ height: 1920, width: 1080, fit: "contain" })
    .toBuffer()  //resize image

  console.log("-----------------------");
    console.log( fileBuffer);
  console.log("-----------------------");

    console.log(file.mimetype);
  const test = await uploadFile(fileBuffer, imageName, file.mimetype) //posted to s3
  // const post = await prisma.posts.create({
  //   data: {
  //     imageName,
  //     caption,
  //   }
  // })
  
  res.status(201).send(test)
})

app.delete("/api/posts/:id", async (req, res) => {
  const id = req.params.id //image name in bucket
  // const post = await prisma.posts.findUnique({where: {id}}) 
  console.log(id);
  await deleteFile(id)

  // await prisma.posts.delete({where: {id: post.id}})
  res.send("gehe")
})
//----------------------------------------------------------------------------------------------------------------

console.log(process.env.PUBLIC_KEY);
console.log( process.env.PRIVATE_KEY);


const cloudFront = new AWS.CloudFront.Signer(
  process.env.PUBLIC_KEY,
  process.env.PRIVATE_KEY
);

const policy = JSON.stringify({
  Statement: [
    {
      Resource: 's3://innovate-frontend-staging/resources/', // http* => http and https
      Condition: {
        DateLessThan: {
          'AWS:EpochTime':
            Math.floor(new Date().getTime() / 1000) + 60 * 60 * 1, // Current Time in UTC + time in seconds, (60 * 60 * 1 = 1 hour)
        },
      },
    },
  ],
});

// Handle Login Route
app.post('/login-route1', async (req, res) => {
  /* Code to Verify the credentials */
   // Set Cookies after successful verification
   const cookie = cloudFront.getSignedCookie({
    policy,
  });

  console.log("Ayye2");
  
  
  const cook = ('CloudFront-Key-Pair-Id', cookie['CloudFront-Key-Pair-Id'], {
    domain: 'foodapp.innovatetech.io',
    path: '/',
    httpOnly: true,
  });

  res.cookie(cook)

  console.log(typeof cook + "hehe");
 

 
  console.log(typeof res.cookie('CloudFront-Policy', cookie['CloudFront-Policy'], {
    domain: 'foodapp.innovatetech.io',
    path: '/',
    httpOnly: true,
  }))

  res.cookie('CloudFront-Signature', cookie['CloudFront-Signature'], {
    domain: 'foodapp.innovatetech.io',
    path: '/',
    httpOnly: true,
  });
  // Send some response
  res.send({ some: 'response' });
});


app.listen(8080, () => console.log("listening on port 8080"))