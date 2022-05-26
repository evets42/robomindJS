//import {pegs} from "./main.js";
import {getGuess, getInputRows, getHintStorage, getCurrentSlots, getRowIncrement} from "./main.js";

const pegs = {
    1: 'green',
    2: 'purple',
    3: 'red',
    4: 'yellow',
    5: 'blue',
    6: 'brown'
};
const reverse_pegs = {
    'green': 1,
    'purple': 2,
    'red': 3,
    'yellow': 4,
    'blue': 5,
    'brown': 6
}

//create a memory dict for every color
let memory = buildMemory(pegs);
let numberGameMoves = 0;
let numberArtiMoves = 0;

//let inputRows = getInputRows();


// Todo otherwise : count hints (how many b how many w)

function buildMemory(pegs) {
    let temp_memory = {};

    for (let key in pegs) {
        temp_memory[key] = {
            isInSecret: false,    // Color is certainly in the secret
            maybeInSecret: false,   // Color was played at least once and might be in the secret
            notInSecret: false, // Color is certainly not in the secret
            whites: [0,0,0,0],
            blacks: [0,0,0,0],
            inPosition: [0, 0, 0, 0] // +1 is definitely on this position, 0 no information, -1 definitely NOT in this position
        } // TODO Add to memory, in which position the color received how many hints of black and white
    }
    //Initialize storage for used Combinations
    temp_memory['dumpCombinations'] = [];

    //If white and black hints add up to 4, all of the colors HAVE to be in the secret code -> save them
    temp_memory['correctColors'] = [[],[]];

    //Memorize the best guess as bestGuess:[colorId,colorId,colorId,colorID],[b,w]]
    temp_memory['bestGuess'] = [[0,0,0,0],[0,0]];

    return temp_memory;
}

export function analyzeInputRows(inputRows, hintStorage) {
    let numberGameMoves_bool = false;
        for (let k = inputRows.length - 1; k >= 0; k--) {

            let currentSlots = inputRows[k].getElementsByClassName('socket');
            let currentHints = hintStorage[k];
            // console.log('currentHints: ',currentHints);

            let {b, w} = countBandW(currentHints);
            console.log(`row ${k} - b: ${b} / w: ${w}`)
            let currentRow = [];
            for (let i = 0; i <= currentSlots.length; i++) {
                let counter_numberGameMoves = inputRows.length - k;
                if (currentSlots[i] != null && currentSlots[i].className == 'socket' && !numberGameMoves_bool) {
                    numberGameMoves = counter_numberGameMoves;
                    numberGameMoves_bool = true;
                    console.log("numberGameMoves: ",numberGameMoves);
                }
                if (currentSlots[i] != null && currentSlots[i].className !== 'socket') {
                    //console.log('currentSlots[i]: ',currentSlots[i].className)
                    let color = currentSlots[i].className.substring(11)
                    let colorId = reverse_pegs[color];

                    currentRow.push(colorId);
                    //console.log('color: ',color);
                    //console.log('colorId: ',colorId);
                    //memory[colorId]['notInSecret'] = true;
                    // If no black or white hints - all colors are definitely not in the secret
                    if (b === 0 && w === 0) {
                        memory[colorId]['notInSecret'] = true;
                        memory[colorId]['maybeInSecret'] = false;
                    } else {
                        // Check if color is already certainly not in the secret, if not: continue
                        if (memory[colorId]['notInSecret'] === false) {
                            // If black or white pegs together are 4, then all colors of this round are certainly in the secret
                            if (b + w === 4) {
                                console.log("BandW = ",b," ",w);
                                memory[colorId]['isInSecret'] = true;
                                memory['correctColors'][0][i] = colorId;
                                if (i === 0) {memory['correctColors'][1] = [b,w];}

                                console.log("correctColors are",JSON.stringify(memory['correctColors'], null, 2));
                            }
                            if (b == 0 && w >= 0) {
                                memory[colorId]['inPosition'][i] = -1;
                            }

                            // If a color was in a combination which received mor than 0 black or white it might be in the code
                            // Flag, that color was used
                            memory[colorId]['maybeInSecret'] = true;

                            // Add amount of black and white hints the color received in its current position
                            memory[colorId]['blacks'][i] = parseInt(memory[colorId]['blacks'][i]) + b;
                            memory[colorId]['whites'][i] = parseInt(memory[colorId]['whites'][i]) + w;
                            //console.log(`memory: ${memory[1]['whites']}`);
                            //console.log(`memory: ${memory[1]['blacks']}`);
                        }
                    }
                }
            }
            if (currentRow.length !== 0 && !checkIfGuessWasUsed(currentRow)) {
                memory['dumpCombinations'].push(currentRow);
            }
        }
        console.log(JSON.stringify(memory, null, 2));
}

