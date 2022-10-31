//https://medium.com/jeremy-gottfrieds-tech-blog/javascript-tutorial-record-audio-and-encode-it-to-mp3-2eedcd466e78
import {Tracking as Tracker} from "./tracking.js"
import {analyzeInputRows, getArtihumanGuess, resetArtihuman, setArtihumanSlots} from "./artihuman.js"
import {AutoPlayer as AutoPlayer} from "./autoPlayer.js";


  'use strict';

  function retrieveArtiHumanOptions() {
    let inputElements=document.getElementsByName("test")
    let artiHumanOptions = [];
    for(let i=0;i < inputElements.length;++i) {
      if(inputElements[i].checked) {
        artiHumanOptions.push(inputElements[i].value);
      }
    }
    return artiHumanOptions;
  }


  let code = [] // Color sequence the player needs to guess
  let guess = [], // Color sequence of player's guesses
    gameWonOrLost = null,
    hint = [],
    slots = null,
    hintStorage = [
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0],
    ],
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
    artihuman_button = document.getElementById('artihuman'),
    autoplay_input = document.getElementById('autoplayinput'),
    autoplay_button = document.getElementById('autoPlay'),
    artihuman_select = document.getElementById('artihumanselect'),



    rowIncrement = 1,
    hintIncrement = 1;
    export const pegs = {
      1: 'green',
      2: 'purple',
      3: 'red',
      4: 'yellow',
      5: 'blue',
      6: 'brown'
    };
  let startTime = null,
    endTime = null;
  let track = new Tracker();

  startOverlay.className = 'show';

  async function readUserData() {
    track.userId = await track.readUserId();
    //console.log("userId in main.js: "+track.userId);
    track.gameId = await track.readLastGameId(track.userId);

    //new increase new gameId by 1
    track.gameId++;
    //("gameId in main.js: "+track.gameId);
  }

  async function gameSetup() {
    generateSecretCode(1, 7);
    startTime = performance.now();
    // Add event listener to every code option button
    for (let i = 0; i < options.length; i++) {
      options[i].addEventListener('click', insertGuess, false);
    }

    let nameInput = document.getElementById('nameInput');
    nameInput.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        document.getElementById('submitName').click();
      }
    });
    document.getElementById('newGame').onclick = newGame;
    document.getElementById('delete').onclick = deleteLast;
    document.getElementById('submit').onclick = submitGuess;
    document.getElementById('submitName').onclick = submitName;
    document.getElementById('submit').disabled = true;
    document.getElementById('submitFeedback').onclick = submitFeedback;
    document.getElementById('submitFeedback').disabled = true;
    document.getElementById('info').onclick = showInfo;
    document.getElementById('close-info').onclick = hideInfo;
    document.getElementById('overSelect').onclick = showCheckboxes;
    document.getElementById('artihuman').onclick = askArtihuman;
    document.getElementById('autoPlay').onclick = autoPlay;


    //artihuman_button.onclick = askArtihuman;
    //autoplay_button.onclick = autoPlay;

    //infoOverlay.className = '';
    track.gameId++;
    console.log(`Code: ${code}`)

  }

  async function askArtihuman() {
    //ev.preventDefault();
    analyzeInputRows(inputRows, hintStorage);
    guess = await getArtihumanGuess();
    //console.log("Artihuman guess:", guess)
    await setArtihumanSlots(guess);

    document.getElementById("submit").disabled = false;
    document.getElementById('inputfield').value = 'I asked ArtiHuman to make a move';
    artihuman_button.disabled = true;
  }

  async function autoPlay() {
    //ev.preventDefault();
    //artihuman_button.click()
    let autoPlayer = await new AutoPlayer(document.getElementById('autoplayinputfield').value);
    await autoPlayer.play();
  }

  function showInfo() {
    infoOverlay.className = 'show';
  }

  function hideInfo() {
    infoOverlay.className = '';
  }

  function showCheckboxes() {
    let checkboxes =  document.getElementById("checkboxes");
    if(checkboxes.style.display === "none"){
      checkboxes.style.display="block";
    } else {
      checkboxes.style.display="none";
    }
}

  export function getCurrentSlots() {
    return inputRows[inputRows.length - rowIncrement].getElementsByClassName('socket');
  }

  function insertGuess() {
    let self = this;
    slots = getCurrentSlots();
    if (guess.length < 4) {
      //console.log(`Are slots even defined? slots => ${slots}, guess => ${guess}`)
      slots[guess.length].className = slots[guess.length].className + ' peg ' + self.id; // Insert node into page
      guess.push(+(self.value));
      //console.log(inputRows[7].getElementsByClassName('socket')[0].className)
      //slots[0].className = 'socket peg red'
      //console.log(`slots: ${slots[0].className}`)
      //console.log(`guess: ${guess}`)
    }

    if (guess.length == 4) {
      document.getElementsByTagName('textarea')[0].className = 'ignored';
      document.getElementById("submit").disabled = false;
    }

  }

  function compare() {
    let isMatch = true;
    let codeCopy = code.slice(0);

    // First check if there are any pegs that are the right color in the right place
    for (let i = 0; i < code.length; i++) {
      if (guess[i] === code[i]) {
        insertPeg('hit');
        codeCopy[i] = 0;
        guess[i] = -1;
        hint.push('b');
      } else
        isMatch = false;
    }

    // Then check if there are any pegs that are the right color but NOT in the right place
    for (let j = 0; j < code.length; j++) {
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

    let sockets = hintContainer[hintContainer.length - hintIncrement].getElementsByClassName('js-hint-socket');

    sockets[0].className = 'socket ' + type;

    hintStorage[hintContainer.length - hintIncrement].pop();
    hintStorage[hintContainer.length - hintIncrement].unshift(type);
    //console.log(`hintStorage from main.js: ${JSON.stringify(hintStorage)}`);
  }

  function deleteLast() {
    if (guess.length !== 0) {
      let slots = inputRows[inputRows.length - rowIncrement].getElementsByClassName('socket');
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

  function submitGuess() {

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

        track.addFeedback(rowIncrement, feedbackTemp);

        document.getElementById('inputfield').value = '';
        document.getElementById('inputfield').className = '';
        document.getElementById('inputfield').style.borderColor = '';

        if (compare()) {
          track.won = true;
          gameState('won');
          gameWonOrLost = 'won';
          console.log("gameWonOrLost compare() =>", gameWonOrLost);
        } else rowIncrement += 1;

        if (rowIncrement === inputRows.length + 1 && !compare()) {
          track.won = false;
          gameWonOrLost = 'lost';
          gameState('lost');
        }
      } else {
        let myArray = ['Red','Yellow','Pink', 'Cyan'];
        document.getElementById('inputfield').style.borderColor = myArray[(Math.random() * myArray.length) | 0]

      }

      artihuman_button.disabled = false;

    }
  }

  async function newGame() {
    //saveGameTracker
    guess = [];        // Reset guess array
    hint = [];
    await clearBoard();

    rowIncrement = 1;  // Set the first row of sockets as available for guesses
    hintIncrement = 1; // Set the first row of sockets as available for hints
    await hideModal();
    await resetArtihuman();
    await gameSetup();// Prepare the game
  }

  async function hideModal() {
      modalOverlay.className = 'show';
      await showRestart();
  }

  async function showRestart() {
    restart.className = '';
  }

  function hideRestart() {
    restart.className = 'hidden';
  }

  function submitName() {
    let name =  document.getElementById('nameInput').value.slice(0);
    if (name != '' && name.length >= 3) {
      track.playerName = name
      hideStartOverlay();
      readUserData();
    }
    let artiHumanPlayersList = ['Steve', 'OliverBot']

    if(!artiHumanPlayersList.includes(track.playerName)) {
      artihuman_button.style.display="none";
      autoplay_input.style.display="none";
      artihuman_select.style.display="none";
    }
  }

  async function clearBoard() {
      // Clear the guess sockets
      for (let i = 0; i < inputRows.length; i++) {
        inputRows[i].innerHTML = '';
        for (let j = 0; j < 4; j++) {
          let socket = document.createElement('div');
          socket.className = 'socket';
          inputRows[i].appendChild(socket);
        }
      }

      // Clear the hint sockets
      for (let i = 0; i < hintContainer.length; i++) {
        let socketCollection = hintContainer[i].getElementsByClassName('socket');
        for (let j = 0; j < 4; j++) {
          socketCollection[j].className = 'js-hint-socket socket';
        }
      }

      // Clear hintStorage
      hintStorage = [
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
      ]

      // Reset secret code sockets
      for (let i = 0; i < secretSockets.length; i++) {
        secretSockets[i].className = 'secret socket';
        secretSockets[i].innerHTML = '?';
      }

      // Reset background
      document.getElementsByTagName('body')[0].className = '';

      // Reset gameWonOrLost
      console.log("gameWonOrLost before =>", gameWonOrLost);
      gameWonOrLost = null;
      console.log("gameWonOrLost before =>", gameWonOrLost);
  }

  function hideStartOverlay(){
    startOverlay.className = '';
  }

  function showStartOverlay(){
    startOverlay.className = 'show';
  }

  // Creates a color sequence that the player needs to guess
  function generateSecretCode(min, max) {
    for (let i = 0; i < 4; i++) {
      code[i] = Math.floor(Math.random() * (max - min)) + min;
    }

    //code = [2,2,2,1];
    track.correctCode = code.slice(0,4);
  }

  // Once the player runs out of guesses or crack the code - the sequence is revealed
  function revealCode() {
    for (let i = 0; i < secretSockets.length; i++) {
      secretSockets[i].className += ' ' + pegs[code[i]];
      secretSockets[i].innerHTML = ''; // Remove "?" from the socket
    }
  }

  function gameOver() {
    // Disable color options
    for (let i = 0; i < options.length; i++)
      options[i].removeEventListener('click', insertGuess, false);

    revealCode();
  }

  function gameState(state) {
    track.write2File();
    track.write2Database();
    //track.downloadFile();
    gameOver();
    document.getElementsByTagName('body')[0].className = state;
    modalOverlay.className = state;

    if (state === 'won') {
      modalMessage.innerHTML = '<h1 style="color:white;">You cracked the code!</h1> <p style="color:white;">Great! You are awesome! Try another round...</p> <button class="large" id="hideModal">OK</button> <button id="restartGame" class="large primary">Restart</button>';
      document.getElementById('restartGame').onclick = newGame;
      document.getElementById('hideModal').onclick = hideModal;
    } else
      modalMessage.innerHTML = '<h1 style="color:white;">You failed...</h1> <p style="color:white;">What a shame... Look on the bright side - you weren\'t even close.</p> <button class="large" id="hideModal">OK</button> <button id="restartGame" class="large primary">Restart</button>';
    document.getElementById('restartGame').onclick = newGame;
    document.getElementById('hideModal').onclick = hideModal;
  }

  function getGuess() {
    return guess
  }

  function getInputRows() {
    return inputRows;
  }

  function getHintStorage() {
    return hintStorage;
  }

  function getRowIncrement() {
    return rowIncrement;
  }

  function getArtiHumanOptions() {
    return retrieveArtiHumanOptions();
  }

  function getGameWonOrLost() {
    return gameWonOrLost;
  }

  gameSetup(); // Run the game

  export {getGuess, getInputRows, getHintStorage, getRowIncrement,
          getArtiHumanOptions, getGameWonOrLost, askArtihuman,
          submitGuess, newGame};





