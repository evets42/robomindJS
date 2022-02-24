
import Tracker from "./tracking.js"

(function () {
  'use strict';


  let code = [], // Color sequence the player needs to guess
    guess = [], // Color sequence of player's guesses
    hint = [],
    options = document.getElementsByClassName('option'),
    restart = document.getElementById('restart'),
    inputRows = document.getElementsByClassName('guess'),
    hintContainer = document.getElementsByClassName('hint'),
    secretSockets = document.getElementsByClassName('secret socket'),
    modalOverlay = document.getElementById('modalOverlay'),
    modalMessage = document.getElementById('modalMessage'),
    infoOverlay = document.getElementById('infoOverlay'),
    startOverlay = document.getElementById('startOverlay'),
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

  startOverlay.className = 'show';
  //let Recorder = new Rec;
  //track.gameId = 0;
  //Simulate name entering overlay
  //track.playerName = 'Steve';
  async function readUserData() {
    track.userId = await track.readUserId();
    console.log("userId in main.js: "+track.userId);
    track.gameId = await track.readLastGameId(track.userId);

    //new increase new gameId by 1
    track.gameId++;
    console.log("gameId in main.js: "+track.gameId);
  }

  function gameSetup() {
    generateSecretCode(1, 7);
    startTime = performance.now();
    // Add event listener to every code option button
    for (var i = 0; i < options.length; i++)
      options[i].addEventListener('click', insertGuess, false);

    document.getElementById('newGame').onclick = newGame;
    document.getElementById('delete').onclick = deleteLast;
    document.getElementById('submit').onclick = submitGuess;
    document.getElementById('submitName').onclick = submitName;
    document.getElementById("submit").disabled = true;
    document.getElementById('submitFeedback').onclick = submitFeedback;
    document.getElementById('submitFeedback').disabled = true;
//   document.getElementById('inputfield').disabled = true;
    document.getElementById('info').onclick = showInfo;
    document.getElementById('close-info').onclick = hideInfo;
    infoOverlay.className = '';
    track.gameId++;
    console.log(`Code: ${code}`)
  }

  function showInfo() {
    infoOverlay.className = 'show';
  }

  function hideInfo() {
    infoOverlay.className = '';
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
      document.getElementById('inputfield').className = '';
    }
  }

  function submitFeedback(ev) {
    ev.preventDefault();
    //console.log(document.getElementById('inputfield').value);
    track.addFeedback(rowIncrement, document.getElementById('inputfield').value);
    document.getElementById('inputfield').value('');
  }

  function submitGuess(ev) {

    let feedbackTemp = document.getElementById('inputfield').value.slice(0);

    if (guess.length === 4) {

      if (feedbackTemp.length >= 10) {
        hideRestart();

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

        track.addFeedback(rowIncrement, feedbackTemp);

        document.getElementById('inputfield').value = '';
        document.getElementById('inputfield').className = '';
        document.getElementById('inputfield').style.borderColor = '';

        if (compare()) {
          track.won = true;
          gameState('won');
        } else rowIncrement += 1;

        if (rowIncrement === inputRows.length + 1 && !compare()) {
          track.won = false;
          gameState('lost');
        }
      } else {
        let myArray = ['Red','Yellow','Pink', 'Cyan'];
        document.getElementById('inputfield').style.borderColor = myArray[(Math.random() * myArray.length) | 0]

      }
    }
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
    modalOverlay.className = 'show';
    showRestart();
  }

  function showRestart() {
    console.log("showRestart");
    restart.className = '';
  }

  function hideRestart() {
    console.log("hideRestart")
    restart.className = 'hidden';
  }

  function submitName() {
    let name =  document.getElementById('nameInput').value.slice(0);
    if (name != '' && name.length >= 3) {
      track.playerName = name
      hideStartOverlay();
      readUserData();
    }
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

  function hideStartOverlay(){
    startOverlay.className = '';
  }

  function showStartOverlay(){
    startOverlay.className = 'show';
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
    track.write2Database();
    track.downloadFile();
    gameOver();
    document.getElementsByTagName('body')[0].className = state;
    modalOverlay.className = state;

    if (state === 'won') {
      modalMessage.innerHTML = '<h1>You cracked the code!</h1> <p>Great! You are awesome! Try another round...</p> <button class="large" id="hideModal">OK</button> <button id="restartGame" class="large primary">Restart</button>';
      document.getElementById('restartGame').onclick = newGame;
      document.getElementById('hideModal').onclick = hideModal;
    } else
      modalMessage.innerHTML = '<h1>You failed...</h1> <p>What a shame... Look on the bright side - you weren\'t even close.</p> <button class="large" id="hideModal">OK</button> <button id="restartGame" class="large primary">Restart</button>';
    document.getElementById('restartGame').onclick = newGame;
    document.getElementById('hideModal').onclick = hideModal;
  }

  gameSetup(); // Run the game

}());


