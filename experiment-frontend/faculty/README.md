# Probability of superiority experiment

## Running the experiment

To play with the experiment, you can open up `index.html` in a web browser directly, or push this repository to github pages and access it there. Note that it is designed to work with mechanical turk, so it expects the following parameters in the URL:

* turkSubmitTo
* hitId
* workerId
* assignmentId

The code also involves submitting timestamped logs to our Azure server, which will fail unless the website is hosted on particular hosts.

## Development

To make changes to the HTML/CSS, those changes can be made directly (`./index.html` and `dist/prob.css`) and committed to the repository.

Changes to javascript (contained in `src`) must be compiled through webpack. Steps:

1. Install node.js. I am using node LTS, version v14.17.0, which comes with the node package manager, npm.
2. Install javascript dependencies. From the command line, with this directory as the working directory, type `node install`.
3. Compile webpack by typing `npx webpack`.

The minified output is then copied into `dist/prob.js`.

To run unit tests, run `npx jest`.