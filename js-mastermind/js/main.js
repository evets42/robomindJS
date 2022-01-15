
import Tracker from "./tracking.js";
/*
class Tracker {

  constructor() {
    this.gameID = ""
    this.playerName = ""
    this.won = ""
    this.game = {}
    this.rounds = {}
    this.hints = {}
    this.turnTimes = {}
    this.feedback = {}
  }

  addRound(noRound, roundGuess) {
    if (!(noRound in this.rounds)) {
      this.rounds[noRound] = roundGuess;
    }
    console.log(`Round Added. Current rounds:${JSON.stringify(this.rounds)}`);
  }

  addTurnTime(noRound, startTime, endTime) {
    if (!(noRound in this.turnTimes)) {
      this.turnTimes[noRound] = Math.round(endTime - startTime);
    }
    console.log(`TurnTime Added. Current times:${JSON.stringify(this.turnTimes)}`);
  }

  addHint(noRound, hint) {
    if (!(noRound in this.hints)) {
      this.hints[noRound] = hint;
    }
    console.log(`Hint Added. Current hints:${JSON.stringify(this.hints)}`);
  }

  addFeedback(noRound, feedback) {
    if (!(noRound in this.feedback)) {
      this.feedback[noRound] = feedback;
    }
    console.log(`Feedback Added. Current Feedback:${JSON.stringify(this.feedback)}`);
  }

  saveGameTracker() {
    //  this.game[this.gameID] = (this.won, this.rounds, this.turnTimes, this.hints);
  }

  clearTemp() {
    this.won = null;
    this.rounds = {};
    this.hints = {};
    this.turnTimes = {};
  }

  write2File() {
    this.gameData = {
      gameID: this.gameID,
      playerName: this.playerName,
      won: this.won,
      noRounds: this.rounds.length,
      rounds: this.rounds,
      turnTimes_ms: this.turnTimes,
      hints: this.hints
    };

    localStorage.setItem('GameData', JSON.stringify(this.gameData));
    this.clearTemp();
  }

  downloadFile() {
    let blob = new Blob([JSON.stringify(this.gameData, null, 2)], { type: 'application/json' });

    var saveBlob = (function () {
      var a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";
      return function (blob, fileName) {
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      };
    }());
    saveBlob(blob, `${this.gameID}_gameData.json`);
  }

}
//module.exports.Tracker = Tracker;
*/
(function () {
  'use strict';


  let code = [], // Color sequence the player needs to guess
    guess = [], // Color sequence of player's guesses
    hint = [],
    options = document.getElementsByClassName('option'),
    inputRows = document.getElementsByClassName('guess'),
    hintContainer = document.getElementsByClassName('hint'),
    secretSockets = document.getElementsByClassName('secret socket'),
    modalOverlay = document.getElementById('modalOverlay'),
    modalMessage = document.getElementById('modalMessage'),
    infoOverlay = document.getElementById('infoOverlay'),
    instructions = document.getElementById('instructions'),
    rowIncrement = 1,
    hintIncrement = 1,
    pegs = {
      1: 'green',
      2: 'purple',
      3: 'red',
      4: 'yellow',
      5: 'blue',
      6: 'brown'
    },
    startTime = null,
    endTime = null;
  let track = new Tracker();
  track.gameID = 0;
  track.playerName = 'Player1';

  function gameSetup() {
    generateSecretCode(1, 7);
    startTime = performance.now();
    // Add event listener to every code option button
    for (var i = 0; i < options.length; i++)
      options[i].addEventListener('click', insertGuess, false);

    document.getElementById('newGame').onclick = newGame;
    document.getElementById('delete').onclick = deleteLast;
    document.getElementById('submit').onclick = submitGuess;
    document.getElementById("submit").disabled = true;
    document.getElementById('submitFeedback').onclick = submitFeedback;
    document.getElementById('submitFeedback').disabled = true;
//   document.getElementById('inputfield').disabled = true;
    document.getElementById('info').onclick = showInfo;
    document.getElementById('close-info').onclick = showInfo;
    infoOverlay.className = '';

    track.gameID++;
    console.log(`Code: ${code}`)

  }

  function showInfo() {

    if (infoOverlay.className == '') {
      infoOverlay.className = 'show';
      console.log('deine mama');
      return
    }
    if (infoOverlay.className == 'show') {
      infoOverlay.className = '';
      console.log('deine mama2');
    }

  }

  function insertGuess() {
    var self = this;
    var slots = inputRows[inputRows.length - rowIncrement].getElementsByClassName('socket');
    if (guess.length < 4) {
      slots[guess.length].className = slots[guess.length].className + ' peg ' + self.id; // Insert node into page
      guess.push(+(self.value));
    }

    if (guess.length == 4) {
      document.getElementsByTagName('textarea')[0].className = 'ignored';
      document.getElementById("submit").disabled = false;
    }

  }

  function compare() {
    var isMatch = true;
    var codeCopy = code.slice(0);

    // First check if there are any pegs that are the right color in the right place
    for (var i = 0; i < code.length; i++) {
      if (guess[i] === code[i]) {
        insertPeg('hit');
        codeCopy[i] = 0;
        guess[i] = -1;
        hint.push('b');
      } else
        isMatch = false;
    }

    // Then check if there are any pegs that are the right color but NOT in the right place
    for (var j = 0; j < code.length; j++) {
      if (codeCopy.indexOf(guess[j]) !== -1) {
        insertPeg('almost');
        hint.push('w');
        codeCopy[codeCopy.indexOf(guess[j])] = 0;
      }
      // - ADD HINTS GOT IN CURRENT ROUND
      track.addHint(rowIncrement, hint);
    }

    hintIncrement += 1; // Set the next row of hints as available
    guess = [];         // Reset guess sequence
    hint = [];
    return isMatch;
  }

  function insertPeg(type) {
    var sockets = hintContainer[hintContainer.length - hintIncrement].getElementsByClassName('js-hint-socket');
    sockets[0].className = 'socket ' + type;
  }

  function deleteLast() {
    if (guess.length !== 0) {
      var slots = inputRows[inputRows.length - rowIncrement].getElementsByClassName('socket');
      slots[guess.length - 1].className = 'socket'; // Insert node into page
      guess.pop();
      document.getElementById("submit").disabled = true;
    }
  }

  function submitFeedback(ev) {
    ev.preventDefault();
    //console.log(document.getElementById('inputfield').value);
    track.addFeedback(rowIncrement, document.getElementById('inputfield').value);
    document.getElementById('inputfield').value('');
  }

  function submitGuess(ev) {


    if (guess.length === 4) {

      document.getElementById("submit").disabled = true;

      let guessTemp = guess.slice();
      // TRACKER INPUT
      // - ADD GUESSES IN CURRENT ROUND
      track.addRound(rowIncrement, guessTemp);

      // - ADD TURNTIME IN CURRENT ROUND
      endTime = performance.now();
      track.addTurnTime(rowIncrement, startTime, endTime);
      startTime = performance.now();


      ev.preventDefault();

      let feedbackTemp = document.getElementById('inputfield').value.slice(0);
      track.addFeedback(rowIncrement, feedbackTemp);

      document.getElementById('inputfield').value = '';
      document.getElementById('inputfield').className = '';


      if (compare()) {
        track.won = true;
        gameState('won');
      }
      else
        rowIncrement += 1;

    }
    if (rowIncrement === inputRows.length + 1 && !compare())
      gameState('lost');

  }

  function newGame() {
    //saveGameTracker
    guess = [];        // Reset guess array
    hint = [];
    clearBoard();
    rowIncrement = 1;  // Set the first row of sockets as available for guesses
    hintIncrement = 1; // Set the first row of sockets as available for hints
    hideModal();
    gameSetup();           // Prepare the game
  }

  function hideModal() {
    modalOverlay.className = '';
  }


  function clearBoard() {
    // Clear the guess sockets
    for (var i = 0; i < inputRows.length; i++) {
      inputRows[i].innerHTML = '';
      for (var j = 0; j < 4; j++) {
        var socket = document.createElement('div');
        socket.className = 'socket';
        inputRows[i].appendChild(socket);
      }
    }

    // Clear the hint sockets
    for (var i = 0; i < hintContainer.length; i++) {
      var socketCollection = hintContainer[i].getElementsByClassName('socket');
      for (var j = 0; j < 4; j++) {
        socketCollection[j].className = 'js-hint-socket socket';
      }
    }

    // Reset secret code sockets
    for (var i = 0; i < secretSockets.length; i++) {
      secretSockets[i].className = 'secret socket';
      secretSockets[i].innerHTML = '?';
    }

    document.getElementsByTagName('body')[0].className = ''; // Reset background
  }

  // Creates a color sequence that the player needs to guess
  function generateSecretCode(min, max) {
    for (var i = 0; i < 4; i++)
      code[i] = Math.floor(Math.random() * (max - min)) + min;
  }

  // Once the player runs out of guesses or crack the code - the sequence is revealed
  function revealCode() {
    for (var i = 0; i < secretSockets.length; i++) {
      secretSockets[i].className += ' ' + pegs[code[i]];
      secretSockets[i].innerHTML = ''; // Remove "?" from the socket
    }
  }

  function gameOver() {
    // Disable color options
    for (var i = 0; i < options.length; i++)
      options[i].removeEventListener('click', insertGuess, false);

    revealCode();
  }

  function gameState(state) {
    track.write2File();
    track.downloadFile();
    gameOver();
    document.getElementsByTagName('body')[0].className = state;
    modalOverlay.className = state;

    if (state === 'won') {
      modalMessage.innerHTML = '<h2>You cracked the code!</h2> <p>Great! You are awesome! Try another round...</p> <button class="large" id="hideModal">OK</button> <button id="restartGame" class="large primary">Restart</button>';
      document.getElementById('restartGame').onclick = newGame;
      document.getElementById('hideModal').onclick = hideModal;
    } else
      modalMessage.innerHTML = '<h2>You failed...</h2> <p>What a shame... Look on the bright side - you weren\'t even close.</p> <button class="large" id="hideModal">OK</button> <button id="restartGame" class="large primary">Restart</button>';
    document.getElementById('restartGame').onclick = newGame;
    document.getElementById('hideModal').onclick = hideModal;
  }

  gameSetup(); // Run the game




}());


