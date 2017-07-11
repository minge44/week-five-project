const express = require('express');
const expressValidator = require('express-validator');
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const session = require('express-session');//required for file system
const sessionConfig = require("./user");
const fs = require('file-system');
const app = express();
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

function getWord() {
  let randomWord;
  let wordLength = 0;//Functions to get words from local file.
  let wordFound = false;

  while (!wordFound) {
    let randomNumber = Math.floor((Math.random() * words.length-1) + 1)
    randomWord = words[randomNumber];
    wordLength = randomWord.length;  //Random word generator
          wordFound = true;
          break;
  }
  return randomWord.toUpperCase();  //makes word uppercase
};

function play(words) {
  var showText = [];
  for (let i = 0; i < words.word.length; i++) {
    if (words.lettersGuessed.indexOf(words.word[i]) > -1) {
       showText.push(words.word[i].toUpperCase());
     } else {
       if (words.lose == true) {
          showText.push(words.word[i].toUpperCase());
       } else {
          showText.push(' '); //pushes umpty [] into showText
       }
     }
  }  return showText;
};


app.engine("mustache", mustacheExpress());//routes
app.set("views", "./public");
app.use("/", express.static("./public"));
app.use(session(sessionConfig));
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator());
app.set("view engine", "mustache");



app.use(function (req, res, next) {
  var words = req.session.words;

  if (!words) {
    words = req.session.words = {};
    words.guessesLeft = 8;
    words.status = '';
    words.lose = false;
    words.btnText = 'PLAY';
    words.playing = false;
    words.display = '';
    words.lettersGuessed = [];
  }
  next();
});

app.get('/', function(req, res) {
  if (req.session.words.playing) {
    req.session.words.display = play(req.session.words);
  }
  res.render('index', { words: req.session.words });
});




app.post('/', function(req, res) {
  var words = req.session.words;
  if (words.playing) {
    req.checkBody("guessLetter", "You must enter a letter!").notEmpty();
    var errors = req.validationErrors();
    if (errors) {
      words.message = errors[0].msg;
    } else {
      if (words.lettersGuessed.indexOf(req.body.guessLetter.toUpperCase()) > -1) {
        words.message = 'Guessed Already ' + req.body.guessLetter.toUpperCase();;

      } else {
        var n = words.word.indexOf(req.body.guessLetter.toUpperCase());
        if (n == -1) {
          words.message = 'WRONG!';
          words.guessesLeft -= 1;
          words.lettersGuessed.push(req.body.guessLetter.toUpperCase());
          if (words.guessesLeft == 0) {
            words.status = 'You lose!';
            words.display = req.session.words.word;
            words.playing = false;
            words.lose = true;
          }
        } else {
          words.lettersGuessed.push(req.body.guessLetter.toUpperCase());
          words.message = '';
          req.session.words.display = play(req.session.words);
          if (words.display.indexOf(' ') ==  -1) {
            words.status = 'You win!';
            words.playing = false;
            words.lose = false;
            words.btnText = req.session.words.status;
          }
        }
      }
    }
  } else {  //Resets the game
    words.playing = true;
    words.word = getWord(words.mode);
    words.lose = false;
    words.guessesLeft = 8;
    words.lettersGuessed = [];
    words.btnText = 'Play Game';
  }

  res.redirect('/');
});





app.listen(3000, function(){
  console.log('Started express application!')
});
