# Overview 
This page will guide You how [`surprise-crud`](https://www.npmjs.com/package/surprise-crud) package works. <br> 
<br>
Please check out also my [surprisejs-cors](https://www.npmjs.com/package/surprisejs-cors) library, which setup cors in Your express app very quickly, with small amount of work from Your side.

## Prerequisites
You will need the following things installed on your computer.
At this moment, this package works only with MongoDB and Express, but soon will be working also with PostgreSQL database and Koa.js framework

* [Node.js](http://nodejs.org/) (with NPM)
* [Express](http://expressjs.com/)
* [MongoDB](http://mongodb.com/)
* [Mongoose](https://mongoosejs.com/)

* Project configured with: 
	* working `express.Router()`, 
	* working connection to MongoDB
	* bodyParser

* or just use my example app below.

# [Example app](https://github.com/RobertMrowiec/surprise-crud-example-app)

# Setup

## Installation

Just simply install package with npm: </br>
`npm install --save surprise-crud`

After installing package, go to any of Your route file ( or create new one ) and import package:

```
import { crud } from 'surprise-crud'
```
OR
```
const { crud } = require('surprise-crud')
```

Your imports should now looks like:

```
const express = require('express');
const router = express.Router();
const { crud } = require('surprise-crud')
```

Now we can move to configuration.


# Configuration
After setup, just add this line to Your router file: 

```
crud(model, router, options)
```

You probably think, what model and options are? So let's start talking about how this CRUD function works. <br>

`model`
It's the first argument. I'm sure You have a model for Your collection already, but if not: 
* read [Mongoose Models docs](https://mongoosejs.com/docs/models.html),
* create model, 
* import it to route file
* replace the first argument with Your model.

`router`
It's the second argument which You already have imported from express.Router().

`options`
**THIS ARGUMENT IS OPTIONAL!** <br>
This is the last argument. `options` is an object containing: 
```
{
	sort: String (You can pass here any name of key from collection. Default is 'createdAt')
	methods: Array of strings (You can pass here any of available methods mentioned below in Available Methods section. By default all of them are selected)
	pathFromCollection: { type: Boolean, default: true } (described below)
}
```

# Available Methods

***Get*** and ***GetPagination*** methods also includes filtering which is optional! (more in section `Filtering`)

*  Get 
```
Method: GET, path: /?filter=key&filterBy=value
```
*  GetById 
```
Method: GET, path: /:id
```
*  GetPagination
```
Method: GET, path: /page/:page/limit/:limit?filter=key&filterBy=value
```
*  Post
```
Method: POST, path: /
```
*  Put
```
Method: PUT, path: /:id
```
*  Delete
```
Method: DELETE, path: /:id
```

# URLs 
**By default URLs for Your endpoints are `/api/your-collection-name/:method`, cause pathFromCollection option is set to TRUE**

You can disable it by setting 
```
{
	pathFromCollection: false
}
```
in `options` object and defining endpoint name on Your own as first parameter of `app.use()` in Your app

## Endpoints name examples

------------------------

* Collection name: Users
* Example method: Get
* HTTP Method: GET
* Path: /api/users

------------------------

* Collection name: Users
* Example method: GetPagination
* HTTP Method: GET
* Path: /api/users/page/:page/limit/:limit

------------------------

* Collection name: Projects
* Example method: Post
* HTTP Method: POST
* Path: /api/projects

------------------------

* Collection name: Projects
* Example method: Put
* HTPP Method: PUT
* Path: /api/projects/:id

------------------------

# Filtering

Filters are built of:
* `filter`
is a key which You want to compare from Model

* `filterBy`
is a value which You're looking for in `filter` key

Example: <br>
Imagine we have a User model which has 3 keys: `name`, `surname`, `age`.
```
	User: {
		name: String,
		surname: String,
		age: Number
	}
```

What if we want to find every User whose name is Patrick?:

```
api/users?filter=name&filterBy=Patrick
```

We want to paginate them with limit 5 per page?:

```
api/users/page/1/limit/5?filter=name&filterBy=Patrick
```

# Real code examples

:heavy_exclamation_mark: [Example app](https://github.com/RobertMrowiec/surprise-crud-example-app) :heavy_exclamation_mark:

* Example route file with only Get and GetById method and sort by name: 

_routes/currencies/route.js_

```
const express = require('express');
const router = express.Router();
const Currency = require('../models/Currency');
const { crud } = require('surprise-crud');

crud(Currency, router, { methods: ['Get', 'GetById'], sort: 'name' });

module.exports = router;
```

Endpoints:
```
	Method: GET, path: /api/currencies
	Method: GET, path: /api/currencies/5ca253b595477000045187b2
```
------------------------
* Example route file with custom route name ( `pathFromCollection` set to false ) : 

_routes/users/route.js_

```
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { crud } = require('surprise-crud');

crud(User, router, { pathFromCollection: false });

module.exports = router;
```

and You have to define route name in Your app.use():

_app.js_

```
app.use('/superusers', require('./routes/users/route'))
```

Endpoints:
```
	Method: GET,    path: /api/superusers
	Method: GET,    path: /api/superusers/page/1/limit/5
	Method: GET,    path: /api/superusers/5ca253b595477000045187b2
	Method: POST,   path: /api/superusers
	Method: PUT,    path: /api/superusers/5ca253b595477000045187b2
	Method: DELETE, path: /api/superusers/5ca253b595477000045187b2
```

------------------------
* Example route file with every methods ( remember they're default, so if You don't pass any method array, every method will be available ) and default sort: 

_routes/users/route.js_

```
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { crud } = require('surprise-crud');

crud(User, router);

module.exports = router;
```

Endpoints:
```
	Method: GET,    path: /api/users
	Method: GET,    path: /api/users/page/1/limit/5
	Method: GET,    path: /api/users/5ca253b595477001055a47b2
	Method: POST,   path: /api/users
	Method: PUT,    path: /api/users/5ca253b595477001055a47b2
	Method: DELETE, path: /api/users/5ca253b595477001055a47b2
```

* Example with doing everything in app.js without external files: 

_app.js_

```
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const Currency = require('../models/Currency');
const { crud } = require('surprise-crud');

const app = express()
const router = express.Router();

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(crud(Currency, router, { methods: ['Post', 'Delete'] }));

//rest of stuff to start server
```

Endpoints:
```
	Method: POST, path: /api/currencies
	Method: DELETE, path: /api/currencies/5ca253b935377011053a47b2
```
------------------------


# Tests
`Soon`

# Problems 
If You get some problems, don't be afraid to contact or create an issue :)

# Links

## Github
	https://github.com/RobertMrowiec/surprise-crud

## NPM
	https://www.npmjs.com/package/surprise-crud
