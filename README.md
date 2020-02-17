[![General Assembly Logo](https://camo.githubusercontent.com/1a91b05b8f4d44b5bbfb83abac2b0996d8e26c92/687474703a2f2f692e696d6775722e636f6d2f6b6538555354712e706e67)](https://generalassemb.ly/education/web-development-immersive)

# Express API & Authentication

Through this tutorial, we'll build an Express API as the back end to a job board application where users can post job openings. In order for the job seekers to be able to see and potentially apply to the jobs, this needs to be an ‘open readʼ model with the ability for all users to see (i.e., read) the jobs. However, it wouldn't make sense if a job seeker could edit or delete jobs, so we'll add ownership to the job model and make sure that only the user who created the job can update or delete it. In order to determine which users are authorized to modify which job documents, we need a user model and a system for authenication.

We'll start by creating the Job resource. Then we'll add a User resource and connect the two using Mongoose relationships. Finally, we'll use Passport middleware to add authentication.

## Basic Express API Setup

First let's quickly set up a basic project environment.

### Scaffold the Project

1. From the command line, create a new directory and switch into it with `mkdir job-board-api && cd job-board-api`.
1. Run `git init` to initialize the repository for Git.
1. Create a `.gitignore` and add the node_modules directory to it with `echo node_modules > .gitignore`
1. Create an `index.js` file with `touch index.js`.
1. Run `npm init -y` to initialize the repository for npm.
1. Install dependencies with `npm i express cors mongoose dotenv`.
1. Install `nodemon` as a devDependency with `npm i -D nodemon`.
1. Open the directory in VS Code with `code .`.
1. Navigate to the `package.json` file and inside the `scripts` property object add the following:

```json
    "start": "node index.js",
    "dev": "nodemon index.js"
```

10. While in the package.json, you can _optionally_ fill in the keywords, description and author fields.
1.  Create your directory folders:

<!-- prettier-ignore-start -->
<!-- INIT_DIRECTORY_DIAGRAM - START -->
```md
job-board-api
    ├── index.js
    ├── controllers
    └── db
        └── models
```
<!-- INIT_DIRECTORY_DIAGRAM - START -->
<!-- prettier-ignore-end -->

12. Save, add, and commit your files:

```bash
git add .
git commit -m "Initial commit"
```

13. Create a new repository on GitHub and copy the code in the section that reads: **`…or push an existing repository from the command line`** by clicking the copy icon on the right side of the code block.
1. Paste the code in the Terminal window.

[View Commit](../../commit/5126d02)

### Connect to MongoDB

1. Create a file in the `db` directory called `connection.js` and add the following code:

```js
const mongoose = require('mongoose');

mongoose
  .connect('mongodb://localhost/job-board')
  .then(instance =>
    console.log(`Connected to db: ${instance.connections[0].name}`)
  )
  .catch(error => console.log('Connection failed!', error));

module.exports = mongoose;
```

2. Back in the Terminal make sure you're in the `job-board-api` directory and run the file to test your connection using NodeJS with `node db/connection.js`. If you get a `Connection failed` error or do not see `Connected to db: job-board`, [check and make sure that your MongoDB server is running](https://git.generalassemb.ly/seir-129/mongo-install-homework). Otherwise, you should see output similar to the following:

```bash
(node:48059) DeprecationWarning: current URL string parser is deprecated, and will be removed
in a future version. To use the new parser, pass option { useNewUrlParser: true } to MongoClient.connect.
(node:48059) DeprecationWarning: current Server Discovery and Monitoring engine is deprecated,
and will be removed in a future version. To use the new Server Discover and Monitoring engine,
pass option { useUnifiedTopology: true } to the MongoClient constructor.
Connected to db: job-board
```

3. Let's get rid of the warnings by modifying the `mongoose.connect()` method like so:

```js
mongoose
  .connect('mongodb://localhost/job-board', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  ...
```

4. Back in the Terminal, type `control + C` to stop the process that's running and return to the command prompt. Now, try running the connection.js file again with `node db/connection.js`. This time you should only see the connection message.

5. Great! But, we know that this API isn't always going to be run on our local machine so we should use a variable for the connection string. We'll use a ternary to set the string to the localhost or the URI that's stored in the environment variable called `MONGODB_URI` that we'll set in Heroku to point to our production database on Atlas. The completed file will look like this:

```js
// Import Mongoose to interface with MongoDB
const mongoose = require('mongoose');

// Use a ternary that looks for the presence of a `NODE_ENV` environmental variable
// If `NODE_ENV` is set to `production`, use the URI for our database stored in the
// `MONGODB_URI` environmental variable.  If not, just use the local db address.
const mongoURI =
  process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_URI
    : 'mongodb://localhost/job-board';

// Use Mongoose's connect method to connect to MongoDB by passing it the db URI.
// Pass a second argument which is an object with the options for the connection.
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  // If the connection is successful, give a message in the Terminal with the db name
  .then(instance =>
    console.log(`Connected to db: ${instance.connections[0].name}`)
  )
  // If the connection fails, give a message and pass along the error so we see it in
  // the Terminal.
  .catch(error => console.log('Connection failed!', error));

// Export the connection so we can use it elsewhere in our app.
module.exports = mongoose;
```

6. Save and close the file in VS Code and back in the Terminal, type `control + C` to stop the process that's running and return to the command prompt. Add and commit your changes!

[View Commit](../../commit/ec0c57f)

### Create the Job Model

1. In the models directory, create a file called `job_model.js`.
1. First thing we need to do is create a variable called `mongoose` that stores the connection to our database using `require()` to bring in our `connection.js` file.
1. Next, we'll create a very basic job schema. It should have a `title`, which is a `String` type and is required, and a `description` that will simply be a `String`. We should also use `timestamps` so that we know when the job posting was created and updated.
1. Lastly, we'll use the schema to create our model. We'll name the model `Job` (singular and capitalized) so that Mongoose knows to create a collection in our database called `jobs` and use this schema to validate the data against for that collection. We're going to need this model elsewhere in our app, so make sure to export it.

Your final model should look like this:

```js
const mongoose = require('../connection');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Job', jobSchema);
```

### Seed the Database

1. To seed the database, create a `seeds.json` file in the `db` directory and copy the following JSON data into it:

```json
[
  {
    "title": "Junior Developer",
    "description": "The Junior Developer is responsible for assisting with application development, ticket resolution, research projects and writing tests."
  },
  {
    "title": "Junior Javascript Developer",
    "description": "As a JavaScript engineer, you will help to build new features on proprietary products using vanilla JavaScript. React and/or Angular experience is a plus."
  },
  {
    "title": "Junior Software Developer",
    "description": "As a Junior Software Developer focused on Deployments, you will work with our Operations Team to successfully configure and develop our service offerings for world-class enterprises."
  }
[
```

2. Next, create a `seeds.js` file, also inside the `db` directory.
1. Inside the `db/seeds.js` file require the `job_model.js` file and store it in a variable named `Job`.
1. After the model, require the `seeds.json` file.
1. Now, create a Mongoose query that deletes all of the existing documents in the jobs collection. This will start a promise chain so we can use `.then()`, `.catch()`, and `.finally()` methods to chain our insert operation.
1. Use `.then()` with an anonymous function that returns the results of inserting the data from the `seeds.json` file using Mongoose's `.insertMany()` method.
1. Add another `.then()` to the chain and log the results of inserting the data, so we know the operation was sucessful without having to go into MongoDB to check if the data is there.
1. Add a `.catch()` to log any errors in case something went wrong with either the delete or insert operations.
1. Add a `.finally()` to safely close the connection to the database using `process.exit()`. The [`finally()` method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally) is run regardless if the Promise is resolved or rejected.

The final result should look like this:

```js
/// Require the Job model
const Job = require('./models/job_model');
// Require the data
const seedData = require('./seeds.json');

// Delete any existing documents in the jobs collection
Job.deleteMany()
  // Use insertMany and pass it the seed data
  .then(() => Job.insertMany(seedData))
  // Log the successful results
  .then(console.log)
  // Log any errors if things didn't work
  .catch(console.error)
  // Use finally, so that this code will run whether or not
  // things worked and close our connection to the database.
  .finally(process.exit);
```

10. Run the `seeds.js` file in the Terminal with `node db/seeds.json`. You should see the results in the Terminal when done. If you receive an error, check to make sure that your files are in the right directory and that MongoDB is running.
1. w00t w00t :raised_hands:! Time to add and commit your changes.

[View Commit](../../commit/f2d4dd6)

### Setup a Server

1. In the `index.js` file lets create a basic Express server and get it running. We need to require Express and store it in a variable called `express`. Then we'll invoke express to instantiate the Express application object and store that in a variable called `app`. Finally, we'll listen on port 4000 for requests and add a callback so we know its running. The basic server looks like this:

```js
const express = require('express');
const app = express();

app.listen(4000, () => {
  console.log('listening on port 4000');
});
```

2. Use the `dev` script we wrote earlier in the `package.json` file to run the server. In the Terminal, type `npm run dev`.
1. This server doesn't do anything at all, so lets build it out a bit more. We know we'll be adding our routes in here so let's require `mongoose` and while we're at it require the `cors` middleware.
1. Now, anywhere after you instatiated Express (after the `app` variable), add the cors middleware. Remember to use a middleware in Express we need to pass it to the `app.use()` method.
1. We're also going to have to use two of the builtin middleware packages since we're going to be making requests via AJAX to the server, so add `app.use(express.json())` and `app.use(express.urlencoded({ extended: true }))`.
1. Lastly, again, we know that eventually we'll be running this on a remote server, so lets create a port variable. We can assign the variable the value of the PORT environment variable that will be set in Heroku OR if that environment variable doesn't exist, it should use 4000.

The completed file should look like this when done:

```js
// Require necessary NPM packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Instantiate express application object
const app = express();

// The `.use` method sets up middleware in Express

// Set up cors middleware and make sure that it
// comes before our routes are used.
app.use(cors());

// Add `express.json` middleware which will
// parse JSON requests into JS objects before
// they reach the route files.
app.use(express.json());

// The urlencoded middleware parses requests which use
// a specific content type (such as when using Axios)
app.use(express.urlencoded({ extended: true }));

// Define port for API to run on, if the environment
// variable called `PORT` is not found use port 4000
const port = process.env.PORT || 4000;
// Run server on designated port
app.listen(port, () => {
  console.log('listening on port ' + port);
});
```

Provided that your server is still listening on port 4000, you're ready to move on to creating some routes. We'll get back to this file in a few minutes.

### Create Routes for the Job Resource

So now that we have our server running, we'll need to create some routes for our job resource. We'll be following the REST architectural style as described in the table below:

| URI           | HTTP VERB |  CRUD  | Action  | 200 Status Code | 400 Status Code(s) |
| ------------- | :-------: | :----: | :-----: | :-------------: | :----------------: |
| /resource     |   POST    | Create |   new   |   201 Created   |        422         |
| /resource     |    GET    |  Read  |  index  |     200 OK      |                    |
| /resource/:id |    GET    |  Read  |  show   |     200 OK      |        404         |
| /resource/:id |    PUT    | Update |  edit   |     200 OK      |     404 / 422      |
| /resource/:id |  DELETE   | Delete | destroy | 204 No content  |        404         |

1. Create a new file called `jobs.js` in the `controllers` directory.
1. Set up your basic file by requiring Express, which we'll need to create a router, and the Job model from the `db/models` directory. Create a router and export it. The basic file should look like this:

```js
const express = require('express');
const Job = require('../db/models/job_model');

const router = express.Router();

module.exports = router;
```

3. Stub out all of the routes shown above after the router is created and before it is exported:

```js
// INDEX
// GET api/jobs
router.get('/', (req, res) => {});

// SHOW
// GET api/jobs/5a7db6c74d55bc51bdf39793
router.get('/:id', (req, res) => {});

// CREATE
// POST api/jobs
router.post('/', (req, res) => {});

// UPDATE
// PUT api/jobs/5a7db6c74d55bc51bdf39793
router.put('/:id', (req, res) => {});

// DESTROY
// DELETE api/jobs/5a7db6c74d55bc51bdf39793
router.delete('/:id', (req, res) => {});
```

4. We can fill in the index route easily. The index will send back all of the jobs, so we can use Mongoose's `.find()` method here:

```js
// INDEX
// GET api/jobs
router.get('/', (req, res) => {
  // Use our Job model to find all of the documents
  // in the jobs collection
  // When found, they are passed down the promise chain
  // to the `.then()` where we send the response as JSON
  // with `res.json` and pass it any jobs found
  Job.find().then(jobs => res.json(jobs));
});
```

5. For the show route, we don't want to send back an array. We just want one document, so we can use Mongoose's `.findOne()` method and pass it an object to filter the results by the id, or Mongoose's `.findById()` method which is passed the id as a string.

```js
router.get('/:id', (req, res) => {
  Job.findById(req.params.id).then(job => res.json(job));
});
```

6. For update, we'll use Mongoose's `.findOneAndUpdate()`. This method takes three arguments. The first argument is the query filter used to locate the document by its id. The second argument is the data in the request's body object, which should be our newly updated document. The third argument is an object that contains any options for this method. If we set the `new` property to `true` in the options object, Mongoose will return the newly updated document, which is then passed down the promise chain where we can send it back in the response.

```js
router.put('/:id', (req, res) => {
  Job.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true
  }).then(job => res.json(job));
});
```

7. For delete, we'll use the `.findOneAndDelete()` method and pass it an object with the id to use as the query filter.

```js
router.delete('/:id', (req, res) => {
  Job.findOneAndDelete({
    _id: req.params.id
  }).then(job => res.json(job));
});
```

In the next steps, we'll add this to our server's `index.js` file and test it out using [Postman](https://www.postman.com/).

## Configure Job Routes in Server

1. To configure the job routes using the controllers we just built, require the file in the `index.js` after the npm packages at the top of the file, but before instantiating the Express app.

```js
// Require the job resource routes and controllers
const jobController = require('./controllers/jobs');
```

2. Now we'll use this `jobController` right before the port variable that we declared near the bottom of the file. Remember, the order matters here, so make sure that the `jobController` is **AFTER** the `express.json()`, `express.urlencoded()` and `cors()` middleware. Middleware runs in the order that it is used, so if we don't _use_ those files first, they won't run on our requests before they are handled by the `jobController`.

```js
// Configure the route middleware
app.use('/api/jobs', jobController);
```

3. Make sure your server is running and test all of the routes in Postman.

If you were able to CRUD in Postman, :clap: ... but we've still got some work to do so no :champagne: :clinking_glasses: yet. Go ahead and add and commit up to this milestone.

[View Commit](../../commit/7beb658)

### HTTP Status Codes

Our Express API is coming along, but before we add our User model, we need to fix some things. So far, we're kind of breaking a lot of rules when it comes to the HTTP request-response cycle. First, we're not responding to all requests &mdash; only the ones that we can handle flawlessly. We're not handling any of the error cases. ExpressJS will help us out with some errors by sending a generic 500 server error, but if Mongoose throws an error, we're on our own. The second issue is that we're not setting the status codes on our responses, so every response is the default 200 OK. It turns out it's really easy to change the status codes within Express APIs.

1. Open the `controllers/jobs.js` file, we'll start by fixing the status codes for the post and delete routes.
1. In the post route, all we need to do is add `.status(201)` before we call the `.json()` method on the response object.
1. For the delete route, we'll change things a bit. Although you _can_ return `200 OK` in response to a delete operation, it's more customary to return `204 No Content`, so we'll do that by changing the response to: `.then(() => res.sendStatus(204))`. Notice here that we can't use the `.status()` method that we used for the post route. This is because it doesn't actually send the response. In the post route, the `.json()` method is responsible for sending the response. Since we aren't sending any ‘contentʼ this time, there's no `.json()` method to do the job. The `.sendStatus()` method is different from just `.status()` in that it both sets the status and sends the response.

Next, let's deal with the error codes. The most common will be the 404 case. A `404 Not Found` can occur anytime that we expect an id to be used as part of the URI endpoint because it's possible that the document associated with that id doesn't exist.

1. For both of the put and get routes, update the `.then()` method as follows:

```js
  .then(job => {
    // If we didn't get a job back from the query
    if (!job) {
      // send a 404
      res.sendStatus(404);
    } else {
      // otherwise, send back the job
      res.json(job);
    }
  });
```

2. For the delete route, update the `.then()` method to read:

```js
  .then(job => {
    // If we didn't get a job back from the query
    if (!job) {
      // send a 404
      res.sendStatus(404);
    } else {
      // otherwise, send back 204 No Content
      res.sendStatus(204);
    }
  });
```

This will _sort of_ work. As long as the id we provide looks like a Mongo id, we'll get the intended result. If we try and use something that doesn't resemble a Mongo id, we'll get a `CastError` in the Terminal and the entire system will hang. Try making a GET request to `http://localhost:4000/api/jobs/123` from Postman or the browser and you'll see this error. This is where we need some middleware to help us out!

#### Middleware in a Nutshell

Pretty much everything in Express is a form of middleware. Whenever a request is recieved by the server, each piece of middleware is called in the order that it is _used_ in our index file (i.e., where it is invoked with `app.use()`). Each middleware is passed the request and the response objects from Express as arguments along with a third argument that is commonly referred to as `next`. So, any middleware can use the values in the request object or even send a response back to the client. More often than not though, middleware will simply do _‘something’_ and then pass the request on to the next piece of middleware in the chain until it reaches one of our controllers where we are explicitly handling the response.

It turns out that our controllers are also a form of middleware, meaning that they too can be passed a `next` argument. This is helpful to handle errors that occur. Let's change all of our controllers to include a third parameter called `next` and then we'll use a promise `.catch()` method and pass it `next` as it argument. With this change, our controllers will now look like this:

```js
// INDEX
// GET api/jobs
router.get('/', (req, res, next) => {
  // Use our Job model to find all of the documents
  // in the jobs collection
  // Then send all of the jobs back as json
  Job.find()
    .then(jobs => res.json(jobs))
    .catch(next);
});

// SHOW
// GET api/jobs/5a7db6c74d55bc51bdf39793
router.get('/:id', (req, res, next) => {
  Job.findById(req.params.id)
    .then(job => {
      if (!job) {
        res.sendStatus(404);
      } else {
        res.json(job);
      }
    })
    .catch(next);
});

// CREATE
// POST api/jobs
router.post('/', (req, res, next) => {
  Job.create(req.body)
    .then(job => res.status(201).json(job))
    .catch(next);
});

// UPDATE
// PUT api/jobs/5a7db6c74d55bc51bdf39793
router.put('/:id', (req, res, next) => {
  Job.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true
  })
    .then(job => {
      if (!job) {
        res.sendStatus(404);
      } else {
        res.json(job);
      }
    })
    .catch(next);
});

// DESTROY
// DELETE api/jobs/5a7db6c74d55bc51bdf39793
router.delete('/:id', (req, res, next) => {
  Job.findOneAndDelete({
    _id: req.params.id
  })
    .then(job => {
      if (!job) {
        res.sendStatus(404);
      } else {
        res.sendStatus(204);
      }
    })
    .catch(next);
});
```

Try making a GET request to `http://localhost:4000/api/jobs/123` from Postman or the browser again and you'll see that instead of hanging and eventually timing out, we'll get an immediate response. In the Terminal, you'll also see that we no longer get the `UnhandledPromiseRejectionWarning`. This is a better result, but it's still not great. Notice that the error is a generic `500 Internal Server Error` and it's automatically sending along the entire error to the client. Although Express won't send a stack trace to the client in production environments, this error reveals some details about our back end implementation and that's a security risk. Fortunately, this can be fixed pretty easily in Express.

For now, lets add and commit our changes before we move on to handling potential errors.

[View Commit](../../commit/907c794)

### Handling Errors in Express APIs

In production environments, we might have dozens of errors that we explicitly handle. We're going to handle just a few of the common ones to cover the following scenarios:

- No document is found in the database matching a query by id. Should respond with 404 Not Found.
- An id is not a valid MongoDB id. Should respond with 404 Not Found.
- The data provided with the request isn't valid according to our schema (such as not supplying a required property). Should respond with 422 Unprocessable Entity.
- The user doesn't have the required authorization to delete, edit or create a new document. Should respond with 401 Unauthorized.
- A generic catch all for any other errors that occur. Should respond with 500 Internal Server Error.

Add the following to the `index.js` file right before our variable where we define the port on which our server is running. Be sure it comes **AFTER** all of our controllers, as this is the last thing that will be run in the middleware chain!

```js
// The last middleware receives any error as its first argument
app.use((err, req, res, next) => {
  // If the error contains a statusCode, set the variable to that code
  // if not, set it to a default 500 code
  const statusCode = err.statusCode || 500;
  // If the error contains a message, set the variable to that message
  // if not, set it to a generic 'Internal Server Error'
  const message = err.message || 'Internal Server Error';
  // Set the status and send the message as a response to the client
  res.status(statusCode).send(message);
});
```

Try making a GET request to `http://localhost:4000/api/jobs/123` from Postman or the browser again and you'll see that we are no longer sending along the details of the error to the client! :tada:.

Any time an error is thrown in a promise chain, it will be handled by the `.catch()` method which invokes `next` callback and passes it the error as an argument. When `next` is called with any value, [Express automatically treats this as an error](https://expressjs.com/en/guide/error-handling.html) and sends it to our middleware above. If the error is thrown _outside_ a promise chain, it also automatically gets sent to the middleware above simply because it's an error.

We can take advantage of this by creating some custom errors that we can throw when we want to control exactly what is sent back to the client!

1. First let's create a new directory for our middleware, which we'll name `middleware`.
1. Create a new file inside the new `middleware` directory called `custom_errors.js`.
1. Inside `custom_errors.js`, we'll start by defining a bunch of custom error types. The easiest way to do this is with ES6 class syntax. Add the following code to `custom_errors.js` file:

```js
// Require Mongoose so we can use it later in our handlers
const mongoose = require('mongoose');

// Create some custom error types by extending the Javascript
// `Error.prototype` using the ES6 class syntax.  This  allows
// us to add arbitrary data for our status code to the error
// and dictate the name and message.

class OwnershipError extends Error {
  constructor() {
    super();
    this.name = 'OwnershipError';
    this.statusCode = 401;
    this.message =
      'The provided token does not match the owner of this document';
  }
}

class DocumentNotFoundError extends Error {
  constructor() {
    super();
    this.name = 'DocumentNotFoundError';
    this.statusCode = 404;
    this.message = "The provided ID doesn't match any documents";
  }
}

class BadParamsError extends Error {
  constructor() {
    super();
    this.name = 'BadParamsError';
    this.statusCode = 422;
    this.message = 'A required parameter was omitted or invalid';
  }
}

class BadCredentialsError extends Error {
  constructor() {
    super();
    this.name = 'BadCredentialsError';
    this.statusCode = 422;
    this.message = 'The provided username or password is incorrect';
  }
}

class InvalidIdError extends Error {
  constructor() {
    super();
    this.name = 'InvalidIdError';
    this.statusCode = 422;
    this.message = 'Invalid id';
  }
}
```

4. Now we'll write some functions that we can export and use elsewhere in our code to handle the errors described above. We're also including the generic middleware function that we added to the `index.js` file and moving it here. This will keep all of our error handling code in one place and make our `index.js` file a little easier to read. After the custom error classes in the `custom_errors.js` file, add the following methods and export them so we can use them in our controllers:

```js
const handleValidateOwnership = (requestObject, resource) => {
  if (!requestObject.user._id.equals(resource.owner)) {
    throw new OwnershipError();
  }
};

const handleRecordExists = record => {
  if (!record) {
    throw new DocumentNotFoundError();
  } else {
    return record;
  }
};

const handleValidateId = (req, res, next) => {
  const isValidId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isValidId) {
    throw new InvalidIdError();
  } else {
    next();
  }
};

const handleValidationErrors = (err, req, res, next) => {
  if (err.name.match(/Valid/) || err.name === 'MongoError') {
    throw new BadParamsError();
  } else {
    // This the error-handling middleware will be called after
    // all controllers run, so we need to make sure that we pass
    // all of the errors up to this point on to the next
    // error handler in the chain!
    next(err);
  }
};

// This is our generic handler that will be the last in our middleware chain:
const handleErrors = (err, req, res, next) => {
  // If the error contains a statusCode, set the variable to
  // that code and if not, set it to a default 500 code
  const statusCode = err.statusCode || 500;
  // If the error contains a message, set the variable to that
  // message and if not, set it to a generic 'Internal Server Error'
  const message = err.message || 'Internal Server Error';
  // Set the status and send the message as a response to the client
  res.status(statusCode).send(message);
};

module.exports = {
  handleValidateOwnership,
  handleRecordExists,
  handleValidateId,
  handleValidationErrors,
  handleErrors
};
```

5. We can require a specific handler using destructing. Let's start by requiring the `handleErrors` in the `index.js` file and then replace the code we added earlier with `app.use(handleErrors);`.

```js
// Require the error handlers
const { handleErrors } = require('./middleware/custom_errors');

...

// The catch all for handling errors
// MUST BE PLACED IMMEDIATELY BEFORE `app.listen`
app.use(handleErrors);
```

6. We can use the `handleValidationErrors` method in the `index.js`. Add `handleValidationErrors` to the destructured require statement and include `app.use(handleValidationErrors)` directly **before** the `handleErrors`. This method will catch any Mongoose errors that occur when data is validated against a schema before it is added to the database as well as generic MongoDB errors so it needs to run after all of our controllers.

```js
// Require the error handlers
const { handleErrors, handleValidationErrors } = require('./middleware/custom_errors');

...

app.use(handleValidationErrors);
// The catch all for handling errors
// MUST BE PLACED IMMEDIATELY BEFORE `app.listen`
app.use(handleErrors);
```

7. Next, in the `controllers/jobs.js` file, require `handleValidId` method. This method will verify whether an id is a valid MongoDB id, **before** we try and use it to find a document so that we can prevent those `CastErrors` from happening (like when we tried to use the id "123"). That means we need this middleware to run **only** on routes that use ids (i.e., edit, delete and show) and we need it to run before the controller is passed the request. This is actually pretty easy in Express because we can add as many middleware methods we want to our route before the controller! Update the file as follows:

```js
// Require handleValidateId by destructuring it from the exports object
const { handleValidateId } = require('../middleware/custom_errors');

  ...

// SHOW
// GET api/jobs/5a7db6c74d55bc51bdf39793
router.get('/:id', handleValidateId, (req, res, next) => {
  ...
});

// UPDATE
// PUT api/jobs/5a7db6c74d55bc51bdf39793
router.put('/:id', handleValidateId, (req, res, next) => {
  ...
});

// DESTROY
// DELETE api/jobs/5a7db6c74d55bc51bdf39793
router.delete('/:id', handleValidateId, (req, res, next) => {
  ...
});
```

8. Let's also use the `handleRecordExists` method to check for potential 404 errors instead of all of the `if...else` statements that we have in our code. If you look at the `handleRecordExists` method, you'll see it expects to be passed a document. If the document is not undefined, then it just returns the same document. This means we can just call `.then(handleRecordExists)` in our promise chain. It will either throw an error causing the `.catch()` to be invoked, or pass the document on to the next `.then()` in the chain. Here's the entire updated `controllers/jobs.js` file:

```js
const express = require('express');
const Job = require('../db/models/job_model');
const {
  handleValidateId,
  handleRecordExists
} = require('../middleware/custom_errors');
const router = express.Router();

// INDEX
// GET api/jobs
router.get('/', (req, res, next) => {
  // Use our Job model to find all of the documents
  // in the jobs collection
  // Then send all of the jobs back as json
  Job.find().then(jobs => res.json(jobs));
});

// SHOW
// GET api/jobs/5a7db6c74d55bc51bdf39793
router.get('/:id', handleValidateId, (req, res, next) => {
  Job.findById(req.params.id)
    .then(handleRecordExists)
    .then(job => {
      res.json(job);
    })
    .catch(next);
});

// CREATE
// POST api/jobs
router.post('/', (req, res, next) => {
  Job.create(req.body)
    .then(job => res.status(201).json(job))
    .catch(next);
});

// UPDATE
// PUT api/jobs/5a7db6c74d55bc51bdf39793
router.put('/:id', handleValidateId, (req, res, next) => {
  Job.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true
  })
    .then(handleRecordExists)
    .then(job => {
      res.json(job);
    })
    .catch(next);
});

// DESTROY
// DELETE api/jobs/5a7db6c74d55bc51bdf39793
router.delete('/:id', handleValidateId, (req, res, next) => {
  Job.findOneAndDelete({
    _id: req.params.id
  })
    .then(handleRecordExists)
    .then(job => {
      res.sendStatus(204);
    })
    .catch(next);
});

module.exports = router;
```

Excellent! We're done with error handling for now. Test, then git add and git commit your code. Next up we'll be adding a user model.

[View Commit](../../commit/df76270)

## Add a User Resource

We've got all of the boilerplate in place, so adding a user resource will go quickly. For authentication purposes, we'll be adding some non-RESTful routes related to our user resource. Initially, we'll just focus on a `api/signup/` route that will be a POST route for creating a new user.

### Create the User Model

1. Create a new file in the `db/models` directory called `user_model.js`.
1. Create a basic user model. To keep things simple, our model is going to be super streamlined with just `email` and `password` fields.

```js
const mongoose = require('../connection');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
```

### Create Routes for the User Resource

1. Create a new file in the `controllers` directory called `users.js`.
1. Require express, the user model and create a router and export it:

```js
const express = require('express');
const User = require('../db/models/user_model');

const router = express.Router();

// routes/controllers here

module.exports = router;
```

1. Stub out the routes for our user resource. They will be:

- /signup: a POST route that will create a new user in the database
- /signin: a POST route that will create a new authorization token for the user
- /signout: a DELETE route that will invalidate the user's authorization token (but not delete the user from the database so they don't need to sign up after every time they sign in).

```js
// SIGN UP
// POST /api/signup
router.post('/signup', (req, res, next) => {});

// SIGN IN
// POST /api/signin
router.post('/signin', (req, res, next) => {});

// SIGN OUT
// DELETE /api/signout
router.post('/signout', (req, res, next) => {});
```

3. Add create to the signup controller:

```js
router.post('/signup', (req, res, next) => {
  User.create(req.body)
    .then(user => res.status(201).json(user))
    .catch(next);
});
```

4. Require the user controllers in `index.js`. To keep things organized, add the require statement right above the existing `jobController` variable.

```js
// Require the user resource routes and controllers
const userController = require('./controllers/users');
```

5. Use the controller. Again, to make sure things are organized and to ensure the correct order of execution, place this right above or below the existing `.app.use()` method for the jobController.

```js
app.use('/api', userController);
```

Test in Postman by creating a new user.

### Prevent Passwords from Being Sent to Clients

You may have noticed that when you created a new user, you got back a user document with the user's password. That's a huge security hole in our API right now. We can fix it using Mongoose [Virtuals](https://mongoosejs.com/docs/tutorials/virtuals.html) pretty easily though. Virtuals are used to transform data without persisting the transformation in MongoDB. We'll create a virtual that will automatically remove the password field any time we use a toJSON method (including `JSON.stringify()`, Mongoose's `.toJSON()` method or Express' `.json()` method). The field is deleted by virtual, but remains safe and sound in our database.

1. Open the `models/user_model.js` file.
1. Update the schema as follows to add a virtual:

```js
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // ret is the returned Mongoose document
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      }
    }
  }
);
```

Create a new user in Postman. :tada: No more password being sent! However, it seems we introduced another issue. Now, we have both an `_id` and an `id` field. Technically, this additional `id` field is just a virtual because we used a toJSON virtual. You can verify that it's not storing the value in MongoDB separately. If it bugs you, you can add `id: false` as a key/value pair in the options object that has the `timestamps` and `toJSON` properties.

### Store a Hashed Password

We're breaking a cardinal rule of user security by saving the user's password in plain text. Even in a-just-for-fun, non-commercial app, we're opening ourselves up to financial liability and risking the security of users who often reuse the same password on multiple sites. So lets fix that, shall we?

When it comes to storing password data securely, the only thing we can do is not store it at all. Wait...whaaat? Yes, we should _never store a password_ &mdash; not even an encrypted password. Instead we should store a hash of the password. Hashing is a **one-way function**, so the hashed value cannot be reversed to obtain the original input value. If you apply the same hashing algorithm to the same value you'll always get the same hash though. That means we can store the hash of the password and when users sign into the system, we can hash the password they send and compare it with the hash in the database to verify that they provided the correct password.

1. We'll use a popular npm package called `bcrypt` to hash our passwords, so in the Terminal run `npm i bcrypt`. :warning: **Do not run this install from VS Code's integrated terminal**.
1. Require the `bcrypt` package in your `controllers/users.js` file with `const bcrypt = require('bcrypt');`.
1. To hash the password, we'll use the `bcrypt.hash()` method which takes two arguments. The first argument is the value we want to hash and the second is the number of salt rounds. Salting is a way to make the hash stronger. Each time the value is salted, it is transformed in some way by adding another value to it. The more times you salt, the more the original value is changed and obscured. We're going to use `10` salt rounds. Hashing and salting takes time so bcrypt's `.hash()` method is asynchronous (also has a hashSync method). Since we're using a promise chain for our create already, we have two options: wrap the hash in a promise to start a chain that we can use to invoke the create, or refactor using async and await. Below are both implementations:

```js
  ...
const bcrypt = require('bcrypt');
  ...

// Using async/await
// Add the async keyword
router.post('/signup', async (req, res, next) => {
  // wrap it in a try/catch to handle errors
  try {
    // store the results of any asynchronous calls in variables
    // and use the await keyword before them
    const password = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ email, password });
    res.status(201).json(user);
  } catch (error) {
    // return the next callback and pass it the error from catch
    return next(error);
  }
});

/*** ALTERNATIVE ***/

//Using promise chain
router.post('/signup', (req, res, next) => {
  bcrypt
    .hash(req.body.password, 10)
    // return a new object with the email and hashed password
    .then(hash =>
      // when returning an object with fat arrow syntax, we
      // need to wrap the object in parentheses so JS doesn't
      // read the object curly braces as the function block
      ({
        email: req.body.email,
        password: hash
      })
    )
    // create user with provided email and hashed password
    .then(user => User.create(user))
    // send the new user object back with status 201, but `hashedPassword`
    // won't be send because of the `transform` in the User model
    .then(user => res.status(201).json(user))
    // pass any errors along to the error handler
    .catch(next);
});
```

Create a new user with a different email address in Postman. If you look in Mongo, you should see that the password is now hashed and looks something like this:

```json
"password" : "$2b$10$5g62t1K7SUovJ2.XonHfy.kiDWQr/UEpR1ha8DSwAWWpBob5WXAKy"
```

If your passwords are hashed, add and commit your changes. Next, we'll add the user to the job documents.

[View Commit](../../commit/68ba932)

## Add Users to Jobs

Now we're going to create a one-to-many relationship between our users and jobs. In Mongoose, we can do this with _child referencing_ or _parent referencing_, but the preferred approach for one-to-many is through **parent referencing**. This means that we'll add the parent document id to each of the child documents. This keeps our data flat and helps to prevent inconsistencies.

1. Open the `db/models/job_model.js` file.
1. After the description property in the schema add an owner field. Set its type to a Mongoose object id, reference the User model and make it required:

```js
{
  ...
  owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
}
```

3. Copy the id from a user document you created when you when you tested your signup controller.
1. Open up Postman and create a new job with a POST method and pass the id of the user you copied from the user document as the value for the owner.
1. You should receive a 201 Created status and see the newly created document.

### Add Population

So this is cool, but maybe we want to actually get some information about the user with our response. Mongoose makes this easy with [populate](https://mongoosejs.com/docs/populate.html).

1. Open the `/controllers/jobs.js` file and add `.populate('owner')` immediately after the find method in the show route:

```js
router.get('/:id', handleValidateId, (req, res, next) => {
  Job.findById(req.params.id)
    .populate('owner')
    .then(handleRecordExists)
    .then(job => {
      res.json(job);
    })
    .catch(next);
});
```

2. You can also specify just fields that should be populated. Update the index route as follows to populate only the email:

```js
router.get('/', (req, res, next) => {
  Job.find()
    .populate('owner', 'email -_id')
    .then(jobs => res.json(jobs));
});
```

Test both routes in Postman. You'll see that the populated owner continues to honor the virtuals that we set up in the User model.

Awesome progress... we're ready to add in authentication (finally :sweat_smile:). Add and commit your changes.

[View Commit](../../commit/cccb6b8)

## Add Authentication

In this part of the tutorial, we'll be tackling the steps needed to add authentication to our app. We'll be using [Passport](http://www.passportjs.org/) to simplify the authentication process. To use Passport, we need to install it in our app along with one (or more) of the over [500 strategies](http://www.passportjs.org/packages/) it offers for authentication. For this tutorial, we'll be using what's know as the **jwt-passport** strategy. [JWT](https://jwt.io/introduction/) stands for JSON Web Token, and it's an open standard that is a popular choice for authorizing users.

Each strategy with Passport has to be configured for your specific app. Basically, Passport gives us a callback and we fill it in with any logic needed to get the user from our database that matches some bit of data that Passport extracts from a request. We just get the user and turn it back over the Passport, which in turn will add it to the request and then pass it on to the route that called it.

For the JWT strategy that we're going to use, Passport will do all of the complicated stuff around extracting the token from the request and decrypting it into a plain old JavaScript object. The token will contain the id of the user, which we'll use to find the user in our database.

### Configure Passport

1. Start by installing the npm packages with: `npm i passport passport-jwt jsonwebtoken`.
1. Create a new file the `middleware` directory called `auth.js`.
1. Add the following code to `auth.js`. This code configures Passport to get the id for us out of the request token, find the matching user in the database and then add that user to the request object. It exports a middleware called `requireToken` that we can add to our routes where we want them to be accessible only for authenticated users. The `createUserToken` uses the `jsonwebtoken` package to create and encrypt the tokens according to the standard, which we'll call from our signin route.

```js
// Require the needed npm packages
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Create a secret to be used to encrypt/decrypt the token
const secret =
  process.env.JWT_SECRET || 'some string value only your app knows';

// Require the specific `strategy` we'll use to authenticate
// Require the method that will handle extracting the token
// from each of the requests sent by clients
const { Strategy, ExtractJwt } = require('passport-jwt');

// Minimum required options for passport-jwt
const opts = {
  // How passport should find and extract the token from
  // the request.  We'll be sending it as a `bearer` token
  // when we make requests from our front end.
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  // Any secret string to use that is unique to your app
  // We should store this in an environment variable so it
  // isn't ever pushed to GitHub!
  secretOrKey: secret
};

// Require the user model
const User = require('../db/models/user_model');

// We're configuring the strategy using the constructor from passport
// so we call new and pass in the options we set in the `opts` variable.
// Then we pass it a callback function that passport will use when we call
// this as middleware.  The callback will be passed the data that was
// extracted and decrypted by passport from the token that we get from
// the client request!  This data (jwt_payload) will include the user's id!
const strategy = new Strategy(opts, function(jwt_payload, done) {
  // In the callback we run our custom code. With the data extracted from
  // the token that we're passed as jwt_payload we'll have the user's id.
  // Using Mongoose's `.findOneById()` method, we find the user in our database
  User.findById(jwt_payload.id)
    // To pass the user on to our route, we use the `done` method that
    // that was passed as part of the callback.  The first parameter of
    // done is an error, so we'll pass null for that argument and then
    // pass the user doc from Mongoose
    .then(user => done(null, user))
    // If there was an error, we pass it to done so it is eventually handled
    // by our error handlers in Express
    .catch(err => done(err));
});

// Now that we've constructed the strategy, we 'register' it so that
// passport uses it when we call the `passport.authenticate()`
// method later in our routes
passport.use(strategy);

// Initialize the passport middleware based on the above configuration
passport.initialize();

// Create a variable that holds the authenticate method so we can
// export it for use in our routes
const requireToken = passport.authenticate('jwt', { session: false });

// Create a function that takes the request and a user document
// and uses them to create a token to send back to the user
const createUserToken = (req, user) => {
  // Make sure that we have a user, if it's null that means we didn't
  // find the email in the database.  If there is a user, make sure
  // that the password is correct.  For security reason, we don't want
  // to tell the client whether the email was not found or that the
  // password was incorrect.  Instead we send the same message for both
  // making it much harder for hackers.
  if (
    !user ||
    !req.body.password ||
    !bcrypt.compareSync(req.body.password, user.password)
  ) {
    const err = new Error('The provided username or password is incorrect');
    err.statusCode = 422;
    throw err;
  }
  // If no error was thrown, we create the token from user's id and
  // return the token
  return jwt.sign({ id: user._id }, secret, { expiresIn: 36000 });
};

module.exports = {
  requireToken,
  createUserToken
};
```

### Add Signin Controller

Now that we have a way to create a token for users when they login, we can add the logic to our `/signin` route.

1. Open the `controllers/users.js` file.
1. Use destructuring to require `createUserToken` from the auth file:

```js
const { createUserToken } = require('../middleware/auth');
```

3. Update the `/signin` route as follows:

```js
// SIGN IN
// POST /api/signin
router.post('/signin', (req, res, next) => {
  User.findOne({ email: req.body.email })
    // Pass the user and the request to createUserToken
    .then(user => createUserToken(req, user))
    // createUserToken will either throw an error that
    // will be caught by our error handler or send back
    // a token that we'll in turn send to the client.
    .then(token => res.json({ token }))
    .catch(next);
});
```

Go test signing up in Postman!!! Use a POST request that has a body containing an JSON object with an email and hashed password (copy it from what you got back when you signed up). You should now see a response that looks like:

```js
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlNGQ4NWE0ODE4ODVhM2Q4ZjE5NTNhNSIsImlhdCI6MTU4MjIwMjAyNSwiZXhwIjoxNTgyMjM4MDI1fQ.OgmgQQ_yRyAKZlqGSglrFRjpbEwB5CnKj3HxyhznTss"
}
```

We're so close to done now! All that's left is to set up our job route to use the token! Add and commit your changes.

[View Commit](../../commit/28961ba)

## Add Authorization

Along with authenticating the user, we now have to handle user authorization. What's the difference? When the user logs into the system successfully, we _authenticate_ them based on the credentials they send (such as a proper combination of email and password). Authorization means determining whether the user is actually authorized to perform some action in the system. Just because you're logged in, doesn't mean you have the 'keys to the kingdom'.

With the token, we can determine which user is making a request. With that information, we can determine if the specific user making the request is _authorized_ to carry out a specific action, such as create documents or delete or update a specific document.

1. Update the handleValidateId function in `middleware/error_handler.js` as follows:

```js
const handleValidateOwnership = (req, document) => {
  const ownerId = document.owner._id || document.owner;
  // Check if the current user is also the owner of the document
  if (!req.user._id.equals(ownerId)) {
    throw new OwnershipError();
  } else {
    return document;
  }
};
```

2. Open the `controllers/jobs.js`.
3. Add `handleValidateOwnership` to the destructured require statement for error handlers.

```js
const {
  handleValidateId,
  handleRecordExists,
  handleValidateOwnership
} = require('../middleware/custom_errors');
```

4. Update the POST, PUT and DELETE routes as follows:

```js
// CREATE
// POST api/jobs
router.post('/', requireToken, (req, res, next) => {
  Job.create({ ...req.body, owner: req.user._id })
    .then(job => res.status(201).json(job))
    .catch(next);
});

// UPDATE
// PUT api/jobs/5a7db6c74d55bc51bdf39793
router.put('/:id', handleValidateId, requireToken, (req, res, next) => {
  Job.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true
  })
    .then(handleRecordExists)
    .then(job => handleValidateOwnership(req, job))
    .then(job => {
      res.json(job);
    })
    .catch(next);
});

// DESTROY
// DELETE api/jobs/5a7db6c74d55bc51bdf39793
router.delete('/:id', handleValidateId, requireToken, (req, res, next) => {
  Job.findOneAndDelete({
    _id: req.params.id
  })
    .then(handleRecordExists)
    .then(job => handleValidateOwnership(req, job))
    .then(job => {
      res.sendStatus(204);
    })
    .catch(next);
});
```

Phew... that was a lot! All that's left now is to add the sign out feature.

### Add Signout Controller

JWT tokens automatically expire after a certain amount of time. In our case, the tokens are set to expire after 10 hours. The token cannot technically be invalidated during this time. However, we can send an empty token when the user clicks sign out, which our front end can interpret to mean that the user should be forced to login again. The act of logging in would create a new token with a new expiration time.

1. Add the controller for the `/signout` route in the `controllers/users.js` as follows:

```js
// SIGN OUT
// DELETE /signout
router.delete('/signout', requireToken, (req, res, next) => {
  res.json({ token: '' });
});
```

Technically, we're done. In the next section, we'll cover how to test the new routes in Postman and how to use them in the front end of our application.

Congrats for sticking with it this far! :champagne:

[View Commit](../../commit/c151689)