function nextGuess_v1() {
    let possibleColors = null;
    if (memory['correctColors'].length === 0) {
        console.log("correctColors == 0");
        possibleColors = setOfValidColors();
    } else {
        console.log("correctColors is this", memory['correctColors']);
        possibleColors = memory['correctColors'];
    }

    //console.log(possibleColors);
    //console.log(typeof nextGuess_v1[0]);
    let artiHumanGuess = guessRandom(possibleColors);
    //console.log(typeof temp[0]);
    console.log("numberArtiMoves: ", numberArtiMoves);
    if (numberArtiMoves === 4 || numberArtiMoves === 7) {
        console.log("now guess on evidence");
        artiHumanGuess = guessOnEvidence(possibleColors);
    }
    // TODO REWRITE GUESSONRANDOM_V2 SO IT INCLUDES CHECK FOR BLOCKED COLOR POSITIONS!!!

    //console.log('temp: ', artiHumanGuess);
    return artiHumanGuess;
}

function nextGuess_v2() {
    let possibleColors = null;
    if (memory['correctColors'][0].length === 0) {
        console.log("correctColors == 0");
        possibleColors = setOfValidColors();
    } else if (memory['correctColors'][0].length === 4) {
      return guessOnShuffle();
    } else {
        console.log("correctColors is this", memory['correctColors']);
        possibleColors = memory['correctColors'][0];
    }
    let artiHumanGuess = guessRandom(possibleColors);
    // TODO If one guess has 4 hints filled then only change colors!
    if (numberGameMoves === 1) {
        artiHumanGuess = startWithAABB(possibleColors);
    } else if (numberGameMoves === 4 || numberGameMoves === 8) {
        artiHumanGuess = guessOnEvidence_v2(possibleColors);
    } else {
        artiHumanGuess = guessRandom_v2(possibleColors);
    }
    return artiHumanGuess;
}

function guessOnLastGuess() {

}

function guessOnEvidence(possibleColors) {
    let finalGuess = [0,0,0,0];
    let counter = [0,0,0,0]
    for (let i = 0; i < finalGuess.length; i++) {
        for (let key in pegs) {
            if (memory[key]['notInSecret'] === false) {
                // blacks have higher factor 2 weight than whites // 1.5 is just a gut feeling
                let sumOfBandW = 1.5 * parseFloat(memory[key]['blacks'][i]) + parseFloat(memory[key]['whites']);

                if (counter[i] < sumOfBandW) {
                    finalGuess[i] = parseInt(key);
                    counter[i] = sumOfBandW;
                }
                console.log(`i: ${i}, Key: ${key}, finalGuess: ${finalGuess}, counter: ${counter}, sumOfBandW: ${sumOfBandW}`)
            }
        }
    }
    // Check if guess was already played, if yes, choose random socket to replace with random valid color
    while (checkIfGuessWasUsed(finalGuess)) {
        let outSocket = Math.floor(Math.random() * 4);
        finalGuess[outSocket] = guessRandom(possibleColors)[outSocket];
    }

    return finalGuess;
}

function guessOnEvidence_v2(possibleColors) {
    let finalGuess = [0,0,0,0];
    let counter = [0,0,0,0]



    //TODO SAVE THE HINTS IN WHICH CORRECT COLORS OCCURRED ->
    // how many B and W? -> How many sockets are to change
    //->




    //TODO CREATE KIND OF A GUESS RANKING: Which guess got the most correct hints so far?


    for (let i = 0; i < finalGuess.length; i++) {
        for (let key in pegs) {
            // Check if this color is in secret
            if (memory[key]['notInSecret'] === false) {
                if (memory[key]['inPosition'][i] === 1) {
                    finalGuess[i] = key;
                } else if (memory[key]['inPosition'][i] === -1) {
                    continue;
                } else {
                    // blacks have higher factor than whites // 1.5 is just a gut feeling
                    let sumOfBandW = 1.5 * parseFloat(memory[key]['blacks'][i]) + parseFloat(memory[key]['whites']);

                    if (counter[i] < sumOfBandW) {
                        finalGuess[i] = parseInt(key);
                        counter[i] = sumOfBandW;
                    }
                    //console.log(`i: ${i}, Key: ${key}, finalGuess: ${finalGuess}, counter: ${counter}, sumOfBandW: ${sumOfBandW}`)
                }
            }
        }
    }
    // Check if guess was already played, if yes, check which positions are not certain
    // -> choose random socket to replace with random valid color
    while (checkIfGuessWasUsed(finalGuess)) {
        let uncertainPositions = [];
        for (let i = 0; i < finalGuess.length; i++) {
            // Evaluate which positions are not certain (no Information if color here is correct or not)
            if (memory[finalGuess[i]]['inPosition'][i] === 0) {
                uncertainPositions.push(i);
            }
        }
        // Pick random position from uncertainPositions list as the socket to change
        let outSocket = uncertainPositions[Math.floor(Math.random() * uncertainPositions.length)];
        // Generate random color from possible colors and add it to finalGuess
        finalGuess[outSocket] = guessRandom_v2(possibleColors)[outSocket];
    }
    return finalGuess;
}

