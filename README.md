![logo](https://raw.githubusercontent.com/RobertMrowiec/surprisejs-images/master/logo-black.png)

SurpriseJS is an open-source JavaScript library / express bootstrapper which easily generates your Node.js backend with MongoDB database connection with just a few clicks.

<i> *At this moment it works only with above-mentioned framework and DB, but soon will also work with PostgreSQL and Koa.js. Every help is appreciated. </i>

:blue_book: [Documentation page](https://robertmrowiec.github.io/SurpriseJS) :orange_book:

This library can generate: 

* Core of Node.js application
* Basic CRUD (with pagination and filtering)
* Routes with models
* Auth (by JsonWebToken) with authorization middleware
* CORS

## Things left to do:
* [ ] Select between JS and TS
* [ ] Koa.js with PostgreSQL
* [ ] File handler with AWS S3, Firebase Storage and local directory
* [ ] Setup tests

## Prerequisites
You will need the following things installed on your computer.

* [Node.js](http://nodejs.org/) (with NPM)
* [MongoDB](http://mongodb.com/)

# Setup
## Installation

Just simply install package with npm globally:

`npm install -g surprisejs`

# Configuration

Just type `surprisejs` in Your terminal and select one of available methods described in section below:

* `auth`
* `core`
* `cors`
* [`crud`](https://robertmrowiec.github.io/surprise-crud-page)
* `route`

More in documentation page :)