function guessOnShuffle(noSlotsToChange) {
    // TODO BUGS: Uses already used combinations --> implement something
    


    let guessBasis = [0,0,0,0];
    //TODO CHECK IF CORRECT COLORS = 4
    // -> ONLY SORT
    //console.log("length of correctColors: ", memory['correctColors'][0].length);
    if (memory['correctColors'][0].length === 4) {
        // In here we will save the finalGuess we will return
        let finalGuess = [];

        // Take last guess with all correct colors as basis
        guessBasis = memory['correctColors'][0].slice(0);

        // Set loop count, we keep track how often we go through the process, so we can do different things every iteration
        let loopCount = 0;

        // In this array we save all slots which are are not 100% certain
        let availableSlots = [];

        // In this array we save all slots which are 100% certain and should not be changed
        let frozenSlots = new Set();


        // Fill available Slots and frozen slots arrays
        for (let i = 0; i < guessBasis.length; i++) {
            // If we are certain, that this Slot is correctly set, then freeze it (don't change it)
            if (memory[memory['correctColors'][0][i]]['inPosition'][i] === 1) {
                frozenSlots.add(i);
            } else {
                availableSlots.push(i);
            }
        }

        // Transfer frozen slots in finalGuess
        frozenSlots.forEach(element => {finalGuess[element] = guessBasis[element]});


        // In this Set we keep track how many Slots we changed
        let changedSlots = new Set();


        // Set random start to do something different every loop
        let changeSlotA = availableSlots[Math.floor(Math.random() * availableSlots.length)];


        while (availableSlots.length !== 0 &&  changedSlots.size < noSlotsToChange) {
            for (let k = changeSlotA+1; k < guessBasis.length; k++) {
                // random Start - go through available Slots and search for a suitable changeSlotB
                // Criteria: changeSlotB is not frozen && the color from SlotB can be in SlotA
                if (!frozenSlots.has(k) &&
                    memory[guessBasis[changeSlotA]]['inPosition'][k] !== -1) {
                    finalGuess[changeSlotA] = guessBasis[k];
                    availableSlots.splice(changeSlotA, 1)
                    changedSlots.add(changeSlotA);
                    changedSlots.add(k);

                    console.log(`I change slot ${changeSlotA} color: ${guessBasis[changeSlotA]} with slot ${k} color: ${guessBasis[k]}`);
                    console.log(`I still have ${availableSlots.length} pins to change`);


                    if (availableSlots.length !== 0) {
                        changeSlotA = availableSlots[0];
                    }
                }
            }
        }



        do {
            // How many pins have to be changed?
            let noPinsToChange = memory['correctColors'][1][1];
            console.log(`LoopLoop: ${loopCount}`);
            // Loop through the guess number of pins to change minus 1 times
            let changedSlots = [];
            for (let i = 0; i < guessBasis.length; i++) {
                console.log(`I changed these slots: ${changedSlots}`);
                // Check if we know that the pin we want to change is certainly in this position
                // AND the slot was not changed before
                if (memory[memory['correctColors'][0][i]]['inPosition'][i] === 1 || changedSlots.includes(i)) {
                    console.log(`with ${i} I continue`)
                    continue;
                } else {
                    console.log(`with ${i} I go into else`)
                    // From the slot to change, go right in the guessBasis list and search for a color which is possible for this slot
                    // --> change those 2 slots
                    // Start from 1 slot to the right, if the guess was already used
                    let loopCount_i = i + loopCount;
                    console.log(`It is ${loopCount} and +i it is ${loopCount_i}`);

                    while (noPinsToChange > 0) {
                        if (changedSlots.includes(i)) {
                            console.log(`I break loop because ${i} is in ${changedSlots}`);
                            break;
                        }
                        let changeSet = new Set([0,1,2,3]);
                        changeSet.delete(i);

                        
                        let changeSlotA = i;
                        let changeColorA = guessBasis[changeSlotA];
                        let changeSlotB = changeSet[Math.floor(Math.random() * changeSet.size)];
                        let changeColorB = guessBasis[changeSlotB];



                        if (memory[guessBasis[changeSlotB]]['inPosition'][changeSlotA] !== -1 &&
                            memory[guessBasis[changeSlotA]]['inPosition'][changeSlotB] !== -1) {

                            console.log(`I change slot ${changeSlotA} color: ${guessBasis[i]} with slot ${changeSlotB} color: ${guessBasis[k]}`);
                            console.log(`I still have ${noPinsToChange} pins to change`);

                            // Switch color to other slot
                            guessBasis[changeSlotA] = changeColorB;
                            guessBasis[changeSlotB] = changeColorA;

                            noPinsToChange = noPinsToChange-2;

                            // remember which pins changed
                            changedSlots.push(changeSlotA);
                            changedSlots.push(changeSlotB);

                        }
                    }
                }
                loopCount++;
            }
            // Emergency exit for while loop --> algorithm cannot determine the solutions left
            if (loopCount >= 6) {
                console.log(`I take the emergency exit`);
                break;
            }
            console.log(`%cfinalGuess @ end of while loop is: ${guessBasis}`, 'color: green;');
        } while (checkIfGuessWasUsed(guessBasis))
        return finalGuess;
    }
}

function guessRandom(possibleColors) {
    let randomGuess = [];
    // console.log(possibleColors, randomGuess)
    console.log('possibleColors: ', possibleColors);
    for (let i = 0; i < 4; i++) {
        randomGuess[i] = possibleColors[Math.floor(Math.random() * possibleColors.length)];
        //console.log(possibleColors, randomGuess)
        //console.log("randomGuess: ", randomGuess);
    }
    return randomGuess;
}

function guessRandom_v2(possibleColors) {
    let randomGuess = [];
    for (let i = 0; i < 4; i++) {
        do {
            randomGuess[i] = possibleColors[Math.floor(Math.random() * possibleColors.length)];
        } while (memory[randomGuess[i]]['inPosition'][i] === -1);
    }
    return randomGuess;
}

function startWithAABB(possibleColors) {
    let colorAABB = possibleColors.slice(0);
    let A = colorAABB[Math.floor(Math.random() * colorAABB.length)];
    let out = colorAABB.splice(A,1);
    let B = 0;
    do {B = colorAABB[Math.floor(Math.random() * colorAABB.length)];}
    while (A === B)
    return [A,A,B,B];
}

function checkIfGuessWasUsed(guess) {
    //if (memory['dumpCombinations'])
    for (let dumpCombination of memory['dumpCombinations']) {
        //console.log(dumpCombination, guess);
        if(JSON.stringify(dumpCombination) === JSON.stringify(guess)) {
            return true;
        }
    }
    return false;
}

function setOfValidColors() {
    let setOfColors = [];
    for (let key in pegs) {
        //console.log(key);
        //console.log("memory", JSON.stringify(memory, null, 2));
        if (memory[key]['notInSecret'] === false) {
            setOfColors.push(parseInt(key));
        }
    }
    return setOfColors;
}

function countBandW(hints) {
    let b = 0;
    let w = 0;
    console.log(`This are the hints: ${hints}`)
    for (let i = 0; i < hints.length; i++) {
        if (hints[i] != null) {
            //console.log(`this is a hint for row: ${hints[i]}`)
            if (hints[i] === 'hit') {
                b++;
            }
            if (hints[i] == 'almost') {
                w++;
            }
        }
        console.log(`countBandW[${i}]: b${b}, w${w}`)
    }
    return {b, w};
}

export function resetArtihuman() {
    numberArtiMoves = 0;
    memory = buildMemory(pegs);
}

export function getArtihumanGuess() {
    numberArtiMoves++;
    return nextGuess_v2();
    // return [1,1,2,2];
}

export function setArtihumanSlots(guess) {
    console.log("guess in setSlots: ", guess);
    let slots = getCurrentSlots();
    for (let i = 0; i < guess.length; i++) {
        slots[i].className = `socket peg ${pegs[guess[i]]}`;
    }
    //return slots;
}

